import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { db } from '@/lib/db/client';
import { onboardingProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Bewaart het lopende intakegesprek (ruwe messages-array) na elke voltooide beurt, zodat
// een refresh of afgebroken sessie kan hervatten in plaats van opnieuw te beginnen — zie
// GET /api/onboarding/profile, dat deze conversation teruggeeft aan de client.
export async function POST(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { messages: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'messages is verplicht' }, { status: 400 });
  }

  const existing = await db.select().from(onboardingProfiles).where(eq(onboardingProfiles.userId, authCtx.userId)).limit(1);

  if (existing.length > 0) {
    if (existing[0].completed) return NextResponse.json({ ok: true }); // intake al afgerond, niet overschrijven
    await db.update(onboardingProfiles)
      .set({ conversation: body.messages, updatedAt: new Date() })
      .where(eq(onboardingProfiles.userId, authCtx.userId));
  } else {
    await db.insert(onboardingProfiles).values({
      userId: authCtx.userId,
      organizationId: authCtx.organizationId!,
      conversation: body.messages,
      completed: false,
    });
  }

  return NextResponse.json({ ok: true });
}
