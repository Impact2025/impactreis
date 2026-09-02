import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CoachContext } from '../coach';

// coach_predictions is het enige mechanisme dat een coach_lesson kan weerleggen (rememberLesson
// kan een les alleen bevestigen) — een regressie hier laat een fout geleerd patroon voor altijd
// als "waar" in de coachprompt staan, dus dit verdient een echte test i.p.v. alleen handmatig testen.

const { sql } = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock('../db', () => ({ sql }));

const { maybeCreatePrediction, resolveDuePredictions } = await import('../coach');

function baseContext(overrides: Partial<CoachContext> = {}): CoachContext {
  return {
    today: { energyLevel: 5, sleepQuality: 6, wakeTime: '07:00', intentie: 'Focus' },
    yesterday: { energyLevel: 5, sleepQuality: 6 },
    streak: 3,
    last7Days: [],
    recentEnergyLog: [],
    activeLessons: [],
    userContext: { current_energy_level: 5, current_stress_level: 4, recent_mood: 'neutral', current_focus_area: null, coaching_style: 'balanced' },
    holding: null,
    ...overrides,
  };
}

describe('maybeCreatePrediction', () => {
  beforeEach(() => sql.mockReset());

  it('slaat over als er al een onopgeloste predictie voor deze les loopt', async () => {
    sql.mockResolvedValueOnce([{ id: 99 }]); // pending check vindt al iets

    await maybeCreatePrediction('1', 1, 42, baseContext(), 'cgt');

    expect(sql).toHaveBeenCalledTimes(1); // geen INSERT erna
  });

  it('slaat over als de metric-baseline ontbreekt', async () => {
    const ctx = baseContext({ today: { energyLevel: undefined } });

    await maybeCreatePrediction('1', 1, 42, ctx, 'cgt');

    expect(sql).not.toHaveBeenCalled(); // zelfs de pending-check wordt niet nodig geacht
  });

  it('maakt een energy_level-predictie aan voor een energie-techniek (cgt/mi/systemisch)', async () => {
    sql.mockResolvedValueOnce([]).mockResolvedValueOnce([]); // geen pending, INSERT ok

    await maybeCreatePrediction('1', 1, 42, baseContext({ today: { energyLevel: 4 } }), 'mi');

    expect(sql).toHaveBeenCalledTimes(2);
    const insertCall = sql.mock.calls[1][0].join('');
    expect(insertCall).toContain('INSERT INTO coach_predictions');
    expect(sql.mock.calls[1]).toContain('energy_level');
    expect(sql.mock.calls[1]).toContain(4); // baseline = huidige energie
  });

  it('maakt een streak-predictie aan voor een ritme-techniek (grow/oplossingsgericht/strengths/act)', async () => {
    sql.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await maybeCreatePrediction('1', 1, 42, baseContext({ streak: 6 }), 'grow');

    const insertCall = sql.mock.calls[1][0].join('');
    expect(insertCall).toContain('INSERT INTO coach_predictions');
  });
});

describe('resolveDuePredictions', () => {
  beforeEach(() => sql.mockReset());

  it('doet niets als er geen vervallen predicties zijn', async () => {
    sql.mockResolvedValueOnce([]);

    await resolveDuePredictions('1', 1);

    expect(sql).toHaveBeenCalledTimes(1);
  });

  it('markeert een energy_level-predictie als correct en verhoogt times_confirmed op de les', async () => {
    sql
      .mockResolvedValueOnce([{ id: 5, lesson_id: 42, metric: 'energy_level', baseline: 4 }]) // due predictions
      .mockResolvedValueOnce([{ data: { energyLevel: 7 } }]) // meest recente morning-log: energie omhoog
      .mockResolvedValueOnce([]) // allMorningDates (irrelevant voor energy_level-metric)
      .mockResolvedValueOnce([]) // UPDATE coach_predictions
      .mockResolvedValueOnce([{ times_confirmed: 1, times_disproven: 0 }]) // SELECT coach_lessons
      .mockResolvedValueOnce([]); // UPDATE coach_lessons

    await resolveDuePredictions('1', 1);

    const predictionUpdate = sql.mock.calls[3][0].join('');
    expect(predictionUpdate).toContain('UPDATE coach_predictions');
    expect(sql.mock.calls[3]).toContain('correct');

    const lessonUpdate = sql.mock.calls[5][0].join('');
    expect(lessonUpdate).toContain('UPDATE coach_lessons');
    expect(sql.mock.calls[5]).toContain(2); // times_confirmed: 1 -> 2
    expect(sql.mock.calls[5]).toContain(true); // active blijft true (disproven 0 <= confirmed 2)
  });

  it('markeert een predictie als incorrect en pensioneert de les zodra disproven > confirmed', async () => {
    sql
      .mockResolvedValueOnce([{ id: 6, lesson_id: 42, metric: 'energy_level', baseline: 7 }])
      .mockResolvedValueOnce([{ data: { energyLevel: 3 } }]) // energie juist gedaald
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ times_confirmed: 0, times_disproven: 0 }])
      .mockResolvedValueOnce([]);

    await resolveDuePredictions('1', 1);

    expect(sql.mock.calls[3]).toContain('incorrect');
    expect(sql.mock.calls[5]).toContain(false); // active=false: disproven(1) > confirmed(0)
  });

  it('markeert een predictie als unclear zonder de les te veranderen als er geen recente meting is', async () => {
    sql
      .mockResolvedValueOnce([{ id: 7, lesson_id: 42, metric: 'energy_level', baseline: 5 }])
      .mockResolvedValueOnce([]) // geen morning-log gevonden
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]); // UPDATE coach_predictions — daarna geen lesson-queries meer

    await resolveDuePredictions('1', 1);

    expect(sql).toHaveBeenCalledTimes(4); // geen SELECT/UPDATE op coach_lessons bij 'unclear'
    expect(sql.mock.calls[3]).toContain('unclear');
  });
});
