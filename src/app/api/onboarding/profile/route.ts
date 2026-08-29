import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { db } from '@/lib/db/client';
import { onboardingProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db.select().from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, authCtx.userId)).limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ completed: false, profile: null });
  }

  return NextResponse.json({ completed: rows[0].completed, profile: rows[0].profile });
}
