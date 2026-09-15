import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { generateFrogOpeners } from '@/lib/coach';

export async function POST(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let taskDescription: string | null = null;
  try {
    const body = await request.json();
    if (typeof body?.task === 'string') taskDescription = body.task;
  } catch {
    // geen body meegestuurd — val terug op de bekende tijdvreters/valkuil
  }

  const result = await generateFrogOpeners(String(authCtx.userId), taskDescription);
  return NextResponse.json(result);
}
