import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createGoalSchema } from '@/lib/schemas/goals.schema';
import { getAuthContext } from '@/lib/auth-context';
import { normalizeNextActions } from '@/lib/goal-actions';
import { randomUUID } from 'node:crypto';

// De echte `goals`-tabel heeft user_id/id/data(jsonb)/updated_at/organization_id — niet de
// bhag/yearly_goals/monthly_goals uit schema.sql. `data` bevat het RPM-model (Result, Purpose,
// Massive Action) dat de goals-pagina (src/app/goals/page.tsx) gebruikt. Zie MULTI_TENANT_MIGRATION.md.

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

    // Oude goals hebben nextActions nog als string[] — normaliseer altijd naar de objectvorm
    // zodat de frontend nooit twee vormen hoeft te onderscheiden (zie Fase 3).
    const goals = rows.map((row: any) => ({
      id: row.id,
      updatedAt: row.updated_at,
      ...row.data,
      nextActions: normalizeNextActions(row.data?.nextActions),
    }));

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
    const parsed = createGoalSchema.parse(body);

    const id = randomUUID();
    const data = {
      title: parsed.title,
      description: parsed.description || '',
      why: parsed.why || '',
      painIfNot: parsed.painIfNot || '',
      pleasureIfDone: parsed.pleasureIfDone || '',
      nextActions: normalizeNextActions(parsed.nextActions),
      deadline: parsed.deadline || null,
      category: parsed.category || 'business',
      completed: false,
      progress: 0,
      isRock: parsed.isRock ?? false,
      quarter: parsed.quarter ?? null,
      createdAt: new Date().toISOString(),
    };

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
