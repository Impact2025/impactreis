import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthContext } from '@/lib/auth-context';
import { ensurePreferences } from '@/lib/email-recipients';

type Column =
  | 'morning_motivation'
  | 'morning_reminder'
  | 'weekly_report'
  | 'streak_celebration'
  | 'onboarding_nudge'
  | 'winback';

export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensurePreferences(authCtx.userId);
  const rows = await sql`SELECT * FROM email_preferences WHERE user_id = ${authCtx.userId} LIMIT 1`;
  const row = rows[0];

  return NextResponse.json({
    morningMotivation: row.morning_motivation,
    morningReminder: row.morning_reminder,
    weeklyReport: row.weekly_report,
    streakCelebration: row.streak_celebration,
    onboardingNudge: row.onboarding_nudge,
    winback: row.winback,
  });
}

export async function PATCH(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Alleen bekende kolommen accepteren, camelCase -> snake_case, en alleen booleans doorlaten.
  const camelToColumn: Record<string, Column> = {
    morningMotivation: 'morning_motivation',
    morningReminder: 'morning_reminder',
    weeklyReport: 'weekly_report',
    streakCelebration: 'streak_celebration',
    onboardingNudge: 'onboarding_nudge',
    winback: 'winback',
  };

  await ensurePreferences(authCtx.userId);

  for (const [key, column] of Object.entries(camelToColumn)) {
    if (typeof body[key] !== 'boolean') continue;
    await sql(
      `UPDATE email_preferences SET ${column} = $1, updated_at = NOW() WHERE user_id = $2`,
      [body[key], authCtx.userId]
    );
  }

  return NextResponse.json({ ok: true });
}
