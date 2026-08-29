import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { sql } from '@/lib/db';
import { TECHNIQUE_LABELS, Technique } from '@/lib/coach';

/** Actieve geleerde patronen, hoogste trefkans eerst — de coach-tegenhanger van Iris' /iris/lessons. */
export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  const userId = authCtx?.userId ?? null;
  const organizationId = authCtx?.organizationId ?? null;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, pattern_key, technique, insight, confidence, times_confirmed, times_disproven, updated_at
    FROM coach_lessons
    WHERE user_id = ${String(userId)} AND active = TRUE
    ORDER BY confidence DESC, updated_at DESC
    LIMIT 25
  `;

  const lessons = rows.map((r: any) => ({
    ...r,
    techniqueLabel: TECHNIQUE_LABELS[r.technique as Technique] ?? r.technique,
  }));

  return NextResponse.json({ lessons });
}
