import { describe, it, expect } from 'vitest';
import { chooseTechnique, detectProactiveSignal, type CoachContext } from '../coach';

function baseContext(overrides: Partial<CoachContext> = {}): CoachContext {
  return {
    today: { energyLevel: 6, sleepQuality: 6, wakeTime: '07:00', intentie: 'Focus vandaag' },
    yesterday: { energyLevel: 6, sleepQuality: 6 },
    streak: 5,
    last7Days: [],
    recentEnergyLog: [],
    activeLessons: [],
    userContext: {
      current_energy_level: 6,
      current_stress_level: 4,
      recent_mood: 'neutral',
      current_focus_area: null,
      coaching_style: 'balanced',
    },
    holding: null,
    ...overrides,
  };
}

describe('chooseTechnique', () => {
  it('kiest oplossingsgericht bij lage energie ondanks een lopende streak', () => {
    const ctx = baseContext({ today: { energyLevel: 2 }, yesterday: { energyLevel: 5 }, streak: 4 });
    const { technique } = chooseTechnique(ctx);
    expect(technique).toBe('oplossingsgericht');
  });

  it('kiest cgt bij een scherpe energieval t.o.v. gisteren', () => {
    // energyLevel 4 (niet <=3) zodat dit niet ook de oplossingsgericht-tak raakt —
    // die gaat bewust vóór cgt bij hele lage energie, zie chooseTechnique.
    const ctx = baseContext({ today: { energyLevel: 4 }, yesterday: { energyLevel: 8 }, streak: 5 });
    const { technique } = chooseTechnique(ctx);
    expect(technique).toBe('cgt');
  });

  it('kiest mi als meer activiteiten energie kosten dan geven', () => {
    const ctx = baseContext({
      today: { energyLevel: 6 },
      yesterday: { energyLevel: 6 },
      recentEnergyLog: [
        { date_string: '2026-08-24', activity: 'a', category: null, direction: 'cost' },
        { date_string: '2026-08-24', activity: 'b', category: null, direction: 'cost' },
        { date_string: '2026-08-23', activity: 'c', category: null, direction: 'cost' },
        { date_string: '2026-08-23', activity: 'd', category: null, direction: 'gain' },
      ],
    });
    const { technique } = chooseTechnique(ctx);
    expect(technique).toBe('mi');
  });

  it('kiest strengths bij een nieuw begonnen streak met hoge energie', () => {
    const ctx = baseContext({ today: { energyLevel: 8 }, yesterday: null, streak: 1 });
    const { technique } = chooseTechnique(ctx);
    expect(technique).toBe('strengths');
  });

  it('kiest systemisch bij hoge stress zonder ander uitschieter', () => {
    const ctx = baseContext({
      userContext: {
        current_energy_level: 6, current_stress_level: 8, recent_mood: 'neutral',
        current_focus_area: null, coaching_style: 'balanced',
      },
    });
    const { technique } = chooseTechnique(ctx);
    expect(technique).toBe('systemisch');
  });

  it('valt terug op grow bij een gewone dag', () => {
    const { technique } = chooseTechnique(baseContext());
    expect(technique).toBe('grow');
  });

  it('kiest altijd act op een Free Day, ook als andere signalen een andere techniek zouden kiezen', () => {
    // Lage energie + lopende streak zou zonder dayType 'oplossingsgericht' opleveren (zie de
    // eerste test) — Free Day moet die regel overrulen, want herstel gaat voor.
    const ctx = baseContext({ today: { energyLevel: 2, dayType: 'free' }, yesterday: { energyLevel: 5 }, streak: 4 });
    const { technique, reason } = chooseTechnique(ctx);
    expect(technique).toBe('act');
    expect(reason).toContain('Free Day');
  });
});

describe('detectProactiveSignal', () => {
  it('geeft geen signaal bij een gewoon patroon', () => {
    const result = detectProactiveSignal([7, 6, 8], []);
    expect(result.signal).toBe(false);
  });

  it('signaleert bij drie dagen op rij lage energie', () => {
    const result = detectProactiveSignal([3, 4, 2, 8, 7], []);
    expect(result.signal).toBe(true);
    expect(result.patternKey).toBe('cgt:energie-drie-dagen-laag');
  });

  it('signaleert niet bij lage energie die maar twee dagen aanhoudt', () => {
    const result = detectProactiveSignal([3, 4, 8, 7], []);
    expect(result.signal).toBe(false);
  });

  it('signaleert als energie duidelijk vaker kost dan geeft', () => {
    const log = [
      { date_string: '1', activity: 'a', category: null, direction: 'cost' as const },
      { date_string: '2', activity: 'b', category: null, direction: 'cost' as const },
      { date_string: '3', activity: 'c', category: null, direction: 'cost' as const },
      { date_string: '4', activity: 'd', category: null, direction: 'cost' as const },
      { date_string: '5', activity: 'e', category: null, direction: 'gain' as const },
    ];
    const result = detectProactiveSignal([6, 6, 6], log);
    expect(result.signal).toBe(true);
    expect(result.patternKey).toBe('mi:energie-kost-meer-dan-geeft');
  });

  it('signaleert niet als kost/gaf ongeveer in balans is', () => {
    const log = [
      { date_string: '1', activity: 'a', category: null, direction: 'cost' as const },
      { date_string: '2', activity: 'b', category: null, direction: 'gain' as const },
      { date_string: '3', activity: 'c', category: null, direction: 'cost' as const },
      { date_string: '4', activity: 'd', category: null, direction: 'gain' as const },
    ];
    const result = detectProactiveSignal([6, 6, 6], log);
    expect(result.signal).toBe(false);
  });
});
