import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { resolveBridgeOrganization, detectProactiveSignal, loadRecentMorningEnergy } from '@/lib/coach';

/** Machine-to-machine endpoint voor ImpactOS' coach_whatsapp_check-job (zie CLAUDE.md,
 * coach_bridge-domein). Geen JWT hier — dit is geen browsersessie maar een server-naar-server
 * call met een bridge-token per klant (client_bridge_tokens). */
export async function GET(request: NextRequest) {
  const bridge = await resolveBridgeOrganization(request.headers.get('authorization'));
  if (!bridge) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { userId } = bridge;

  const [recentMorningEnergy, recentEnergyLog] = await Promise.all([
    loadRecentMorningEnergy(userId, 5),
    sql`SELECT date_string, activity, category, direction FROM energy_log
        WHERE user_id = ${userId} ORDER BY date_string DESC LIMIT 40`,
  ]);

  const result = detectProactiveSignal(recentMorningEnergy, recentEnergyLog as any);
  return NextResponse.json(result);
}
