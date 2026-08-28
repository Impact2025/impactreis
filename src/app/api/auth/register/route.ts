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

    // Elke nieuwe registratie krijgt een eigen organisatie (self-serve Starter-tier).
    // Slug is niet gegarandeerd uniek op basis van het e-mail-lokale-deel alleen, dus we
    // botsen desnoods met een suffix — organizations.slug heeft een UNIQUE constraint.
    const emailLocalPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const orgSlug = `${emailLocalPart}-${Date.now().toString(36)}`;
    const orgResult = await sql`
      INSERT INTO organizations (slug, name, plan)
      VALUES (${orgSlug}, ${email}, 'starter')
      RETURNING id
    `;
    const organizationId = orgResult[0].id;

    // Create user
    const result = await sql`
      INSERT INTO users (email, password_hash, organization_id)
      VALUES (${email}, ${hashedPassword}, ${organizationId})
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