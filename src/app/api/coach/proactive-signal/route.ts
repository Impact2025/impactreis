import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthContext } from '@/lib/auth-context';
import { detectProactiveSignal, loadRecentMorningEnergy } from '@/lib/coach';

/** JWT-authed variant van /api/coach/signal voor de eigen dashboard-UI.
 * /api/coach/signal blijft ongewijzigd — die wordt server-naar-server aangeroepen
 * door ImpactOS' coach_whatsapp_check-job en mag niet breken. */
export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  const userId = authCtx?.userId ?? null;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [recentMorningEnergy, recentEnergyLog] = await Promise.all([
    loadRecentMorningEnergy(String(userId), 5),
    sql`SELECT date_string, activity, category, direction FROM energy_log
        WHERE user_id = ${userId} ORDER BY date_string DESC LIMIT 40`,
  ]);

  const result = detectProactiveSignal(recentMorningEnergy, recentEnergyLog as any);
  return NextResponse.json(result);
}
