import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { db } from '@/lib/db/client';
import { onboardingProfiles } from '@/lib/db/schema';
import { businessDnaSchema, COACH_MODES, switchProfileMode, type UserOnboardingProfile } from '@/lib/onboarding';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.select().from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, authCtx.userId)).limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ completed: false, profile: null, conversation: null });
  }

  return NextResponse.json({
    completed: rows[0].completed,
    profile: rows[0].profile,
    conversation: rows[0].conversation,
  });
}

// Laat een gebruiker het Bedrijfs-DNA (industry/teamSize/businessModel/topTimeWasters/
// avoidanceBehavior/quarterlyLeverageGoal) achteraf bijwerken vanuit Instellingen — dit is de
// enige input die de coach (src/lib/coach.ts) en het ochtendritueel personaliseert, dus fout
// hier raakt direct de kernervaring. Altijd het hele businessDna-object opnieuw valideren
// (zelfde schema als de intake), nooit een gedeeltelijke merge zonder validatie toestaan.
export async function PATCH(request: NextRequest) {
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

  // Coach-modus wisselen (commercial <-> rustbrenger): { mode }. Los van het Bedrijfs-DNA-pad hieronder.
  const requestedMode = (body as { mode?: unknown } | null)?.mode;
  if (requestedMode !== undefined) {
    if (typeof requestedMode !== 'string' || !(COACH_MODES as readonly string[]).includes(requestedMode)) {
      return NextResponse.json({ error: 'Ongeldige modus' }, { status: 400 });
    }
    const rows = await db.select().from(onboardingProfiles)
      .where(eq(onboardingProfiles.userId, authCtx.userId)).limit(1);
    if (rows.length === 0 || !rows[0].completed || !rows[0].profile) {
      return NextResponse.json({ error: 'Rond eerst de intake af' }, { status: 400 });
    }
    const switched = switchProfileMode(rows[0].profile as UserOnboardingProfile, requestedMode as (typeof COACH_MODES)[number]);
    if (!switched) {
      return NextResponse.json({ error: 'Voor deze modus is de intake opnieuw nodig', needsIntake: true }, { status: 409 });
    }
    await db.update(onboardingProfiles)
      .set({ profile: switched, updatedAt: new Date() })
      .where(eq(onboardingProfiles.userId, authCtx.userId));
    return NextResponse.json({ mode: requestedMode });
  }

  const result = businessDnaSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Bedrijfs-DNA is niet volledig of ongeldig', issues: result.error.issues }, { status: 400 });
  }

  const existing = await db.select().from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, authCtx.userId)).limit(1);

  if (existing.length === 0 || !existing[0].completed || !existing[0].profile) {
    return NextResponse.json({ error: 'Rond eerst de intake af voordat je je Bedrijfs-DNA kunt aanpassen' }, { status: 400 });
  }

  const currentProfile = existing[0].profile as UserOnboardingProfile;
  const updatedProfile: UserOnboardingProfile = { ...currentProfile, businessDna: result.data };

  await db.update(onboardingProfiles)
    .set({ profile: updatedProfile, updatedAt: new Date() })
    .where(eq(onboardingProfiles.userId, authCtx.userId));

  return NextResponse.json({ businessDna: result.data });
}
