import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { authenticateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const date = searchParams.get('date');

    // If type and date provided, check specific ritual
    if (type && date) {
      const logs = await sql`
        SELECT * FROM daily_logs
        WHERE user_id = ${userId}
          AND type = ${type}
          AND date_string = ${date}
        LIMIT 1
      `;
      return NextResponse.json(logs);
    }

    // Otherwise return all logs
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
    const { type, dateString, date, ...data } = body;
    const actualDate = dateString || date; // Accept both formats

    if (!type || !actualDate) {
      return NextResponse.json(
        { error: 'Type and date/dateString are required' },
        { status: 400 }
      );
    }

    // Upsert - update if exists, insert if not
    const existing = await sql`
      SELECT id FROM daily_logs
      WHERE user_id = ${userId} AND type = ${type} AND date_string = ${actualDate}
    `;

    let result;
    if (existing.length > 0) {
      result = await sql`
        UPDATE daily_logs
        SET data = ${JSON.stringify(data)}, timestamp = NOW()
        WHERE user_id = ${userId} AND type = ${type} AND date_string = ${actualDate}
        RETURNING *
      `;
    } else {
      result = await sql`
        INSERT INTO daily_logs (user_id, type, date_string, data, timestamp)
        VALUES (${userId}, ${type}, ${actualDate}, ${JSON.stringify(data)}, NOW())
        RETURNING *
      `;
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
