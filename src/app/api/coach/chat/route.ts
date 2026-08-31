import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { buildFollowUpPrompt, openRouterChat } from '@/lib/coach';

export async function POST(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  const userId = authCtx?.userId ?? null;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { messages } = body;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }

  try {
    const prompt = buildFollowUpPrompt(messages);
    const analysis = await openRouterChat(prompt, 400);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('Coach chat error:', err);
    return NextResponse.json(
      { error: 'De coach kon niet reageren. Probeer het opnieuw.', technique: 'grow', reason: 'Follow-up kon niet worden gegenereerd.' },
      { status: 502 }
    );
  }
}
