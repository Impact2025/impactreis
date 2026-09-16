import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { runNextStepAnalysis } from '@/lib/coach';

export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  const userId = authCtx?.userId ?? null;
  const organizationId = authCtx?.organizationId ?? null;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runNextStepAnalysis(String(userId), organizationId);
  if (!result.ok) {
    const { ok: _ok, status, ...body } = result;
    return NextResponse.json(body, { status });
  }
  const { ok: _ok, ...body } = result;
  return NextResponse.json(body);
}
