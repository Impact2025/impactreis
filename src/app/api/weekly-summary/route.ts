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

    const [logs, focusSessions, energyEntries, weekWins] = await Promise.all([
      sql`
        SELECT type, date_string, data FROM daily_logs
        WHERE user_id = ${userId} AND organization_id = ${organizationId}
          AND date_string BETWEEN ${weekStart} AND ${weekEnd}
      `,
      sql`
        SELECT completed, duration_minutes, session_type FROM focus_sessions
        WHERE user_id = ${userId} AND organization_id = ${organizationId}
          AND date BETWEEN ${weekStart} AND ${weekEnd}
      `,
      sql`
        SELECT direction, COUNT(*)::int AS count FROM energy_log
        WHERE user_id = ${userId} AND organization_id = ${organizationId}
          AND date_string BETWEEN ${weekStart} AND ${weekEnd}
        GROUP BY direction
      `,
      sql`
        SELECT id, title, category FROM wins
        WHERE user_id = ${userId} AND organization_id = ${organizationId}
          AND date BETWEEN ${weekStart} AND ${weekEnd}
        ORDER BY date ASC
      `,
    ]);

    const morningDays = new Set(logs.filter((l: any) => l.type === 'morning').map((l: any) => l.date_string));
    const eveningLogs = logs.filter((l: any) => l.type === 'evening');
    const eveningDays = new Set(eveningLogs.map((l: any) => l.date_string));

    const energyLevels = eveningLogs
      .map((l: any) => {
        const data = typeof l.data === 'string' ? JSON.parse(l.data) : l.data;
        return typeof data?.energyLevel === 'number' ? data.energyLevel : null;
      })
      .filter((v: number | null): v is number => v !== null);
    const averageEnergy = energyLevels.length > 0
      ? Math.round((energyLevels.reduce((a: number, b: number) => a + b, 0) / energyLevels.length) * 10) / 10
      : null;

    const workSessions = focusSessions.filter((s: any) => s.session_type !== 'break');
    const completedWorkSessions = workSessions.filter((s: any) => s.completed);
    const focusMinutes = completedWorkSessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0);

    const energyGains = energyEntries.find((e: any) => e.direction === 'gain')?.count ?? 0;
    const energyCosts = energyEntries.find((e: any) => e.direction === 'cost')?.count ?? 0;

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
      wins: weekWins.map((w: any) => ({ id: w.id, title: w.title, category: w.category })),
    });
  } catch (error) {
    console.error('Get weekly summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
