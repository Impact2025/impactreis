import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { sql } from '@/lib/db';
import { loginSchema } from '@/lib/schemas/auth.schema';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const users = await sql`
      SELECT id, email, password_hash, created_at
      FROM users
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = generateToken(user.id, user.email);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}