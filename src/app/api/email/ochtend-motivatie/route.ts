import { NextRequest, NextResponse } from 'next/server';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { motivatieEmail } from '@/lib/email-templates';
import { getRecipients, recordEmailSent, unsubscribeUrl } from '@/lib/email-recipients';

const DAY_NAMES = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const EMAIL_TYPE = 'morning_motivation';

export async function GET(request: NextRequest) {
  // Vercel cron auth
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://reis.weareimpact.nl';

  const now = new Date();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  const dayName = DAY_NAMES[day];

  // Multi-tenant fan-out: elke gebruiker met deze mail aan, die 'm vandaag nog niet kreeg.
  // Sequentieel (niet Promise.all) zodat één falende send de rest niet blokkeert.
  const recipients = await getRecipients(EMAIL_TYPE, EMAIL_TYPE);
  let sent = 0;
  const failures: string[] = [];

  for (const recipient of recipients) {
    const unsubUrl = recipient.unsubscribeToken ? unsubscribeUrl(recipient.unsubscribeToken, 'morning_motivation') : undefined;
    const { subject, html } = motivatieEmail(appUrl, isWeekend, dayName, unsubUrl);

    try {
      const { error } = await getResend().emails.send({ from: FROM_EMAIL, to: recipient.email, subject, html });
      if (error) throw new Error(JSON.stringify(error));
      await recordEmailSent(recipient.userId, EMAIL_TYPE);
      sent++;
    } catch (err) {
      console.error(`ochtend-motivatie: send failed for user ${recipient.userId}:`, err);
      failures.push(recipient.email);
    }
  }

  return NextResponse.json({ ok: true, sent, failed: failures.length, recipients: recipients.length });
}
