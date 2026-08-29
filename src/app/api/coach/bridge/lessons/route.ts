import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { checkBridgeToken, loadSingleUserId, TECHNIQUE_LABELS, Technique } from '@/lib/coach';

/** Zelfde lijst als /api/coach/lessons, token-authed voor ImpactOS' Control Room. */
export async function GET(request: NextRequest) {
  if (!checkBridgeToken(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await loadSingleUserId();
  if (!userId) {
    return NextResponse.json({ lessons: [] });
  }

  const rows = await sql`
    SELECT id, pattern_key, technique, insight, confidence, times_confirmed, times_disproven, updated_at
    FROM coach_lessons
    WHERE user_id = ${userId} AND active = TRUE
    ORDER BY confidence DESC, updated_at DESC
    LIMIT 25
  `;

  const lessons = rows.map((r: any) => ({
    ...r,
    techniqueLabel: TECHNIQUE_LABELS[r.technique as Technique] ?? r.technique,
  }));

  return NextResponse.json({ lessons });
}
