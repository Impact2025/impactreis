import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createGoalSchema, updateGoalSchema } from '@/lib/schemas/goals.schema';
import { authenticateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const period = searchParams.get('period');

    let goals;
    if (period) {
      goals = await sql`
        SELECT * FROM goals
        WHERE user_id = ${userId}
          AND type = ${type}
          AND period = ${period}
        ORDER BY updated_at DESC
      `;
    } else if (type) {
      goals = await sql`
        SELECT * FROM goals
        WHERE user_id = ${userId}
          AND type = ${type}
        ORDER BY updated_at DESC
      `;
    } else {
      goals = await sql`
        SELECT * FROM goals
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `;
    }

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
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
    const { type, title, period, completed } = createGoalSchema.parse(body);

    const result = await sql`
      INSERT INTO goals (user_id, type, title, period, completed)
      VALUES (${userId}, ${type}, ${title}, ${period || null}, ${completed || false})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}