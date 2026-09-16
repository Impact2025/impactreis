import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { runCoachAnalysis } from '@/lib/coach';
import { rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  const userId = authCtx?.userId ?? null;
  const organizationId = authCtx?.organizationId ?? null;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = await rateLimitResponse(`coach-analyse:${userId}`, 20, 60);
  if (limited) return limited;

  const result = await runCoachAnalysis(String(userId), organizationId);
  if (!result.ok) {
    const { ok: _ok, status, ...body } = result;
    return NextResponse.json(body, { status });
  }
  const { ok: _ok, ...body } = result;
  return NextResponse.json(body);
}
