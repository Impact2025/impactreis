import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { sql } from '@/lib/db';
import { resetWachtwoordEmail } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used       BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json() as { email: string };
    if (!email) return NextResponse.json({ error: 'E-mail verplicht' }, { status: 400 });

    await ensureTable();

    const users = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`;

    // Always return 200 to avoid leaking whether the email exists
    if (users.length === 0) return NextResponse.json({ ok: true });

    const userId = users[0].id as number;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt})
    `;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://impactreis.vercel.app';
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

    const { subject, html } = resetWachtwoordEmail(resetUrl);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mijn Ondernemers OS <onboarding@resend.dev>',
      to: email,
      subject,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
