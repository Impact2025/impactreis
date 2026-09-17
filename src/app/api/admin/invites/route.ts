import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

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

  return NextResponse.json({ invite: invite ?? null });
}
