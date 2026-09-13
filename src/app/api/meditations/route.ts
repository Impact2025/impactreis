import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthContext } from '@/lib/auth-context';

export async function GET(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    const userId = authCtx?.userId ?? null;
    const organizationId = authCtx?.organizationId ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await sql`
      SELECT DISTINCT date FROM meditation_sessions
      WHERE user_id = ${userId} AND organization_id = ${organizationId} AND completed = true
      ORDER BY date DESC
    `;

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    const dates = new Set(rows.map((r: any) => new Date(r.date).toDateString()));
    while (dates.has(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const recent = await sql`
      SELECT meditation_id FROM meditation_sessions
      WHERE user_id = ${userId} AND organization_id = ${organizationId} AND completed = true
      ORDER BY created_at DESC
      LIMIT 5
    `;

    return NextResponse.json({
      streak,
      totalCompleted: rows.length,
      recentIds: recent.map((r: any) => r.meditation_id),
    });
  } catch (error: any) {
    if (error?.code === '42P01') {
      return NextResponse.json({ streak: 0, totalCompleted: 0, recentIds: [] });
    }
    console.error('Get meditation stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    const userId = authCtx?.userId ?? null;
    const organizationId = authCtx?.organizationId ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { meditationId, durationSeconds } = body;

    if (!meditationId) {
      return NextResponse.json({ error: 'meditationId is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO meditation_sessions (user_id, organization_id, meditation_id, duration_seconds, completed)
      VALUES (${userId}, ${organizationId}, ${meditationId}, ${durationSeconds ?? null}, ${true})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    if (error?.code === '42P01') {
      return NextResponse.json({ error: 'Meditation sessions table not found' }, { status: 500 });
    }
    console.error('Create meditation session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
