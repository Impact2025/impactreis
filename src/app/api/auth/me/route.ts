import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { sql } from '@/lib/db';

// Klein, apart endpoint i.p.v. het localStorage-user-object bij login uit te breiden — zo
// werkt dit ook meteen voor sessies die al vóór het `name`-veld waren ingelogd, zonder her-login.
export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await sql`SELECT email, name FROM users WHERE id = ${authCtx.userId} LIMIT 1`;
  const row = rows[0] as { email: string; name: string | null } | undefined;
  if (!row) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  }

  return NextResponse.json({ email: row.email, name: row.name });
}
