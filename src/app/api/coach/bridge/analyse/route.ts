import { NextRequest, NextResponse } from 'next/server';
import { resolveBridgeOrganization, runCoachAnalysis } from '@/lib/coach';
import { rateLimitResponse } from '@/lib/rate-limit';

/** Zelfde reflectie als /api/coach/analyse, maar aangeroepen vanuit ImpactOS' Control Room
 * (server-naar-server, per-klant bridge-token) in plaats van vanuit de browser (JWT). Vincent
 * wilde de coach ook zichtbaar in ImpactOS zelf zien, niet alleen in deze app apart. */
export async function POST(request: NextRequest) {
  const bridge = await resolveBridgeOrganization(request.headers.get('authorization'));
  if (!bridge) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, organizationId } = bridge;

  const limited = await rateLimitResponse(`coach-bridge-analyse:org:${organizationId}`, 30, 60);
  if (limited) return limited;

  const result = await runCoachAnalysis(userId, organizationId);
  if (!result.ok) {
    const { ok: _ok, status, ...body } = result;
    return NextResponse.json(body, { status });
  }
  const { ok: _ok, ...body } = result;
  return NextResponse.json(body);
}
