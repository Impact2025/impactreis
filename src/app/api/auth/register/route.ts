import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { sql } from '@/lib/db';
import { registerSchema } from '@/lib/schemas/auth.schema';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = registerSchema.parse(body);

    // Check if user exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hashedPassword})
      RETURNING id, email, created_at
    `;

    const user = result[0];

    // Generate JWT
    const token = generateToken(user.id, user.email);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      token,
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}