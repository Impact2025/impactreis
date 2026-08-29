import { NextRequest, NextResponse } from 'next/server';
import { checkBridgeToken, loadSingleUserId, runCoachAnalysis } from '@/lib/coach';

/** Zelfde reflectie als /api/coach/analyse, maar aangeroepen vanuit ImpactOS' Control Room
 * (server-naar-server, gedeeld token) in plaats van vanuit de browser (JWT). Vincent wilde de
 * coach ook zichtbaar in ImpactOS zelf zien, niet alleen in deze app apart. */
export async function POST(request: NextRequest) {
  if (!checkBridgeToken(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await loadSingleUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Nog geen gebruiker in mijn-ondernemers-os.' }, { status: 404 });
  }

  const result = await runCoachAnalysis(userId);
  if (!result.ok) {
    const { ok, status, ...body } = result;
    return NextResponse.json(body, { status });
  }
  const { ok, ...body } = result;
  return NextResponse.json(body);
}
