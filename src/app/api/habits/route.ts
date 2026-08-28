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

    const habits = await sql`
      SELECT * FROM habits
      WHERE user_id = ${userId} AND organization_id = ${organizationId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json(habits);
  } catch (error) {
    console.error('Get habits error:', error);
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
    const { name, streak } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO habits (user_id, name, streak, organization_id)
      VALUES (${userId}, ${name}, ${streak || 0}, ${organizationId})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create habit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
