import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { inviteEmail } from '@/lib/email-templates';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invites = await sql`
    SELECT id, email, invited_at FROM invited_emails ORDER BY invited_at DESC
  `;

  return NextResponse.json({ invites });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email } = await request.json();
  const normalized = typeof email === 'string' ? email.toLowerCase().trim() : '';
  if (!normalized || !normalized.includes('@')) {
    return NextResponse.json({ error: 'Ongeldig e-mailadres' }, { status: 400 });
  }

  const [invite] = await sql`
    INSERT INTO invited_emails (email) VALUES (${normalized})
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email, invited_at
  `;

  // Alleen bij een nieuwe uitnodiging mailen — ON CONFLICT DO NOTHING geeft geen rij terug
  // (en dus geen dubbele mail) als het adres al was uitgenodigd.
  if (invite) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sparren.app';
    const { subject, html } = inviteEmail(appUrl);
    try {
      const { error } = await getResend().emails.send({ from: FROM_EMAIL, to: normalized, subject, html });
      if (error) console.error('Invite email failed (invite still created):', error);
    } catch (err) {
      console.error('Invite email failed (invite still created):', err);
    }
  }

  return NextResponse.json({ invite: invite ?? null });
}
