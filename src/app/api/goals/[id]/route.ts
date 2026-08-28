import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { updateGoalSchema } from '@/lib/schemas/goals.schema';
import { getAuthContext } from '@/lib/auth-context';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCtx = await getAuthContext(request);
    const userId = authCtx?.userId ?? null;
    const organizationId = authCtx?.organizationId ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updates = updateGoalSchema.parse(await request.json());

    const existing = await sql`
      SELECT data FROM goals WHERE id = ${id} AND user_id = ${userId} AND organization_id = ${organizationId}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const mergedData = { ...existing[0].data, ...updates };

    const result = await sql`
      UPDATE goals
      SET data = ${JSON.stringify(mergedData)}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId} AND organization_id = ${organizationId}
      RETURNING id, data, updated_at
    `;

    const goal = result[0];
    return NextResponse.json({ id: goal.id, updatedAt: goal.updated_at, ...goal.data });
  } catch (error) {
    console.error('Update goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCtx = await getAuthContext(request);
    const userId = authCtx?.userId ?? null;
    const organizationId = authCtx?.organizationId ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const result = await sql`
      DELETE FROM goals
      WHERE id = ${id} AND user_id = ${userId} AND organization_id = ${organizationId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Delete goal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
