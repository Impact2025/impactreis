import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { runCoachAnalysis } from '@/lib/coach';

export async function POST(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  const userId = authCtx?.userId ?? null;
  const organizationId = authCtx?.organizationId ?? null;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runCoachAnalysis(String(userId));
  if (!result.ok) {
    const { ok, status, ...body } = result;
    return NextResponse.json(body, { status });
  }
  const { ok, ...body } = result;
  return NextResponse.json(body);
}
