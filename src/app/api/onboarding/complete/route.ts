import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { onboardingProfileSchema } from '@/lib/onboarding';
import { db } from '@/lib/db/client';
import { onboardingProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// De client parseert het ```json-blok uit het laatste AI-bericht (zie src/lib/onboarding.ts:
// extractOnboardingProfile) en post hier het al-geparste object — server valideert opnieuw
// (nooit de client vertrouwen) vóór het wegschrijven.
export async function POST(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const result = onboardingProfileSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Profiel is niet volledig of ongeldig', issues: result.error.issues }, { status: 400 });
  }

  const existing = await db.select().from(onboardingProfiles).where(eq(onboardingProfiles.userId, authCtx.userId)).limit(1);

  if (existing.length > 0) {
    await db.update(onboardingProfiles)
      .set({ profile: result.data, completed: true, updatedAt: new Date() })
      .where(eq(onboardingProfiles.userId, authCtx.userId));
  } else {
    await db.insert(onboardingProfiles).values({
      userId: authCtx.userId,
      organizationId: authCtx.organizationId!,
      profile: result.data,
      completed: true,
    });
  }

  return NextResponse.json({ ok: true });
}
