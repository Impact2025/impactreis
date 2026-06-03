import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { authenticateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '14');

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days + 1);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const logs = await sql`
      SELECT date_string AS date, data
      FROM daily_logs
      WHERE user_id = ${userId}
        AND type = 'adhd'
        AND date_string >= ${cutoffStr}
      ORDER BY date_string ASC
    `;

    return NextResponse.json(
      logs.map((row) => ({
        date: row.date,
        scores: (row.data as { scores?: Record<string, number> })?.scores ?? {},
        notes: (row.data as { notes?: string })?.notes ?? '',
      }))
    );
  } catch (error) {
    console.error('Get ADHD logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { date, scores, notes } = body as {
      date: string;
      scores: Record<string, number>;
      notes?: string;
    };

    if (!date || !scores) {
      return NextResponse.json({ error: 'Date and scores are required' }, { status: 400 });
    }

    const data = JSON.stringify({ scores, notes: notes ?? '' });

    const existing = await sql`
      SELECT id FROM daily_logs
      WHERE user_id = ${userId} AND type = 'adhd' AND date_string = ${date}
    `;

    let result;
    if (existing.length > 0) {
      result = await sql`
        UPDATE daily_logs
        SET data = ${data}, timestamp = NOW()
        WHERE user_id = ${userId} AND type = 'adhd' AND date_string = ${date}
        RETURNING *
      `;
    } else {
      result = await sql`
        INSERT INTO daily_logs (user_id, type, date_string, data)
        VALUES (${userId}, 'adhd', ${date}, ${data})
        RETURNING *
      `;
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Save ADHD log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
