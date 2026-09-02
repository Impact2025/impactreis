import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { EmailPrefColumn } from '@/lib/email-recipients';

const VALID_TYPES: EmailPrefColumn[] = [
  'morning_motivation',
  'morning_reminder',
  'weekly_report',
  'streak_celebration',
  'onboarding_nudge',
  'winback',
];

const LABELS: Record<EmailPrefColumn, string> = {
  morning_motivation: 'ochtend-motivatie',
  morning_reminder: 'ochtend-herinnering',
  weekly_report: 'weekrapport',
  streak_celebration: 'streak-vieringen',
  onboarding_nudge: 'onboarding-herinneringen',
  winback: 'terugkom-mails',
};

function page(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f3f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:420px;margin:80px auto;padding:0 20px;text-align:center;">
    <p style="font-size:11px;color:#7D8C7B;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;margin:0 0 16px;">myAiPA</p>
    <h1 style="font-size:22px;font-weight:700;color:#2f312f;margin:0 0 12px;">${title}</h1>
    <p style="font-size:14px;color:#444842;line-height:1.6;">${message}</p>
  </div>
</body>
</html>`;
}

// Publiek, geen auth: dat is het hele punt van one-click unsubscribe. Het token is de enige
// sleutel — geen JWT nodig, zodat afmelden ook werkt zonder ingelogd te zijn.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const type = searchParams.get('type') as EmailPrefColumn | null;

  if (!token || !type || !VALID_TYPES.includes(type)) {
    return new NextResponse(page('Ongeldige link', 'Deze afmeldlink is niet geldig.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const rows = await sql(
    `UPDATE email_preferences SET ${type} = FALSE, updated_at = NOW() WHERE unsubscribe_token = $1 RETURNING user_id`,
    [token]
  );

  if (rows.length === 0) {
    return new NextResponse(page('Link niet gevonden', 'Deze afmeldlink is verlopen of onbekend.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new NextResponse(
    page('Afgemeld', `Je ontvangt geen ${LABELS[type]} meer. Je andere myAiPA-mails blijven gewoon binnenkomen — pas je voorkeuren aan in de instellingen als je meer wilt uitzetten.`),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
