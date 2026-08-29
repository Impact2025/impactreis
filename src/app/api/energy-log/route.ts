import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { sql } from '@/lib/db';

interface EnergyEntry {
  activity: string;
  category?: string;
  direction: 'gain' | 'cost';
}

/** Slaat energie-attributie op: wat een dag gaf of kostte, per activiteit — niet alleen een cijfer.
 *  Vervangt/overschrijft niets van date_string; meerdere entries per dag zijn normaal. */
export async function POST(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  const userId = authCtx?.userId ?? null;
  const organizationId = authCtx?.organizationId ?? null;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { date: string; entries: EnergyEntry[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const entries = (body.entries ?? []).filter((e) => e.activity?.trim() && (e.direction === 'gain' || e.direction === 'cost'));
  if (entries.length === 0) {
    return NextResponse.json({ ok: true, created: 0 });
  }

  const userIdStr = String(userId);
  for (const e of entries) {
    await sql`
      INSERT INTO energy_log (user_id, date_string, activity, category, direction, source, organization_id)
      VALUES (${userIdStr}, ${body.date}, ${e.activity.trim()}, ${e.category ?? null}, ${e.direction}, 'ritueel', ${organizationId})
    `;
  }

  return NextResponse.json({ ok: true, created: entries.length });
}

/** Aggregatie over de laatste N dagen: welke activiteit/categorie kost of geeft stelselmatig energie. */
export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  const userId = authCtx?.userId ?? null;
  const organizationId = authCtx?.organizationId ?? null;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const days = Math.min(90, Math.max(7, Number(request.nextUrl.searchParams.get('days')) || 30));
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const userIdStr = String(userId);

  const rows = await sql`
    SELECT activity, category, direction, COUNT(*)::int AS count
    FROM energy_log
    WHERE user_id = ${userIdStr} AND date_string >= ${since}
    GROUP BY activity, category, direction
    ORDER BY count DESC
  `;

  const recent = await sql`
    SELECT date_string, activity, category, direction
    FROM energy_log
    WHERE user_id = ${userIdStr} AND date_string >= ${since}
    ORDER BY date_string DESC, id DESC
    LIMIT 40
  `;

  return NextResponse.json({ aggregate: rows, recent });
}
