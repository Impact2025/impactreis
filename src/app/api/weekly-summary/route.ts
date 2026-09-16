import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthContext } from '@/lib/auth-context';

/**
 * GET /api/weekly-summary?weekStart=YYYY-MM-DD&weekEnd=YYYY-MM-DD
 *
 * Aggregeert daily_logs, focus_sessions, energy_log en wins over een datumrange, zodat
 * weekly-start/weekly-review de afgelopen week kunnen samenvatten i.p.v. alles handmatig
 * te laten overtypen. Puur leeswerk, schrijft niets.
 */
export async function GET(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    const userId = authCtx?.userId ?? null;
    const organizationId = authCtx?.organizationId ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');
    const weekEnd = searchParams.get('weekEnd');

    if (!weekStart || !weekEnd) {
      return NextResponse.json(
        { error: 'weekStart and weekEnd are required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    interface DailyLogRow { type: string; date_string: string; data: unknown }
    interface FocusSessionRow { completed: boolean; duration_minutes: number | null; session_type: string | null }
    interface EnergyDirectionRow { direction: string; count: number }
    interface WinRow { id: number; title: string; category: string }

    const [logs, focusSessions, energyEntries, weekWins] = await Promise.all([
      sql`
        SELECT type, date_string, data FROM daily_logs
        WHERE user_id = ${userId} AND organization_id = ${organizationId}
          AND date_string BETWEEN ${weekStart} AND ${weekEnd}
      ` as unknown as DailyLogRow[],
      sql`
        SELECT completed, duration_minutes, session_type FROM focus_sessions
        WHERE user_id = ${userId} AND organization_id = ${organizationId}
          AND date BETWEEN ${weekStart} AND ${weekEnd}
      ` as unknown as FocusSessionRow[],
      sql`
        SELECT direction, COUNT(*)::int AS count FROM energy_log
        WHERE user_id = ${userId} AND organization_id = ${organizationId}
          AND date_string BETWEEN ${weekStart} AND ${weekEnd}
        GROUP BY direction
      ` as unknown as EnergyDirectionRow[],
      sql`
        SELECT id, title, category FROM wins
        WHERE user_id = ${userId} AND organization_id = ${organizationId}
          AND date BETWEEN ${weekStart} AND ${weekEnd}
        ORDER BY date ASC
      ` as unknown as WinRow[],
    ]);

    const morningDays = new Set(logs.filter((l) => l.type === 'morning').map((l) => l.date_string));
    const eveningLogs = logs.filter((l) => l.type === 'evening');
    const eveningDays = new Set(eveningLogs.map((l) => l.date_string));

    const energyLevels = eveningLogs
      .map((l) => {
        const data = typeof l.data === 'string' ? JSON.parse(l.data) : l.data;
        const energyLevel = (data as { energyLevel?: unknown } | null)?.energyLevel;
        return typeof energyLevel === 'number' ? energyLevel : null;
      })
      .filter((v): v is number => v !== null);
    const averageEnergy = energyLevels.length > 0
      ? Math.round((energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length) * 10) / 10
      : null;

    const workSessions = focusSessions.filter((s) => s.session_type !== 'break');
    const completedWorkSessions = workSessions.filter((s) => s.completed);
    const focusMinutes = completedWorkSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    const energyGains = energyEntries.find((e) => e.direction === 'gain')?.count ?? 0;
    const energyCosts = energyEntries.find((e) => e.direction === 'cost')?.count ?? 0;

    return NextResponse.json({
      weekStart,
      weekEnd,
      morningRitualDays: morningDays.size,
      eveningRitualDays: eveningDays.size,
      averageEveningEnergy: averageEnergy,
      focusSessionsCompleted: completedWorkSessions.length,
      focusMinutes,
      energyGains,
      energyCosts,
      wins: weekWins.map((w) => ({ id: w.id, title: w.title, category: w.category })),
    });
  } catch (error) {
    console.error('Get weekly summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
