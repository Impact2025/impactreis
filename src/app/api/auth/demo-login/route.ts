import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { generateToken } from '@/lib/auth';

/**
 * Demo-login — publiek toegankelijk met één gedeeld wachtwoord (DEMO_PASSWORD).
 *
 * Iedereen die het juiste demo-wachtwoord invult, krijgt een JWT voor het gedeelde
 * demo-account (demo@impactreis.nl). Het wachtwoord staat in DEMO_PASSWORD in de
 * environment; de hash wordt (upsert) in de DB gezet zodat de bestaande login-flow
 * (bcrypt.compare) ook zonder deze route blijft werken.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { password?: string };
    const supplied = body.password ?? '';

    const demoEmail = process.env.DEMO_EMAIL || 'demo@impactreis.nl';
    const demoPassword = process.env.DEMO_PASSWORD;

    // Zonder demo-wachtwoord geconfigureerd: nooit toelaten
    if (!demoPassword) {
      return NextResponse.json({ error: 'Demo niet geconfigureerd' }, { status: 503 });
    }

    if (!timingSafeEqual(supplied, demoPassword)) {
      return NextResponse.json({ error: 'Ongeldig demo-wachtwoord' }, { status: 401 });
    }

    // Demo-gebruiker opzoeken; password_hash upserten zodat bcrypt.compare in login werkt
    const users = await sql`SELECT id, email, password_hash FROM users WHERE email = ${demoEmail}`;
    const hash = await bcrypt.hash(demoPassword, 12);

    let user;
    if (users.length === 0) {
      // Demo-gebruiker aanmaken in de gedeelde demo-organisatie
      const orgs = await sql`SELECT id FROM organizations WHERE slug = 'demo-impactreis'`;
      let orgId;
      if (orgs.length > 0) {
        orgId = orgs[0].id;
      } else {
        const o = await sql`INSERT INTO organizations (slug, name, plan) VALUES ('demo-impactreis', 'Demo ImpactReis', 'starter') RETURNING id`;
        orgId = o[0].id;
      }
      const r = await sql`
        INSERT INTO users (email, password_hash, organization_id, role)
        VALUES (${demoEmail}, ${hash}, ${orgId}, 'member')
        RETURNING id, email
      `;
      user = r[0];
    } else {
      user = users[0];
      // Altijd de hash updaten zodat /auth/login ook werkt met demo123
      await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`;
    }

    const token = generateToken(user.id, user.email);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
