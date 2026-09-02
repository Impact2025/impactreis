import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
export async function GET() {
  const db = process.env.DATABASE_URL || '(none)';
  let test = 'no test';
  try {
    const r = await sql`SELECT 1 as ok`;
    test = 'DB OK: ' + JSON.stringify(r);
  } catch (e) {
    test = 'DB ERR: ' + (e && (e as any).message ? (e as any).message.substring(0,200) : String(e));
  }
  return NextResponse.json({ dbUrl: db.slice(0, 50), demoPassword: process.env.DEMO_PASSWORD ? 'set' : 'MISSING', test });
}
