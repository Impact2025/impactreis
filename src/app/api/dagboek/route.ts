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
    const limit = parseInt(searchParams.get('limit') ?? '30');

    const logs = await sql`
      SELECT * FROM daily_logs
      WHERE user_id = ${userId}
        AND type IN ('dagboek_ochtend', 'dagboek_avond')
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Get dagboek error:', error);
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
    const { moment, stemming, tekst, date } = body;

    if (!moment || !stemming || !date) {
      return NextResponse.json({ error: 'moment, stemming en date zijn verplicht' }, { status: 400 });
    }

    const type = moment === 'ochtend' ? 'dagboek_ochtend' : 'dagboek_avond';
    const data = { stemming, tekst: tekst ?? '' };

    const existing = await sql`
      SELECT id FROM daily_logs
      WHERE user_id = ${userId} AND type = ${type} AND date_string = ${date}
    `;

    let result;
    if (existing.length > 0) {
      result = await sql`
        UPDATE daily_logs
        SET data = ${JSON.stringify(data)}, timestamp = NOW()
        WHERE user_id = ${userId} AND type = ${type} AND date_string = ${date}
        RETURNING *
      `;
    } else {
      result = await sql`
        INSERT INTO daily_logs (user_id, type, date_string, data, timestamp)
        VALUES (${userId}, ${type}, ${date}, ${JSON.stringify(data)}, NOW())
        RETURNING *
      `;
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create dagboek error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
