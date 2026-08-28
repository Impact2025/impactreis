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

    const logs = await sql`
      SELECT * FROM daily_logs
      WHERE user_id = ${userId}
        AND organization_id = ${organizationId}
        AND type = 'feiten_verhalen'
      ORDER BY timestamp DESC
      LIMIT 20
    `;

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Get reflectie error:', error);
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
    const { situatie, verhaal, feiten, inzicht, date } = body;

    if (!situatie || !date) {
      return NextResponse.json({ error: 'situatie en date zijn verplicht' }, { status: 400 });
    }

    const data = { situatie, verhaal, feiten, inzicht };

    const result = await sql`
      INSERT INTO daily_logs (user_id, type, date_string, data, timestamp, organization_id)
      VALUES (${userId}, 'feiten_verhalen', ${date}, ${JSON.stringify(data)}, NOW(), ${organizationId})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create reflectie error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
