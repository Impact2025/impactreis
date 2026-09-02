import { NextRequest, NextResponse } from 'next/server';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { sql } from '@/lib/db';
import { herinneringEmail } from '@/lib/email-templates';
import { getRecipients, recordEmailSent, unsubscribeUrl } from '@/lib/email-recipients';

const EMAIL_TYPE = 'morning_reminder';

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return Math.ceil((days + start.getDay() + 1) / 7);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://reis.weareimpact.nl';

  const now = new Date();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  const today = now.toISOString().split('T')[0];
  const weekNum = getWeekNumber(now);
  const year = now.getFullYear();

  // Multi-tenant fan-out: elke gebruiker met deze mail aan die 'm vandaag nog niet kreeg, MINUS
  // wie het ritueel/de week review al heeft afgerond (die hoeft geen herinnering).
  const recipients = await getRecipients('morning_reminder', EMAIL_TYPE);
  let sent = 0;
  let skippedDone = 0;
  const failures: string[] = [];

  for (const recipient of recipients) {
    let alreadyDone = false;

    if (isWeekend) {
      const reviews = await sql`
        SELECT id FROM weekly_reviews
        WHERE user_id = ${recipient.userId}
          AND week_number = ${String(weekNum)}
          AND EXTRACT(YEAR FROM timestamp) = ${year}
        LIMIT 1
      `;
      alreadyDone = reviews.length > 0;
    } else {
      const logs = await sql`
        SELECT id FROM daily_logs
        WHERE user_id = ${recipient.userId}
          AND type = 'morning'
          AND date_string = ${today}
        LIMIT 1
      `;
      alreadyDone = logs.length > 0;
    }

    if (alreadyDone) {
      skippedDone++;
      continue;
    }

    const unsubUrl = recipient.unsubscribeToken ? unsubscribeUrl(recipient.unsubscribeToken, 'morning_reminder') : undefined;
    const { subject, html } = herinneringEmail(appUrl, isWeekend, unsubUrl);

    try {
      const { error } = await getResend().emails.send({ from: FROM_EMAIL, to: recipient.email, subject, html });
      if (error) throw new Error(JSON.stringify(error));
      await recordEmailSent(recipient.userId, EMAIL_TYPE);
      sent++;
    } catch (err) {
      console.error(`ochtend-herinnering: send failed for user ${recipient.userId}:`, err);
      failures.push(recipient.email);
    }
  }

  return NextResponse.json({ ok: true, sent, skippedDone, failed: failures.length, recipients: recipients.length });
}
