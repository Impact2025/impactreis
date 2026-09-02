import { NextRequest, NextResponse } from 'next/server';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { sql } from '@/lib/db';
import { onboardingNudgeEmail } from '@/lib/email-templates';
import { recordEmailSent, unsubscribeUrl } from '@/lib/email-recipients';

const EMAIL_TYPE = 'onboarding_nudge';

// Cron, dagelijks: iedereen die zich >24u geleden registreerde maar de AI-intake nog niet heeft
// afgerond, krijgt precies één keer deze nudge (niet elke dag opnieuw — vandaar de "ooit al
// verstuurd?"-check i.p.v. de "vandaag al verstuurd?"-check die de andere fan-out routes gebruiken).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://reis.weareimpact.nl';

  const recipients = await sql`
    SELECT u.id AS user_id, u.email, ep.unsubscribe_token
    FROM users u
    LEFT JOIN email_preferences ep ON ep.user_id = u.id
    LEFT JOIN onboarding_profiles op ON op.user_id = u.id
    WHERE COALESCE(ep.onboarding_nudge, TRUE) = TRUE
      AND (op.completed IS NULL OR op.completed = FALSE)
      AND u.created_at < NOW() - INTERVAL '1 day'
      AND NOT EXISTS (
        SELECT 1 FROM email_sends es WHERE es.user_id = u.id AND es.email_type = ${EMAIL_TYPE}
      )
  `;

  let sent = 0;
  const failures: string[] = [];

  for (const r of recipients) {
    const userId = r.user_id as number;
    const email = r.email as string;
    const token = r.unsubscribe_token as string | null;
    const unsubUrl = token ? unsubscribeUrl(token, 'onboarding_nudge') : undefined;
    const { subject, html } = onboardingNudgeEmail(appUrl, unsubUrl);

    try {
      const { error } = await getResend().emails.send({ from: FROM_EMAIL, to: email, subject, html });
      if (error) throw new Error(JSON.stringify(error));
      await recordEmailSent(userId, EMAIL_TYPE);
      sent++;
    } catch (err) {
      console.error(`onboarding-nudge: send failed for user ${userId}:`, err);
      failures.push(email);
    }
  }

  return NextResponse.json({ ok: true, sent, failed: failures.length, candidates: recipients.length });
}
