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
      ORDER BY timestamp DESC
      LIMIT 50
    `;

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
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
    const { type, dateString, ...data } = body;

    if (!type || !dateString) {
      return NextResponse.json(
        { error: 'Type and dateString are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO daily_logs (user_id, type, date_string, data, timestamp)
      VALUES (${userId}, ${type}, ${dateString}, ${JSON.stringify(data)}, NOW())
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
