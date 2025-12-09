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
    const weekNumber = searchParams.get('weekNumber');

    if (weekNumber) {
      const weeklyGoals = await sql`
        SELECT * FROM weekly_goals
        WHERE user_id = ${userId}
          AND week_number = ${weekNumber}
      `;
      return NextResponse.json(weeklyGoals[0] || {});
    } else {
      const weeklyGoals = await sql`
        SELECT * FROM weekly_goals
        WHERE user_id = ${userId}
        ORDER BY week_number DESC
        LIMIT 20
      `;
      return NextResponse.json(weeklyGoals);
    }
  } catch (error) {
    console.error('Get weekly goals error:', error);
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
    const { weekNumber, goals } = body;

    if (!weekNumber || !goals) {
      return NextResponse.json(
        { error: 'Week number and goals are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO weekly_goals (user_id, week_number, goals)
      VALUES (${userId}, ${weekNumber}, ${JSON.stringify(goals)})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create weekly goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
