import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createGoalSchema } from '@/lib/schemas/goals.schema';
import { getAuthContext } from '@/lib/auth-context';
import { randomUUID } from 'node:crypto';

// De echte `goals`-tabel heeft user_id/id/data(jsonb)/updated_at/organization_id — niet de
// bhag/yearly_goals/monthly_goals uit schema.sql, en ook niet de type/title/period/completed
// die deze route voorheen aannam (die kolommen bestaan niet, dus elke aanroep faalde met een
// SQL-fout). Enige echte aanroeper is de PWA-share-target (src/app/share/page.tsx, "Doel").
// Zie MULTI_TENANT_MIGRATION.md.

export async function GET(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    const userId = authCtx?.userId ?? null;
    const organizationId = authCtx?.organizationId ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await sql`
      SELECT id, data, updated_at FROM goals
      WHERE user_id = ${userId} AND organization_id = ${organizationId}
      ORDER BY updated_at DESC
    `;

    const goals = rows.map((row: any) => ({ id: row.id, updatedAt: row.updated_at, ...row.data }));

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
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
    const { title, description, type } = createGoalSchema.parse(body);

    const id = randomUUID();
    const data = { title, description: description || null, type: type || 'other', completed: false };

    const result = await sql`
      INSERT INTO goals (user_id, id, data, organization_id, updated_at)
      VALUES (${userId}, ${id}, ${JSON.stringify(data)}, ${organizationId}, NOW())
      RETURNING id, data, updated_at
    `;

    const goal = result[0];
    return NextResponse.json({ id: goal.id, updatedAt: goal.updated_at, ...goal.data }, { status: 201 });
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
