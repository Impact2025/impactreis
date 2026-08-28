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
    const weekNumber = searchParams.get('weekNumber');

    let reviews;
    if (weekNumber) {
      reviews = await sql`
        SELECT * FROM weekly_reviews
        WHERE user_id = ${userId}
          AND organization_id = ${organizationId}
          AND week_number = ${weekNumber}
        ORDER BY timestamp DESC
      `;
    } else {
      reviews = await sql`
        SELECT * FROM weekly_reviews
        WHERE user_id = ${userId} AND organization_id = ${organizationId}
        ORDER BY timestamp DESC
        LIMIT 50
      `;
    }

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Get weekly reviews error:', error);
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
    const { weekNumber, ...data } = body;

    if (!weekNumber) {
      return NextResponse.json(
        { error: 'Week number is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO weekly_reviews (user_id, week_number, data, timestamp, organization_id)
      VALUES (${userId}, ${weekNumber}, ${JSON.stringify(data)}, NOW(), ${organizationId})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create weekly review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
