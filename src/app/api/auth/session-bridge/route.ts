import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@/lib/db';
import { generateToken } from '@/lib/auth';

// Vertaalt een geldige Auth.js magic-link-sessie (cookie) naar het JWT-bearer-token dat de
// rest van de app (AuthService, api.ts) verwacht — zie src/app/auth/bridge/page.tsx. Zonder
// deze stap werkt geen enkele bestaande pagina na een magic-link login, want die lezen
// allemaal `localStorage.getItem('token')`, niet de Auth.js-sessie.
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Geen sessie' }, { status: 401 });
  }

  const rows = await sql`SELECT id, email, created_at FROM users WHERE email = ${session.user.email}`;
  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: 'Geen account gevonden voor deze sessie' }, { status: 404 });
  }

  const token = generateToken(user.id as number, user.email as string);

  return NextResponse.json({
    user: { id: user.id, email: user.email, createdAt: user.created_at },
    token,
  });
}
