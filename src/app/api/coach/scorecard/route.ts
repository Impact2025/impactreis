import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { computeWeeklyScorecard } from '@/lib/coach';

export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await computeWeeklyScorecard(String(authCtx.userId));
  return NextResponse.json(result);
}
