import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { sql } from '@/lib/db';
import { METRIC_LABELS } from '@/lib/coach';

/** Falsifieerbare voorspellingen van de coach — de tegenhanger van /api/coach/lessons, maar dan
 *  toetsbaar: elke rij is een concrete weddenschap die na due_date is opgelost (of nog open staat). */
export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  const userId = authCtx?.userId ?? null;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, statement, metric, baseline, direction, horizon_days, due_date, outcome, resolved_at, created_at
    FROM coach_predictions
    WHERE user_id = ${String(userId)}
    ORDER BY due_date DESC
    LIMIT 25
  `;

  const predictions = rows.map((r: any) => ({
    ...r,
    metricLabel: METRIC_LABELS[r.metric as 'energy_level' | 'streak'] ?? r.metric,
  }));

  return NextResponse.json({ predictions });
}
