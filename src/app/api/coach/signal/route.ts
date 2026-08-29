import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { checkBridgeToken, detectProactiveSignal, loadRecentMorningEnergy, loadSingleUserId } from '@/lib/coach';

/** Machine-to-machine endpoint voor ImpactOS' coach_whatsapp_check-job (zie CLAUDE.md,
 * coach_bridge-domein). Geen JWT hier — dit is geen browsersessie maar een server-naar-server
 * call met een gedeeld geheim (dezelfde COACH_BRIDGE_TOKEN aan beide kanten). */
export async function GET(request: NextRequest) {
  if (!checkBridgeToken(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await loadSingleUserId();
  if (!userId) {
    return NextResponse.json({ signal: false, patternKey: '', message: '' });
  }

  const [recentMorningEnergy, recentEnergyLog] = await Promise.all([
    loadRecentMorningEnergy(userId, 5),
    sql`SELECT date_string, activity, category, direction FROM energy_log
        WHERE user_id = ${userId} ORDER BY date_string DESC LIMIT 40`,
  ]);

  const result = detectProactiveSignal(recentMorningEnergy, recentEnergyLog as any);
  return NextResponse.json(result);
}
