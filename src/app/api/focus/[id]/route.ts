import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
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
    const body = await request.json();
    const { completed, durationMinutes, completedAt, energyBefore, energyAfter, sessionType } = body;

    if (completed === undefined) {
      return NextResponse.json(
        { error: 'Completed field is required' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE focus_sessions
      SET completed = ${completed},
          duration_minutes = COALESCE(${durationMinutes ?? null}, duration_minutes),
          completed_at = COALESCE(${completedAt ?? null}, completed_at),
          energy_before = COALESCE(${energyBefore ?? null}, energy_before),
          energy_after = COALESCE(${energyAfter ?? null}, energy_after),
          session_type = COALESCE(${sessionType ?? null}, session_type)
      WHERE id = ${id} AND user_id = ${userId} AND organization_id = ${organizationId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Focus session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Update focus session error:', error);
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
      DELETE FROM focus_sessions
      WHERE id = ${id} AND user_id = ${userId} AND organization_id = ${organizationId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Focus session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete focus session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
