import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { authenticateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await sql`
      SELECT * FROM daily_logs
      WHERE user_id = ${userId}
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
    const userId = await authenticateToken(request);
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
      INSERT INTO daily_logs (user_id, type, date_string, data, timestamp)
      VALUES (${userId}, 'feiten_verhalen', ${date}, ${JSON.stringify(data)}, NOW())
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create reflectie error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
