import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    await sql`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      database: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('health check: database unreachable', err);
    return NextResponse.json({
      status: 'error',
      database: 'unreachable',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
