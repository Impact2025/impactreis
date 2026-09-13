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

// getRitualStatus vraagt eerst ritual_settings op (vóór daily_logs/weekly_reviews) — een lege
// rij hier betekent "geen instellingen opgeslagen", dus DEFAULT_RITUAL_SETTINGS
// (Europe/Amsterdam, ma-vr, 17:00, deadline woensdag). Elke test moet deze als eerste
// mockResolvedValueOnce meegeven, anders schuiven de daaropvolgende mocks één op.
function mockDefaultSettingsThen(...rest: unknown[][]) {
  sql.mockResolvedValueOnce([]); // ritual_settings: geen rij -> defaults
  for (const r of rest) sql.mockResolvedValueOnce(r);
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
    mockDefaultSettingsThen(
      dailyLogRows(completedDates), // daily_logs venster
      [{ data: { type: 'weekly-start' } }], // huidige week
      [{ data: { type: 'weekly-review' } }] // vorige week
    );

    const status = await getRitualStatus('1', 1);

    expect(status.today.fullyCompleted).toBe(false);
    expect(status.streak.currentStreak).toBe(5);
    expect(status.streak.longestStreak).toBe(5);
    expect(status.streak.isAtRisk).toBe(true); // gisteren wel, vandaag nog niet
  });

  it('reset de streak na een gemiste dag, ook als er daarvoor wel dagen voltooid waren', async () => {
    // Dag 5 t/m 7 geleden voltooid, maar dag 1-4 (incl. gisteren) niet — de streak is dus verbroken.
    const oldCompletedDates = [5, 6, 7].map((d) => getDateDaysAgo(d));
    mockDefaultSettingsThen(dailyLogRows(oldCompletedDates), [], []);

    const status = await getRitualStatus('1', 1);

    expect(status.streak.currentStreak).toBe(0);
    expect(status.streak.longestStreak).toBe(3);
    expect(status.streak.isAtRisk).toBe(false); // gisteren ook niet voltooid, dus geen "at risk"
  });

  it('detecteert een gemist avondritueel van gisteren als aparte, herstelbare missed ritual', async () => {
    // Gisteren wel de ochtend, niet de avond gedaan.
    const yesterday = getDateDaysAgo(1);
    mockDefaultSettingsThen([{ date_string: yesterday, type: 'morning' }], [], []);

    const status = await getRitualStatus('1', 1);

    const missedEvening = status.missedRituals.find((m) => m.type === 'evening' && m.daysAgo === 1);
    expect(missedEvening).toBeDefined();
    expect(missedEvening?.canRecover).toBe(true);
    expect(status.streak.currentStreak).toBe(0);
  });

  it('telt vandaag als volledig voltooid zodra zowel ochtend als avond gelogd zijn', async () => {
    const today = getToday();
    mockDefaultSettingsThen(dailyLogRows([today]), [], []);

    const status = await getRitualStatus('1', 1);

    expect(status.today.morningDone).toBe(true);
    expect(status.today.eveningDone).toBe(true);
    expect(status.today.fullyCompleted).toBe(true);
    expect(status.streak.currentStreak).toBe(1);
    expect(status.streak.isAtRisk).toBe(false);
  });

  it('stelt het avondritueel voor zodra de ochtend al gedaan is en het na 17:00 is', async () => {
    vi.setSystemTime(new Date('2026-09-08T18:00:00')); // dinsdag 18:00
    const today = getToday();
    mockDefaultSettingsThen(
      [{ date_string: today, type: 'morning' }],
      [{ data: { type: 'weekly-start' } }],
      [{ data: { type: 'weekly-review' } }]
    );

    const status = await getRitualStatus('1', 1);

    expect(status.suggestedAction).toMatchObject({ type: 'evening', isAvailable: true });
  });

  it('stelt het avondritueel wel voor als "volgende stap" vóór 17:00, maar markeert het als nog niet beschikbaar', async () => {
    // Standaard systeemtijd uit beforeEach is dinsdag 10:00 — vóór 17:00.
    const today = getToday();
    mockDefaultSettingsThen(
      [{ date_string: today, type: 'morning' }],
      [{ data: { type: 'weekly-start' } }],
      [{ data: { type: 'weekly-review' } }]
    );

    const status = await getRitualStatus('1', 1);

    expect(status.suggestedAction).toMatchObject({ type: 'evening', isAvailable: false });
  });

  it('meldt een gemiste weekreview van vorige week niet op maandagochtend', async () => {
    vi.setSystemTime(new Date('2026-09-07T08:00:00')); // maandag
    mockDefaultSettingsThen([], [], []); // vorige week: geen review gedaan

    const status = await getRitualStatus('1', 1);

    expect(status.missedRituals.some((m) => m.type === 'weeklyReview')).toBe(false);
  });

  it('meldt een gemiste weekreview van vorige week wel vanaf dinsdag', async () => {
    vi.setSystemTime(new Date('2026-09-08T08:00:00')); // dinsdag
    mockDefaultSettingsThen([], [{ data: { type: 'weekly-start' } }], []); // vorige week: geen review gedaan

    const status = await getRitualStatus('1', 1);

    expect(status.missedRituals.some((m) => m.type === 'weeklyReview')).toBe(true);
  });

  it('respecteert een aangepaste werkweek uit ritual_settings (zaterdag als werkdag)', async () => {
    // Zaterdag 09:00. Met de DEFAULT_RITUAL_SETTINGS (ma-vr) is zaterdag weekend en wordt een
    // niet-gestarte week nooit als "gemist" gemeld op die dag. Met work_days t/m zaterdag
    // (bv. een horeca-/retail-achtige werkweek) moet diezelfde zaterdag als werkdag tellen en
    // dus wél een gemiste weekstart opleveren — dat isoleert dat de instelling uit de database
    // komt en niet de hardcoded default.
    vi.setSystemTime(new Date('2026-09-12T09:00:00')); // zaterdag
    sql.mockResolvedValueOnce([
      {
        timezone: 'Europe/Amsterdam',
        work_days: [1, 2, 3, 4, 5, 6], // ma t/m za
        evening_ritual_opens_hour: 20,
        week_start_deadline_weekday: 4,
      },
    ]);
    sql.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const status = await getRitualStatus('1', 1);

    expect(status.settings.workDays).toEqual([1, 2, 3, 4, 5, 6]);
    expect(status.settings.eveningRitualOpensHour).toBe(20);
    expect(status.missedRituals.some((m) => m.type === 'weeklyStart')).toBe(true);
  });
});
