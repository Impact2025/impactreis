import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { getRitualStatus } from '@/lib/ritual-status.service';

/**
 * GET /api/ritual-status
 * Eén consolidatie-endpoint voor alles wat dashboard/smart-welcome/streak-badge nodig hebben:
 * dagstatus, streak, weekstart/weekreview-status, gemiste rituelen en een voorgestelde actie.
 * Vervangt de losse, localStorage-gebaseerde berekeningen die voorheen verspreid zaten over
 * weekflow.service.ts, ritual-recovery.service.ts en streak.service.ts.
 */
export async function GET(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    const userId = authCtx?.userId ?? null;
    const organizationId = authCtx?.organizationId ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getRitualStatus(String(userId), organizationId);
    return NextResponse.json(status);
  } catch (error) {
    console.error('Get ritual status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
