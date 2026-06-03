import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json() as { token: string; password: string };

    if (!token || !password) {
      return NextResponse.json({ error: 'Token en wachtwoord zijn verplicht' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Wachtwoord moet minimaal 6 tekens zijn' }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, user_id FROM password_reset_tokens
      WHERE token = ${token}
        AND used = FALSE
        AND expires_at > NOW()
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Link is ongeldig of verlopen. Vraag een nieuwe link aan.' },
        { status: 400 }
      );
    }

    const { id: tokenId, user_id: userId } = rows[0] as { id: number; user_id: number };

    const hash = await bcrypt.hash(password, 10);

    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;
    await sql`UPDATE password_reset_tokens SET used = TRUE WHERE id = ${tokenId}`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
