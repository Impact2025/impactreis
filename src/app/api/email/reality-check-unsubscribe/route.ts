import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

function page(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f3f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:420px;margin:80px auto;padding:0 20px;text-align:center;">
    <p style="font-size:11px;color:#7D8C7B;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;margin:0 0 16px;">Sparren.app</p>
    <h1 style="font-size:22px;font-weight:700;color:#2f312f;margin:0 0 12px;">${title}</h1>
    <p style="font-size:14px;color:#444842;line-height:1.6;">${message}</p>
  </div>
</body>
</html>`;
}

// Publiek, geen auth: het token is de enige sleutel, zodat afmelden ook werkt zonder account
// (reality_check_leads zijn prospects, geen ingelogde users — zie src/lib/db/schema.ts).
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return new NextResponse(page('Ongeldige link', 'Deze afmeldlink is niet geldig.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const rows = await sql(
    `UPDATE reality_check_leads SET unsubscribed = TRUE WHERE unsubscribe_token = $1 RETURNING id`,
    [token]
  );

  if (rows.length === 0) {
    return new NextResponse(page('Link niet gevonden', 'Deze afmeldlink is verlopen of onbekend.'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new NextResponse(
    page('Afgemeld', 'Je ontvangt geen vervolgmails meer van de Executive Reality Check.'),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
