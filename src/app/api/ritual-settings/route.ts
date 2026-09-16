import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthContext } from '@/lib/auth-context';
import { DEFAULT_RITUAL_SETTINGS, type RitualSettings } from '@/lib/weekflow.service';

/**
 * GET/PATCH /api/ritual-settings
 *
 * Per-gebruiker instellingen die de ritueel-gating in ritual-status.service.ts sturen
 * (timezone, werkdagen, avond-openingstijd, weekstart-deadline) — zie ritual_settings-tabel
 * (migrations/manual/0010_ritual_settings.sql). Bestaat er nog geen rij, dan gelden de
 * DEFAULT_RITUAL_SETTINGS (= het oorspronkelijke, vaste ma-vr/17:00/t-m-wo Amsterdam-gedrag).
 */

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidDuration(n: unknown): n is number {
  return Number.isInteger(n) && (n as number) >= 15 && (n as number) <= 240;
}

function toRitualSettings(row: {
  timezone: string;
  work_days: unknown;
  evening_ritual_opens_hour: number;
  week_start_deadline_weekday: number;
  meditations_enabled: boolean | null;
  focus_block_1_start: string | null;
  focus_block_1_duration_min: number | null;
  focus_block_2_start: string | null;
  focus_block_2_duration_min: number | null;
}): RitualSettings {
  let workDays: unknown = row.work_days;
  if (typeof workDays === 'string') {
    try { workDays = JSON.parse(workDays); } catch { workDays = DEFAULT_RITUAL_SETTINGS.workDays; }
  }
  const validWorkDays =
    Array.isArray(workDays) && workDays.length > 0 && workDays.every((d) => Number.isInteger(d) && d >= 1 && d <= 7)
      ? (workDays as number[])
      : DEFAULT_RITUAL_SETTINGS.workDays;
  return {
    timezone: row.timezone || DEFAULT_RITUAL_SETTINGS.timezone,
    workDays: validWorkDays,
    eveningRitualOpensHour: row.evening_ritual_opens_hour ?? DEFAULT_RITUAL_SETTINGS.eveningRitualOpensHour,
    weekStartDeadlineWeekday: row.week_start_deadline_weekday ?? DEFAULT_RITUAL_SETTINGS.weekStartDeadlineWeekday,
    meditationsEnabled: row.meditations_enabled ?? DEFAULT_RITUAL_SETTINGS.meditationsEnabled,
    focusBlock1Start: row.focus_block_1_start && TIME_RE.test(row.focus_block_1_start)
      ? row.focus_block_1_start : DEFAULT_RITUAL_SETTINGS.focusBlock1Start,
    focusBlock1DurationMin: isValidDuration(row.focus_block_1_duration_min)
      ? row.focus_block_1_duration_min : DEFAULT_RITUAL_SETTINGS.focusBlock1DurationMin,
    focusBlock2Start: row.focus_block_2_start && TIME_RE.test(row.focus_block_2_start)
      ? row.focus_block_2_start : DEFAULT_RITUAL_SETTINGS.focusBlock2Start,
    focusBlock2DurationMin: isValidDuration(row.focus_block_2_duration_min)
      ? row.focus_block_2_duration_min : DEFAULT_RITUAL_SETTINGS.focusBlock2DurationMin,
  };
}

export async function GET(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    if (!authCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rows = await sql`
      SELECT timezone, work_days, evening_ritual_opens_hour, week_start_deadline_weekday, meditations_enabled,
             focus_block_1_start, focus_block_1_duration_min, focus_block_2_start, focus_block_2_duration_min
      FROM ritual_settings WHERE user_id = ${String(authCtx.userId)}
    `;
    const row = rows[0] as
      | {
          timezone: string; work_days: unknown; evening_ritual_opens_hour: number; week_start_deadline_weekday: number;
          meditations_enabled: boolean | null; focus_block_1_start: string | null; focus_block_1_duration_min: number | null;
          focus_block_2_start: string | null; focus_block_2_duration_min: number | null;
        }
      | undefined;

    return NextResponse.json(row ? toRitualSettings(row) : DEFAULT_RITUAL_SETTINGS);
  } catch (error) {
    console.error('Get ritual settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    if (!authCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!authCtx.organizationId) return NextResponse.json({ error: 'No organization' }, { status: 400 });

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const timezone = typeof body.timezone === 'string' && body.timezone.trim() ? body.timezone : DEFAULT_RITUAL_SETTINGS.timezone;
    // Valideer de timezone-string zelf — Intl gooit een RangeError bij een onbekende zone.
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    } catch {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }

    const workDays =
      Array.isArray(body.workDays) && body.workDays.length > 0 && body.workDays.every((d) => Number.isInteger(d) && d >= 1 && d <= 7)
        ? (body.workDays as number[])
        : DEFAULT_RITUAL_SETTINGS.workDays;

    const eveningRitualOpensHour =
      Number.isInteger(body.eveningRitualOpensHour) && (body.eveningRitualOpensHour as number) >= 0 && (body.eveningRitualOpensHour as number) <= 23
        ? (body.eveningRitualOpensHour as number)
        : DEFAULT_RITUAL_SETTINGS.eveningRitualOpensHour;

    const weekStartDeadlineWeekday =
      Number.isInteger(body.weekStartDeadlineWeekday) && (body.weekStartDeadlineWeekday as number) >= 1 && (body.weekStartDeadlineWeekday as number) <= 7
        ? (body.weekStartDeadlineWeekday as number)
        : DEFAULT_RITUAL_SETTINGS.weekStartDeadlineWeekday;

    const meditationsEnabled =
      typeof body.meditationsEnabled === 'boolean' ? body.meditationsEnabled : DEFAULT_RITUAL_SETTINGS.meditationsEnabled;

    const focusBlock1Start =
      typeof body.focusBlock1Start === 'string' && TIME_RE.test(body.focusBlock1Start)
        ? body.focusBlock1Start : DEFAULT_RITUAL_SETTINGS.focusBlock1Start;
    const focusBlock1DurationMin =
      isValidDuration(body.focusBlock1DurationMin) ? body.focusBlock1DurationMin : DEFAULT_RITUAL_SETTINGS.focusBlock1DurationMin;
    const focusBlock2Start =
      typeof body.focusBlock2Start === 'string' && TIME_RE.test(body.focusBlock2Start)
        ? body.focusBlock2Start : DEFAULT_RITUAL_SETTINGS.focusBlock2Start;
    const focusBlock2DurationMin =
      isValidDuration(body.focusBlock2DurationMin) ? body.focusBlock2DurationMin : DEFAULT_RITUAL_SETTINGS.focusBlock2DurationMin;

    const userId = String(authCtx.userId);
    await sql`
      INSERT INTO ritual_settings (
        user_id, organization_id, timezone, work_days, evening_ritual_opens_hour, week_start_deadline_weekday, meditations_enabled,
        focus_block_1_start, focus_block_1_duration_min, focus_block_2_start, focus_block_2_duration_min, updated_at
      )
      VALUES (
        ${userId}, ${authCtx.organizationId}, ${timezone}, ${JSON.stringify(workDays)}, ${eveningRitualOpensHour}, ${weekStartDeadlineWeekday}, ${meditationsEnabled},
        ${focusBlock1Start}, ${focusBlock1DurationMin}, ${focusBlock2Start}, ${focusBlock2DurationMin}, NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        timezone = EXCLUDED.timezone,
        work_days = EXCLUDED.work_days,
        evening_ritual_opens_hour = EXCLUDED.evening_ritual_opens_hour,
        week_start_deadline_weekday = EXCLUDED.week_start_deadline_weekday,
        meditations_enabled = EXCLUDED.meditations_enabled,
        focus_block_1_start = EXCLUDED.focus_block_1_start,
        focus_block_1_duration_min = EXCLUDED.focus_block_1_duration_min,
        focus_block_2_start = EXCLUDED.focus_block_2_start,
        focus_block_2_duration_min = EXCLUDED.focus_block_2_duration_min,
        updated_at = NOW()
    `;

    return NextResponse.json({
      timezone, workDays, eveningRitualOpensHour, weekStartDeadlineWeekday, meditationsEnabled,
      focusBlock1Start, focusBlock1DurationMin, focusBlock2Start, focusBlock2DurationMin,
    });
  } catch (error) {
    console.error('Update ritual settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
