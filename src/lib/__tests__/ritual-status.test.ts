import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRitualStatus } from '../ritual-status.service';
import { getDateDaysAgo, getToday } from '../weekflow.service';

// getRitualStatus() vervangt de vroegere localStorage-berekening in streak.service.ts /
// ritual-recovery.service.ts — een regressie hier breekt streaks/herstel-detectie voor de
// hele app zonder dat de UI het meldt, dus dit is de belangrijkste plek om met een echte
// test te bewaken in plaats van alleen handmatig te testen.

const { sql } = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock('../db', () => ({ sql }));

function dailyLogRows(dates: string[]): { date_string: string; type: string }[] {
  return dates.flatMap((date_string) => [
    { date_string, type: 'morning' },
    { date_string, type: 'evening' },
  ]);
}

describe('getRitualStatus', () => {
  beforeEach(() => {
    // Vaste, niet-maandag/niet-weekend dag (dinsdag 10:00) zodat dayType/isAfter5PM
    // deterministisch zijn ongeacht wanneer de testsuite echt draait.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-08T10:00:00')); // dinsdag
    sql.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('bouwt een streak op uit opeenvolgende volledig voltooide dagen (vandaag nog niet klaar)', async () => {
    const completedDates = [1, 2, 3, 4, 5].map((d) => getDateDaysAgo(d));
    sql
      .mockResolvedValueOnce(dailyLogRows(completedDates)) // daily_logs venster
      .mockResolvedValueOnce([{ data: { type: 'weekly-start' } }]) // huidige week
      .mockResolvedValueOnce([{ data: { type: 'weekly-review' } }]); // vorige week

    const status = await getRitualStatus('1', 1);

    expect(status.today.fullyCompleted).toBe(false);
    expect(status.streak.currentStreak).toBe(5);
    expect(status.streak.longestStreak).toBe(5);
    expect(status.streak.isAtRisk).toBe(true); // gisteren wel, vandaag nog niet
  });

  it('reset de streak na een gemiste dag, ook als er daarvoor wel dagen voltooid waren', async () => {
    // Dag 5 t/m 7 geleden voltooid, maar dag 1-4 (incl. gisteren) niet — de streak is dus verbroken.
    const oldCompletedDates = [5, 6, 7].map((d) => getDateDaysAgo(d));
    sql
      .mockResolvedValueOnce(dailyLogRows(oldCompletedDates))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const status = await getRitualStatus('1', 1);

    expect(status.streak.currentStreak).toBe(0);
    expect(status.streak.longestStreak).toBe(3);
    expect(status.streak.isAtRisk).toBe(false); // gisteren ook niet voltooid, dus geen "at risk"
  });

  it('detecteert een gemist avondritueel van gisteren als aparte, herstelbare missed ritual', async () => {
    // Gisteren wel de ochtend, niet de avond gedaan.
    const yesterday = getDateDaysAgo(1);
    sql
      .mockResolvedValueOnce([{ date_string: yesterday, type: 'morning' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const status = await getRitualStatus('1', 1);

    const missedEvening = status.missedRituals.find((m) => m.type === 'evening' && m.daysAgo === 1);
    expect(missedEvening).toBeDefined();
    expect(missedEvening?.canRecover).toBe(true);
    expect(status.streak.currentStreak).toBe(0);
  });

  it('telt vandaag als volledig voltooid zodra zowel ochtend als avond gelogd zijn', async () => {
    const today = getToday();
    sql
      .mockResolvedValueOnce(dailyLogRows([today]))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const status = await getRitualStatus('1', 1);

    expect(status.today.morningDone).toBe(true);
    expect(status.today.eveningDone).toBe(true);
    expect(status.today.fullyCompleted).toBe(true);
    expect(status.streak.currentStreak).toBe(1);
    expect(status.streak.isAtRisk).toBe(false);
  });
});
