import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { runBrainDump } from '@/lib/coach';
import { rateLimitResponse } from '@/lib/rate-limit';

// Executive Zeef — max 5 ontladingen per dag, zodat dit een scherpe filter blijft en geen
// vervanging voor een open chatvenster wordt (zie coach.ts: runBrainDump).
export async function POST(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  const userId = authCtx?.userId ?? null;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = await rateLimitResponse(`coach-dump:${userId}`, 5, 86400);
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const text = typeof body?.text === 'string' ? body.text : '';

  const result = await runBrainDump(String(userId), authCtx?.organizationId ?? null, text);
  if (!result.ok) {
    const { ok: _ok, status, ...rest } = result;
    return NextResponse.json(rest, { status });
  }
  const { ok: _ok, ...rest } = result;
  return NextResponse.json(rest);
}
