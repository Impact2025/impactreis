import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Alleen buiten productie bereikbaar -- lekte voorheen ongeauthenticeerd een DATABASE_URL-prefix
// en of DEMO_PASSWORD gezet was aan iedereen die de URL kende.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let test = 'no test';
  try {
    const r = await sql`SELECT 1 as ok`;
    test = 'DB OK: ' + JSON.stringify(r);
  } catch (e) {
    test = 'DB ERR: ' + (e instanceof Error ? e.message.substring(0, 200) : String(e));
  }
  return NextResponse.json({ test });
}
