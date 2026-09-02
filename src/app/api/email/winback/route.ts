import { NextRequest, NextResponse } from 'next/server';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { sql } from '@/lib/db';
import { winbackEmail } from '@/lib/email-templates';
import { recordEmailSent, unsubscribeUrl } from '@/lib/email-recipients';

const STAGES = [3, 10, 30] as const;

// Cron, dagelijks: 3 stadia (3 / 10 / 30 dagen zonder ochtendritueel), elk stadium hoogstens
// één keer ooit per gebruiker (via de 'winback_N' email_sends-rijen) — geen dagelijkse spam
// zodra iemand eenmaal is afgehaakt, en het stadium "vangt" ook een gemist cron-run alsnog op
// (>= drempel, niet exact op de dag).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://reis.weareimpact.nl';

  const results: Record<string, number> = {};

  for (const stage of STAGES) {
    const emailType = `winback_${stage}`;
    const recipients = await sql(
      `SELECT u.id AS user_id, u.email, ep.unsubscribe_token
       FROM users u
       LEFT JOIN email_preferences ep ON ep.user_id = u.id
       LEFT JOIN (
         SELECT user_id, MAX(timestamp) AS last_activity FROM daily_logs GROUP BY user_id
       ) last_log ON last_log.user_id = u.id::text
       WHERE COALESCE(ep.winback, TRUE) = TRUE
         AND COALESCE(last_log.last_activity, u.created_at) < NOW() - $1 * INTERVAL '1 day'
         AND NOT EXISTS (
           SELECT 1 FROM email_sends es WHERE es.user_id = u.id AND es.email_type = $2
         )`,
      [stage, emailType]
    );

    let sent = 0;
    for (const r of recipients) {
      const userId = r.user_id as number;
      const email = r.email as string;
      const token = r.unsubscribe_token as string | null;
      const unsubUrl = token ? unsubscribeUrl(token, 'winback') : undefined;
      const { subject, html } = winbackEmail(stage, appUrl, unsubUrl);

      try {
        const { error } = await getResend().emails.send({ from: FROM_EMAIL, to: email, subject, html });
        if (error) throw new Error(JSON.stringify(error));
        await recordEmailSent(userId, emailType);
        sent++;
      } catch (err) {
        console.error(`winback (stage ${stage}): send failed for user ${userId}:`, err);
      }
    }
    results[emailType] = sent;
  }

  return NextResponse.json({ ok: true, sent: results });
}
