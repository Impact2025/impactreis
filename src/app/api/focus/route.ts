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

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let sessions;
    if (date) {
      sessions = await sql`
        SELECT * FROM focus_sessions
        WHERE user_id = ${userId} AND organization_id = ${organizationId}
          AND date = ${date}
        ORDER BY start_time ASC
      `;
    } else {
      sessions = await sql`
        SELECT * FROM focus_sessions
        WHERE user_id = ${userId} AND organization_id = ${organizationId}
        ORDER BY date DESC, start_time DESC
        LIMIT 50
      `;
    }

    return NextResponse.json(sessions);
  } catch (error: any) {
    // If table doesn't exist, return empty array
    if (error?.code === '42P01') {
      console.log('Focus sessions table not found, returning empty array');
      return NextResponse.json([]);
    }
    console.error('Get focus sessions error:', error);
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
    const { date, startTime, goal } = body;

    if (!date || !startTime) {
      return NextResponse.json(
        { error: 'Date and startTime are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO focus_sessions (user_id, date, start_time, goal, completed, organization_id)
      VALUES (${userId}, ${date}, ${startTime}, ${goal || null}, ${false}, ${organizationId})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create focus session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
