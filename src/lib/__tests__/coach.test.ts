import { describe, it, expect } from 'vitest';
import { chooseTechnique, detectProactiveSignal, determineNextStepCandidate, determineToolSuggestion, mergeTodayContext, type CoachContext, type NextStepInput } from '../coach';

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
    identity: { isFounder: true, orgName: 'WeAreImpact', addressName: 'Vincent', businessContext: 'een ondernemer met een holding' },
    identityStatements: [],
    challenger: null,
    openLeverageTask: null,
    openRocksCount: 0,
    recentWins: [],
    winsThisWeek: 0,
    focusSessionsToday: 0,
    focusMinutesToday: 0,
    todayJournal: [],
    todayControleCirkel: [],
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

describe('determineNextStepCandidate', () => {
  function baseInput(overrides: Partial<NextStepInput> = {}): NextStepInput {
    return {
      hasMorningRitual: true,
      proactiveSignal: { signal: false, patternKey: '', message: '' },
      weeklyStartOpen: false,
      frogLabel: null,
      frogDone: false,
      leverageTask: null,
      meetingMinutes: 0,
      scorecard: { metrics: [], lowestTwo: [] },
      weeklyReviewOpen: false,
      toolSuggestion: null,
      streak: 4,
      ...overrides,
    };
  }

  it('wijst naar het ochtendritueel als dat nog niet is ingevuld, ongeacht andere signalen', () => {
    const result = determineNextStepCandidate(baseInput({
      hasMorningRitual: false,
      proactiveSignal: { signal: true, patternKey: 'cgt:x', message: 'iets' },
    }));
    expect(result.key).toBe('geen-ochtendritueel');
    expect(result.ctaHref).toBe('/morning');
  });

  it('geeft het proactieve signaal voorrang boven de kikkertaak', () => {
    const result = determineNextStepCandidate(baseInput({
      proactiveSignal: { signal: true, patternKey: 'mi:x', message: 'Energie kost meer dan het geeft.' },
      frogLabel: 'Bellen',
      frogDone: false,
    }));
    expect(result.key).toBe('proactief-signaal');
    expect(result.factLine).toBe('Energie kost meer dan het geeft.');
  });

  it('wijst naar de weekstart als die nog open staat, boven de kikkertaak', () => {
    const result = determineNextStepCandidate(baseInput({
      weeklyStartOpen: true,
      frogLabel: 'Bellen',
      frogDone: false,
    }));
    expect(result.key).toBe('weekstart-open');
    expect(result.ctaHref).toBe('/weekly-start');
  });

  it('wijst naar de open kikkertaak als er geen signaal is', () => {
    const result = determineNextStepCandidate(baseInput({ frogLabel: 'Bellen — moeilijk gesprek', frogDone: false }));
    expect(result.key).toBe('kikker-open');
  });

  it('slaat de kikker over als die al is afgemaakt', () => {
    const result = determineNextStepCandidate(baseInput({
      frogLabel: 'Bellen',
      frogDone: true,
      leverageTask: { goalTitle: 'Nieuwe klanten', actionText: 'Offerte versturen' },
    }));
    expect(result.key).toBe('hefboomtaak-open');
  });

  it('wijst naar een open hefboomtaak', () => {
    const result = determineNextStepCandidate(baseInput({
      leverageTask: { goalTitle: 'Nieuwe klanten', actionText: 'Offerte versturen' },
    }));
    expect(result.key).toBe('hefboomtaak-open');
    expect(result.factLine).toContain('Offerte versturen');
  });

  it('signaleert een drukke dag zonder hersteltijd', () => {
    const result = determineNextStepCandidate(baseInput({ meetingMinutes: 320 }));
    expect(result.key).toBe('drukke-dag');
  });

  it('wijst naar de zwakste scorecard-metric onder de 6', () => {
    const result = determineNextStepCandidate(baseInput({
      scorecard: {
        metrics: [],
        lowestTwo: [{ key: 'energie', label: 'Energie', score: 4 }, { key: 'kikker', label: 'Kikker afgemaakt', score: 5 }],
      },
    }));
    expect(result.key).toBe('zwakke-scorecard');
    expect(result.factLine).toContain('Energie');
  });

  it('wijst naar de week review in het weekend als die nog open staat', () => {
    const result = determineNextStepCandidate(baseInput({
      scorecard: { metrics: [], lowestTwo: [{ key: 'energie', label: 'Energie', score: 8 }] },
      weeklyReviewOpen: true,
    }));
    expect(result.key).toBe('weekreview-open');
    expect(result.ctaHref).toBe('/weekly-review');
  });

  it('geeft een verstrekte tool-suggestie voorrang boven de streak-fallback', () => {
    const toolSuggestion = {
      key: 'verdieping-suggestie' as const,
      headline: 'Nog niet verkend: Dagboek',
      factLine: 'De laatste dagboek-notitie is 12 dagen geleden.',
      ctaLabel: 'Open Dagboek',
      ctaHref: '/dagboek',
    };
    const result = determineNextStepCandidate(baseInput({
      scorecard: { metrics: [], lowestTwo: [{ key: 'energie', label: 'Energie', score: 8 }] },
      toolSuggestion,
    }));
    expect(result).toEqual(toolSuggestion);
  });

  it('valt terug op de streak-aanmoediging als er geen sterk signaal is', () => {
    const result = determineNextStepCandidate(baseInput({
      scorecard: { metrics: [], lowestTwo: [{ key: 'energie', label: 'Energie', score: 8 }] },
    }));
    expect(result.key).toBe('streak-fallback');
  });
});

describe('determineToolSuggestion', () => {
  it('geeft voorrang aan Identiteit als er nog geen enkele verklaring is vastgelegd', () => {
    const result = determineToolSuggestion({ identityEmpty: true, daysSinceDagboek: 1, daysSinceControleCirkel: 1 });
    expect(result?.ctaHref).toBe('/identity');
  });

  it('geeft null als geen enkele tool stil genoeg staat', () => {
    const result = determineToolSuggestion({ identityEmpty: false, daysSinceDagboek: 2, daysSinceControleCirkel: 3 });
    expect(result).toBeNull();
  });

  it('wijst naar Dagboek als die nog nooit gebruikt is', () => {
    const result = determineToolSuggestion({ identityEmpty: false, daysSinceDagboek: null, daysSinceControleCirkel: 5 });
    expect(result?.ctaHref).toBe('/dagboek');
  });

  it('wijst naar de tool die het langst geleden (of nooit) gebruikt is', () => {
    const result = determineToolSuggestion({ identityEmpty: false, daysSinceDagboek: 25, daysSinceControleCirkel: 22 });
    expect(result?.ctaHref).toBe('/dagboek');
  });

  it('wijst naar Controle Cirkel als die relatief langer stil staat, ook als Dagboek ook stil staat', () => {
    const result = determineToolSuggestion({ identityEmpty: false, daysSinceDagboek: 12, daysSinceControleCirkel: 25 });
    expect(result?.ctaHref).toBe('/controle-cirkel');
  });
});

describe('mergeTodayContext', () => {
  // Regressietest voor een bug (code review 2026-09-19): het avondritueel overschreef stilletjes
  // ctx.today.energyLevel van het ochtendritueel, waardoor de ochtendritueel-gate (loadCoachContext
  // ~1221, runNextStepAnalysis's hasMorningRitual ~1549) dacht dat het ochtendritueel al was
  // ingevuld op dagen dat alleen het avondritueel was gedaan.
  it('ochtend-energie wint van avond-energie als beide rituelen vandaag zijn ingevuld', () => {
    const result = mergeTodayContext({ energyLevel: 8, intentie: 'Focus' }, { energyLevel: 3 }, false, undefined);
    expect(result.energyLevel).toBe(8);
    expect(result.intentie).toBe('Focus');
  });

  it('valt terug op avond-energie als alleen het avondritueel is ingevuld (geen ochtendritueel)', () => {
    const result = mergeTodayContext(null, { energyLevel: 3, whatWentWell: 'Klant gebeld' }, false, undefined);
    expect(result.energyLevel).toBe(3);
    expect(result.whatWentWell).toBe('Klant gebeld');
  });

  it('geeft alleen ochtenddata terug als het avondritueel nog niet is ingevuld', () => {
    const result = mergeTodayContext({ energyLevel: 6, sleepQuality: 7 }, null, false, undefined);
    expect(result).toEqual({ energyLevel: 6, sleepQuality: 7 });
  });

  it('past de kikker-override alleen toe als daarom gevraagd wordt, met de weggeklikte taak in de tekst', () => {
    const result = mergeTodayContext({ energyLevel: 5 }, null, true, 'Bellen met leverancier');
    expect(result.eveningVerdict).toBe('gevlucht_in_veiligheid');
    expect(result.eveningVerdictDetail).toContain('Bellen met leverancier');
  });

  it('gebruikt een generieke kikker-tekst als er geen taaknaam bekend is', () => {
    const result = mergeTodayContext(null, null, true, null);
    expect(result.eveningVerdictDetail).toBe('Kikker-sprint weggeklikt zonder resultaat.');
  });
});
