// De Sparringpartner — Vincents persoonlijke business- en welzijnscoach.
//
// Combineert businesscoaching (rol, keuzes, leiderschap) en welzijnscoaching (energie, herstel,
// gewoonten) in één persona, zoals in de praktijk bij een ondernemer altijd door elkaar loopt.
// Kiest deterministisch een coachtechniek op basis van het signaal (zie chooseTechnique), en
// onthoudt wat blijkt te kloppen via coach_lessons — een observatie is pas een les na bewijs,
// niet na één keer zenden. Zelfde filosofie als iris_lessons in Impact OS.
import { createHash } from 'node:crypto';
import { sql } from './db';
import {
  AVOIDANCE_BEHAVIOR_OPTIONS,
  TIME_WASTER_OPTIONS,
  LEVERAGE_GOAL_OPTIONS,
  INDUSTRY_OPTIONS,
  labelFor,
  type UserOnboardingProfile,
} from './onboarding';

export type Technique =
  | 'grow'
  | 'mi'
  | 'oplossingsgericht'
  | 'cgt'
  | 'act'
  | 'systemisch'
  | 'strengths';

export const TECHNIQUE_LABELS: Record<Technique, string> = {
  grow: 'GROW (doel, realiteit, opties, actie)',
  mi: 'Motiverende gespreksvoering (OARS)',
  oplossingsgericht: 'Oplossingsgericht (schaalvragen)',
  cgt: 'CGT-geïnformeerd (patroon herkennen)',
  act: 'ACT / waardenwerk',
  systemisch: 'Systemisch (jij en de holding eromheen)',
  strengths: 'Strengths-based',
};

interface DailyLogRow {
  date_string: string;
  type: 'morning' | 'evening';
  data: any;
}

interface EnergyLogRow {
  date_string: string;
  activity: string;
  category: string | null;
  direction: 'gain' | 'cost';
}

export interface CoachLesson {
  id: number;
  pattern_key: string;
  technique: Technique;
  insight: string;
  confidence: number;
  times_confirmed: number;
  times_disproven: number;
}

export interface HoldingContext {
  status: 'ok' | 'off' | 'error';
  projecten?: { totaal: number; stilstaand: { project: string; score: number }[]; gemiddelde_score: number | null };
  waarheidsaudit?: { open_totaal: number; blokkerend: number };
  gemiste_runs?: { aantal_jobs: number; jobs: { label: string; missed: number }[] };
  iris?: { report_date: string | null; top_advies: unknown[] };
  agenda?: { status: string; vandaag_afspraken?: number; vrije_blokken_vandaag?: unknown[] };
}

export interface CoachContext {
  today: { energyLevel?: number; sleepQuality?: number; wakeTime?: string; intentie?: string; dayType?: 'focus' | 'buffer' | 'free' };
  yesterday: { energyLevel?: number; sleepQuality?: number } | null;
  streak: number;
  last7Days: DailyLogRow[];
  recentEnergyLog: EnergyLogRow[];
  activeLessons: CoachLesson[];
  userContext: {
    current_energy_level: number;
    current_stress_level: number;
    recent_mood: string;
    current_focus_area: string | null;
    coaching_style: string;
  };
  /** Holding-brede context uit ImpactOS — null als de brug uit staat of onbereikbaar was.
   *  Nooit blokkerend: de coachreflectie moet ook werken als ImpactOS niet draait. */
  holding: HoldingContext | null;
  identity: CoachIdentity;
  /** Impact Coach-persona + Bedrijfs-DNA uit de tap-first onboarding — null zolang iemand nog de
   *  oude AIPA-intake heeft (of nooit `coachProfile.toneSeverity: 'high_challenger'` koos), dan
   *  valt de prompt terug op de bestaande "Sparringpartner"-persona hieronder. */
  challenger: ChallengerProfile | null;
}

export interface ChallengerProfile {
  displayName: string;
  gender: 'male' | 'female';
  industryLabel: string;
  topTimeWasterLabels: string[];
  avoidanceBehavior: string;
  avoidanceLabel: string;
  quarterlyLeverageLabel: string;
}

/** Haalt de Impact Coach-persona en het Bedrijfs-DNA op uit de tap-first onboarding-wizard.
 *  Geeft null terug zolang toneSeverity niet 'high_challenger' is — dat is de enige modus die
 *  de wizard vandaag oplevert, maar deze check houdt de deur open voor mildere varianten later. */
export async function loadChallengerProfile(userId: string): Promise<ChallengerProfile | null> {
  const rows = await sql`SELECT profile FROM onboarding_profiles WHERE user_id = ${userId} AND completed = TRUE LIMIT 1`;
  const profile = (rows as { profile: UserOnboardingProfile | null }[])[0]?.profile;
  if (!profile?.coachProfile || !profile.businessDna || profile.coachProfile.toneSeverity !== 'high_challenger') return null;
  const { coachProfile, businessDna } = profile;
  return {
    displayName: coachProfile.displayName,
    gender: coachProfile.gender,
    industryLabel: labelFor(INDUSTRY_OPTIONS, businessDna.industry),
    topTimeWasterLabels: businessDna.topTimeWasters.map((w) => labelFor(TIME_WASTER_OPTIONS, w)),
    avoidanceBehavior: businessDna.avoidanceBehavior,
    avoidanceLabel: labelFor(AVOIDANCE_BEHAVIOR_OPTIONS, businessDna.avoidanceBehavior),
    quarterlyLeverageLabel: labelFor(LEVERAGE_GOAL_OPTIONS, businessDna.quarterlyLeverageGoal),
  };
}

/** MECHANISME 2 — Challenger Prompt Injection: doorzoekt de vrije tekstvelden van vandaag op
 *  zelfondermijnend gedrag (te laag tarief, of het eigen bekende vluchtgedrag) en geeft, indien
 *  gevonden, een harde sturingsinstructie terug die buildCoachPrompt vóór de gewone techniek-
 *  instructie plakt. Puur keyword-based en deterministisch — geen LLM nodig om te bepalen wanneer
 *  hij moet ingrijpen, alleen om het antwoord te formuleren. */
function detectChallengerTrigger(ctx: CoachContext): string | null {
  if (!ctx.challenger) return null;

  // MECHANISME 3 — De Commerciële Realiteitstoets: expliciete avondkeuze weegt zwaarder dan
  // een keyword-gok in vrije tekst, en gebruikt de exacte vraag uit het bouwplan.
  if ((ctx.today as any).eveningVerdict === 'gevlucht_in_veiligheid') {
    const detail = (ctx.today as any).eveningVerdictDetail;
    return `CHALLENGER_MODE_ACTIVE: de ondernemer geeft zelf aan vandaag gevlucht te zijn in veilige klussen in plaats van de kikker af te maken${detail ? ` ("${detail}")` : ''}. Vraag: "Welke veilige taak heeft je afgeleid, en staat deze taak morgen om 09:00 uur ingepland?" — accepteer geen ontwijkend antwoord.`;
  }

  const textFields = [
    (ctx.today as any).intentie,
    (ctx.today as any).focusBlok1,
    (ctx.today as any).focusBlok2,
    (ctx.today as any).whatWentWell,
    (ctx.today as any).challenges,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0);
  const combined = textFields.join(' \n ').toLowerCase();
  if (!combined) return null;

  const lowRateMatch = combined.match(/€\s?(\d{1,2})(?:[,.]|\D|$)/);
  if (lowRateMatch && Number(lowRateMatch[1]) < 100) {
    return `CHALLENGER_MODE_ACTIVE: ${ctx.challenger.displayName} moet direct wijzen op zelfondermijning — een tarief van €${lowRateMatch[1]} past niet bij het kwartaaldoel "${ctx.challenger.quarterlyLeverageLabel}". Vraag waarom de ROI voor de klant genegeerd wordt, en confronteer met dit hefboomdoel.`;
  }

  const AVOIDANCE_KEYWORDS: Record<string, string[]> = {
    bouwen_techniek: ['app bouwen', 'website', 'coderen', 'programmeren', 'automatisering bouwen', 'tool bouwen'],
    telefoontjes_uitstellen: ['nog even niet bellen', 'later bellen', 'bel morgen wel', 'geen tijd om te bellen'],
    veilige_administratie: ['administratie bijwerken', 'mailtjes wegwerken', 'inbox opruimen', 'planning bijwerken'],
    te_snel_ja_zeggen: ['toch maar ja gezegd', 'korting gegeven', 'akkoord gegaan met'],
  };
  const hitKeyword = (AVOIDANCE_KEYWORDS[ctx.challenger.avoidanceBehavior] ?? []).find((k) => combined.includes(k));
  if (hitKeyword) {
    return `CHALLENGER_MODE_ACTIVE: dit is exact ${ctx.challenger.displayName}'${ctx.challenger.gender === 'male' ? 's' : ''} bekende vluchtgedrag ("${ctx.challenger.avoidanceLabel}"). Noem dit patroon expliciet bij naam, en vraag direct naar de commerciële actie die hiervoor in de plaats hoort te staan.`;
  }
  return null;
}

/** De organisatie van de oprichter zelf (v.munster@weareimpact.nl) — de enige waarvoor de coach
 *  Vincents persoonlijke "Sparringpartner"-persona met de WeAreImpact-holding gebruikt. Elke
 *  andere organisatie (klant-demo's zoals DatingAssistent) krijgt een generieke, org-gebonden
 *  identiteit — zie loadCoachIdentity(). */
const FOUNDER_ORGANIZATION_ID = 1;

export interface CoachIdentity {
  isFounder: boolean;
  orgName: string;
  /** Voornaam om de coach mee te laten aanspreken — leeg voor generieke organisaties, dan valt
   *  de prompt terug op "je"/"de ondernemer" i.p.v. een verzonnen naam. */
  addressName: string;
  /** Korte typering van de context waarin deze persoon onderneemt, gebruikt in de systeemprompt-
   *  intro (bv. "een ondernemer met een holding" vs. "de oprichter van DatingAssistent"). */
  businessContext: string;
}

/** Bepaalt wie de coach vandaag voor zich heeft: Vincent zelf (hardcoded, ongewijzigd gedrag)
 *  of een klant-organisatie (naam uit `organizations.name`, geen aanname van een voornaam). */
export async function loadCoachIdentity(organizationId: number | null): Promise<CoachIdentity> {
  if (organizationId === FOUNDER_ORGANIZATION_ID) {
    return {
      isFounder: true,
      orgName: 'WeAreImpact',
      addressName: 'Vincent',
      businessContext: 'een ondernemer met een holding (WeAreImpact, met projecten als BewaardVoorJou eronder)',
    };
  }
  const rows = organizationId
    ? await sql`SELECT name FROM organizations WHERE id = ${organizationId} LIMIT 1`
    : [];
  const orgName = (rows[0]?.name as string | undefined) ?? 'je onderneming';
  return {
    isFounder: false,
    orgName,
    addressName: '',
    businessContext: `de oprichter van ${orgName}`,
  };
}

/** Vraagt de holding-brede context op bij ImpactOS (zie CLAUDE.md: coach_bridge-domein).
 *  Faalt stil — een onbereikbare ImpactOS mag de coach nooit blokkeren, alleen een blok
 *  minder rijk maken. Korte timeout: dit hangt in het pad van een gebruiker die op "Vraag
 *  reflectie" klikt. */
export async function fetchHoldingContext(): Promise<HoldingContext | null> {
  const base = process.env.IMPACTOS_BASE_URL;
  const token = process.env.COACH_BRIDGE_TOKEN;
  if (!base || !token) return null;
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/api/coach-context/holding`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as HoldingContext;
  } catch {
    return null;
  }
}

const DAY_NAMES = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

function parseData(raw: any) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  // daily_logs.data is saved by api/logs/route.ts as { data: formData, createdAt: ... }
  // Unwrap the nested .data so callers get the morning/evening form data directly.
  if (parsed && typeof parsed === 'object' && 'data' in parsed && parsed.data && typeof parsed.data === 'object') {
    return parsed.data;
  }
  return parsed;
}

/** Bouwt de multi-dag context die de coach nodig heeft. Alle cijfers komen uit de echte tabellen,
 *  nooit uit een aanname — de LLM krijgt straks alleen wat hier al gemeten is. */
export async function loadCoachContext(userId: string, organizationId: number | null = null): Promise<CoachContext> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const identity = await loadCoachIdentity(organizationId);

  const [morningRows, allMorningDates, energyRows, lessonRows, contextRows, holding, challenger] = await Promise.all([
    sql`SELECT date_string, type, data FROM daily_logs
        WHERE user_id = ${userId} AND date_string IN (${today}, ${yesterday})`,
    sql`SELECT date_string FROM daily_logs
        WHERE user_id = ${userId} AND type = 'morning'
        ORDER BY date_string DESC LIMIT 30`,
    sql`SELECT date_string, activity, category, direction FROM energy_log
        WHERE user_id = ${userId} ORDER BY date_string DESC LIMIT 40`,
    sql`SELECT id, pattern_key, technique, insight, confidence, times_confirmed, times_disproven
        FROM coach_lessons WHERE user_id = ${userId} AND active = TRUE
        ORDER BY confidence DESC LIMIT 10`,
    sql`SELECT current_energy_level, current_stress_level, recent_mood, current_focus_area, coaching_style
        FROM user_context WHERE user_id = ${userId} LIMIT 1`,
    // De holding-brief komt uitsluitend uit Vincents eigen ImpactOS/agentos-brug — een klant-
    // organisatie als DatingAssistent heeft geen holding en mag die call nooit triggeren.
    identity.isFounder ? fetchHoldingContext() : Promise.resolve(null),
    loadChallengerProfile(userId),
  ]);

  const todayMorning = (morningRows as DailyLogRow[]).find((r) => r.date_string === today && r.type === 'morning');
  const yesterdayMorning = (morningRows as DailyLogRow[]).find((r) => r.date_string === yesterday && r.type === 'morning');
  const todayEvening = (morningRows as DailyLogRow[]).find((r) => r.date_string === today && r.type === 'evening');

  const streak = getCurrentStreak((allMorningDates as { date_string: string }[]).map((r) => r.date_string));

  const uc = (contextRows as any[])[0] ?? {
    current_energy_level: 5,
    current_stress_level: 5,
    recent_mood: 'neutral',
    current_focus_area: null,
    coaching_style: 'balanced',
  };

  return {
    today: {
      ...(todayMorning ? parseData(todayMorning.data) : {}),
      ...(todayEvening ? parseData(todayEvening.data) : {}),
    },
    yesterday: yesterdayMorning ? parseData(yesterdayMorning.data) : null,
    streak,
    last7Days: morningRows as DailyLogRow[],
    recentEnergyLog: energyRows as EnergyLogRow[],
    activeLessons: lessonRows as CoachLesson[],
    userContext: uc,
    holding: holding as HoldingContext | null,
    identity,
    challenger: challenger as ChallengerProfile | null,
  };
}

/** Laatste N dagen ochtend-energie, meest recent eerst — los van `loadCoachContext` (die
 *  alleen vandaag/gisteren laadt), want alleen `/api/coach/signal` heeft een langer venster
 *  nodig om een aanhoudend patroon te kunnen zien in plaats van één slechte dag. */
export async function loadRecentMorningEnergy(userId: string, days = 5): Promise<number[]> {
  const rows = await sql`
    SELECT data FROM daily_logs
    WHERE user_id = ${userId} AND type = 'morning'
    ORDER BY date_string DESC LIMIT ${days}
  `;
  return (rows as { data: any }[])
    .map((r) => parseData(r.data)?.energyLevel)
    .filter((v): v is number => typeof v === 'number');
}

function getCurrentStreak(dateStrings: string[]): number {
  const dates = [...new Set(dateStrings)].sort().reverse();
  if (dates.length === 0) return 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 0;
  let prev: Date | null = null;
  for (const d of dates) {
    const cur = new Date(d);
    if (prev === null) { streak = 1; prev = cur; continue; }
    const diff = Math.round((prev.getTime() - cur.getTime()) / 86400000);
    if (diff === 1) { streak++; prev = cur; } else break;
  }
  return streak;
}

/** Deterministisch: welk signaal wijst op welke techniek. Geen LLM nodig om dit te kiezen —
 *  de keuze zelf moet uitlegbaar zijn, ook als de gateway plat ligt. */
export function chooseTechnique(ctx: CoachContext): { technique: Technique; reason: string } {
  // Vroegste, prioritaire regel: een Free Day is een strategische noodzaak voor fysiologisch
  // herstel (zie het tijdsarchitectuur-onderzoek), geen "zwakke dag" — de coach mag hier nooit
  // een doorduw-techniek kiezen, ongeacht energie- of streaksignalen.
  if (ctx.today.dayType === 'free') {
    return { technique: 'act', reason: 'Free Day — herstel is vandaag het doel, niet doorzetten.' };
  }

  const energyDrop = ctx.yesterday?.energyLevel != null && ctx.today.energyLevel != null
    ? ctx.today.energyLevel - ctx.yesterday.energyLevel
    : 0;

  const costCount = ctx.recentEnergyLog.filter((e) => e.direction === 'cost').length;
  const gainCount = ctx.recentEnergyLog.filter((e) => e.direction === 'gain').length;

  // Aanhoudende, meerdaagse energie-daling zonder duidelijke opgaande beweging: eerst navragen,
  // niet meteen oplossen — dit is precies het geval waar de grens naar doorverwijzen dichtbij kan zijn.
  if ((ctx.today.energyLevel ?? 10) <= 3 && ctx.streak >= 3) {
    return { technique: 'oplossingsgericht', reason: 'Lage energie ondanks een lopende streak — eerst een schaalvraag, geen advies.' };
  }
  if (energyDrop <= -3) {
    return { technique: 'cgt', reason: 'Scherpe energieval t.o.v. gisteren — patroon eerst zichtbaar maken.' };
  }
  if (costCount >= 3 && costCount > gainCount) {
    return { technique: 'mi', reason: 'Meer activiteiten die energie kosten dan geven deze periode — verandering vergt eigen motivatie, geen advies van buiten.' };
  }
  if (ctx.streak <= 1 && (ctx.today.energyLevel ?? 5) >= 7) {
    return { technique: 'strengths', reason: 'Hoge energie, nieuw begonnen ritueel — bouwen op wat al werkt.' };
  }
  if (ctx.userContext.current_stress_level >= 7) {
    return { technique: 'systemisch', reason: `Hoge stress — kijk naar wat er om ${ctx.identity.addressName || 'deze ondernemer'} heen speelt, niet alleen naar de agenda.` };
  }
  return { technique: 'grow', reason: 'Geen uitschieter — een gewone dag verdient een gewone scherpe vraag.' };
}

const LOCAL_LLM_GATEWAY = process.env.NEXT_PUBLIC_LLM_GATEWAY_URL || 'http://localhost:8899/v1';
const LOCAL_LLM_MODEL = 'qwen3.6-flash';

export async function openRouterChat(prompt: string, maxTokens = 400): Promise<string> {
  // Primary: OpenRouter (cloud) if API key is configured
  if (process.env.OPENROUTER_API_KEY) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://mijn-ondernemers-os.vercel.app',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? 'Analyse niet beschikbaar.';
  }

  // Fallback: local LLM gateway (OpenModel/Ollama via :8899)
  const res = await fetch(`${LOCAL_LLM_GATEWAY}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OLLAMA_API_KEY || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LOCAL_LLM_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Local LLM gateway error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? 'Analyse niet beschikbaar.';
}

/** Bouwt de techniekinstructies met het juiste bezittelijk voornaamwoord: "zijn"/"hem" voor
 *  Vincent (ongewijzigd gedrag), neutraal "hun"/"die van deze ondernemer" voor klant-organisaties
 *  — nooit een gegokt geslacht voor iemand die de coach niet kent. */
function techniqueInstructions(identity: CoachIdentity): Record<Technique, string> {
  const possessive = identity.addressName ? 'zijn' : 'hun';
  const object = identity.addressName || 'deze ondernemer';
  return {
    grow: `Gebruik het GROW-model: help ${object} het doel voor vandaag scherp krijgen (Goal), benoem kort de huidige realiteit (Reality), noem één onconventionele optie (Options), en eindig met een concrete vraag over de eerste stap (Will).`,
    mi: `Gebruik motiverende gespreksvoering (OARS): geen advies, geen "je moet". Stel een open vraag die ${possessive} eigen reden voor verandering naar boven haalt, en erken expliciet wat al goed gaat (affirmatie).`,
    oplossingsgericht: 'Gebruik oplossingsgericht coachen: stel een schaalvraag ("waar sta je nu op een schaal van 0-10, en wat maakt dat je niet lager zit") en een uitzonderingsvraag over een moment dat het al wél lukte.',
    cgt: 'Gebruik een lichte CGT-geïnformeerde reflectie: benoem het patroon tussen wat er gebeurde en de reactie, zonder te diagnosticeren, en test één realistischer werkhypothese.',
    act: `Gebruik ACT: erken dat onzekerheid of ongemak aanwezig mag zijn, en vraag welke kleine, aan ${possessive} waarden verbonden actie daar toch bij past.`,
    systemisch: `Gebruik een systemische vraag: wat in de omgeving eromheen (team, klanten, verwachtingen) speelt mee, en welke rol neemt ${object} daar zelf in als spanning ontstaat.`,
    strengths: 'Gebruik strengths-based coachen: vraag naar een concreet moment dat het al lukte en welke omstandigheden dat mogelijk maakten, en hoe dat patroon nu te gebruiken is.',
  };
}

/** Vertaalt de holding-context naar één blok voor de prompt — puur informatief, de coach mag
 *  dit gebruiken als aanleiding voor een vraag, maar het stuurt de techniekkeuze niet: die gaat
 *  over Vincent zelf (zie chooseTechnique), niet over de bedrijfscijfers (CLAUDE.md: naast Iris,
 *  niet erboven — de coach leest, grijpt nooit in Iris' domein in). */
function holdingBlock(holding: HoldingContext | null): string {
  if (!holding || holding.status !== 'ok') return '';
  const parts: string[] = [];
  const proj = holding.projecten;
  if (proj && proj.stilstaand.length > 0) {
    parts.push(`${proj.stilstaand.length} van ${proj.totaal} projecten in de holding staan er zwak voor (${proj.stilstaand.map((p) => p.project).join(', ')}).`);
  }
  if (holding.waarheidsaudit && holding.waarheidsaudit.blokkerend > 0) {
    parts.push(`${holding.waarheidsaudit.blokkerend} blokkerende bevinding(en) in de waarheidsaudit.`);
  }
  if (holding.gemiste_runs && holding.gemiste_runs.aantal_jobs > 0) {
    parts.push(`${holding.gemiste_runs.aantal_jobs} taak/taken staan al even stil.`);
  }
  if (holding.agenda?.status === 'ok' && typeof holding.agenda.vandaag_afspraken === 'number') {
    parts.push(`Vandaag ${holding.agenda.vandaag_afspraken} afspraak/afspraken op de agenda.`);
  }
  if (parts.length === 0) return '';
  return `\nDE HOLDING VANDAAG (van Iris, gebruik dit als aanleiding, niet als opdracht):\n${parts.map((p) => `- ${p}`).join('\n')}\n`;
}

export function buildCoachPrompt(ctx: CoachContext, technique: Technique): string {
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const todayDate = now.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });

  const lessonsBlock = ctx.activeLessons.length
    ? ctx.activeLessons.map((l) => `- ${l.insight} (trefkans ${Math.round(l.confidence * 100)}%)`).join('\n')
    : 'Nog geen geleerde patronen — dit kan een van de eerste analyses zijn.';

  const energyBlock = ctx.recentEnergyLog.length
    ? ctx.recentEnergyLog.slice(0, 10).map((e) => `- ${e.date_string}: ${e.direction === 'gain' ? '+ gaf energie' : '- kostte energie'} — ${e.activity}${e.category ? ` (${e.category})` : ''}`).join('\n')
    : 'Nog geen energie-attributie ingevuld.';

  const { identity, challenger } = ctx;
  const object = identity.addressName || 'deze ondernemer';
  const possessive = identity.addressName ? 'zijn' : 'hun';
  const instructions = techniqueInstructions(identity);

  const sessionBlock = `SESSIE VAN VANDAAG (${todayDate}, ${dayName}):
- Energie: ${ctx.today.energyLevel ?? 'onbekend'}/10
- Slaap: ${ctx.today.sleepQuality ?? 'onbekend'}/10
- Wakker om: ${ctx.today.wakeTime ?? 'onbekend'}
- Intentie: "${ctx.today.intentie ?? ''}"
- Huidige streak: ${ctx.streak} dag${ctx.streak !== 1 ? 'en' : ''}

${ctx.yesterday ? `GISTEREN: energie ${ctx.yesterday.energyLevel}/10, slaap ${ctx.yesterday.sleepQuality}/10` : 'GISTEREN: geen sessie.'}

RECENTE ENERGIE-ATTRIBUTIE (wat gaf/kostte energie):
${energyBlock}

GELEERDE PATRONEN OVER ${identity.addressName ? identity.addressName.toUpperCase() : 'DEZE ONDERNEMER'} (gebruik deze, herhaal ze niet letterlijk):
${lessonsBlock}
${holdingBlock(ctx.holding)}`;

  if (challenger) {
    const trigger = detectChallengerTrigger(ctx);
    return `Jij bent ${challenger.displayName}, de exclusieve executive AI-challenger van ${object}.
Jouw doel is NIET om aardig gevonden te worden, noch om als therapeut op te treden. Jouw doel is om ${object} te dwingen tot meedogenloze executie, strategische hefbomen en het doorbreken van comfortabel uitstelgedrag.

JOUW KARAKTER:
- Nuchter, scherp, directief, zakelijk en uiterst beknopt (maximaal 2-3 zinnen per reactie).
- Wars van corporate jargon, wellness-clichés en theoretische modellen.
- Je spreekt ${object} aan op ooghoogte als een doorgewinterde DGA-mentor.

Belangrijke grens: je diagnosticeert of behandelt nooit psychische of medische klachten. Zie je een signaal van aanhoudende uitputting, burn-out, angst of iets vergelijkbaars dat langer dan een paar dagen aanhoudt, benoem dat expliciet en adviseer professionele hulp — challenge dan niet verder.

CONTEXT VAN DEZE ONDERNEMER:
- Sector: ${challenger.industryLabel}.
- Primaire hefboomdoel (90 dagen): ${challenger.quarterlyLeverageLabel}.
- Gekende valkuil: ${challenger.avoidanceLabel}.
- Top tijdvreters: ${challenger.topTimeWasterLabels.join(', ')}.

GEDRAGSREGELS:
1. FOCUS OP DE KIKKER: vraag uitsluitend naar de moeilijkste commerciële of operationele taak van vandaag. Weiger vage antwoorden zoals 'administratie' of 'website updaten'.
2. CHALLENGE UITSTELGEDRAG: zodra ${object} vlucht in veilig bouwen, coderen of interne regelzaken in plaats van klantcontact en margeverbetering, grijp je direct in en noem je de valkuil bij naam.
3. TARIEVEN EN MARGE: accepteer nooit dat ${object} zichzelf onder de marktprijs verkoopt. Herinner eraan dat ROI en vrijgespeelde uren verkocht worden, geen uurtjes.
4. EXECUTIE BOVEN ANALYSE: breek elk knelpunt direct af tot een actie die binnen 15 minuten gestart kan worden. Eindig altijd met een concrete vraag of aansporing.

${trigger ? `${trigger}\n\n` : ''}(Gekozen coachingslens op de achtergrond, gebruik dit alleen om je vraag scherper te maken, noem de techniek zelf nooit: ${TECHNIQUE_LABELS[technique]} — ${instructions[technique]})

${sessionBlock}
Schrijf een reactie van maximaal 2-3 zinnen in het Nederlands, in de jij-vorm. Geen wollige inleiding. Eindig altijd met precies één concrete vraag of aansporing aan ${object}.`;
  }

  return `Je bent De Sparringpartner: ${identity.addressName ? `${identity.addressName}s` : 'de'} persoonlijke business- én welzijnscoach, niet gescheiden maar gecombineerd — precies zoals dat in de praktijk voor ${identity.businessContext} altijd door elkaar loopt. Je bent niet ${possessive} klantenservice-bot en je coacht niemand anders dan ${object}.

Belangrijke grens: je diagnosticeert of behandelt nooit psychische of medische klachten. Zie je een signaal van aanhoudende uitputting, burn-out, angst of iets vergelijkbaars dat langer dan een paar dagen aanhoudt, benoem dat expliciet en adviseer professionele hulp — coach dan niet verder met een techniek.

GEKOZEN TECHNIEK VOOR VANDAAG: ${TECHNIQUE_LABELS[technique]}
${instructions[technique]}

${sessionBlock}
Schrijf een coach-reflectie van 120-180 woorden in het Nederlands, in de jij-vorm, warm maar scherp. Volg de aangewezen techniek. Eindig met precies één concrete vraag aan ${object} — geen waslijst, geen bullet points, gewone paragrafen.`;
}


/**
 * Build a prompt for follow-up messages in the coach chat conversation.
 * Takes the message history and constructs a prompt that continues the coaching dialogue.
 */
export async function buildFollowUpPrompt(
  messages: { role: string; content: string }[],
  organizationId: number | null = null
): Promise<string> {
  const identity = await loadCoachIdentity(organizationId);
  const object = identity.addressName || 'de ondernemer';
  const conversation = messages
    .map((m) => `${m.role === 'coach' ? 'Sparringpartner' : object}: ${m.content}`)
    .join('\\n\\n');

  return `Je bent De Sparringpartner, ${identity.addressName ? `${identity.addressName}s` : 'de'} persoonlijke business- en welzijnscoach.

Verloopt deze conversatie natuurlijk en kort. Wees warm maar scherp. Gebruik de jij-vorm. Maximaal 100 woorden.

CONVERSATIEEL GESCHIEDENIS:
${conversation}

${messages.length > 0 ? `Beantwoord nu op het laatste bericht van ${object}.` : 'Start de gesprekstroom.'}`;
}

/** Legt een observatie vast als coach_lesson: dedupe op pattern_key, confidence groeit met bewijs
 *  (Laplace-gladgestreken, zelfde formule als iris_lessons) i.p.v. bij elke run een nieuwe rij.
 *  organizationId alleen nodig voor de INSERT-tak — coach_lessons.organization_id is NOT NULL.
 *  Geeft de lesson-id terug zodat de aanroeper er een falsifieerbare predictie aan kan koppelen
 *  (zie maybeCreatePrediction). */
export async function rememberLesson(
  userId: string,
  organizationId: number | null,
  patternKey: string,
  technique: Technique,
  insight: string
): Promise<{ id: number; timesConfirmed: number; timesDisproven: number }> {
  const existing = await sql`SELECT id, times_confirmed, times_disproven FROM coach_lessons WHERE user_id = ${userId} AND pattern_key = ${patternKey} LIMIT 1`;
  if (existing.length > 0) {
    const confirmed = (existing[0].times_confirmed as number) + 1;
    const disproven = existing[0].times_disproven as number;
    const confidence = (confirmed + 1) / (confirmed + disproven + 2); // Laplace smoothing
    await sql`UPDATE coach_lessons SET insight = ${insight}, technique = ${technique},
      times_confirmed = ${confirmed}, confidence = ${confidence}, updated_at = NOW()
      WHERE id = ${existing[0].id}`;
    return { id: existing[0].id as number, timesConfirmed: confirmed, timesDisproven: disproven };
  }
  const inserted = await sql`INSERT INTO coach_lessons (user_id, pattern_key, technique, insight, confidence, times_confirmed, source, organization_id)
    VALUES (${userId}, ${patternKey}, ${technique}, ${insight}, 0.5, 1, 'coach_analyse', ${organizationId})
    RETURNING id`;
  return { id: inserted[0].id as number, timesConfirmed: 1, timesDisproven: 0 };
}

/** Metric die een predictie toetst, per techniek — gekozen zodat elke techniek een metric raakt
 *  die de gekozen aanpak direct zou moeten beïnvloeden (energie-technieken -> energieniveau,
 *  ritme-technieken -> streak). */
const PREDICTION_METRIC: Record<Technique, 'energy_level' | 'streak'> = {
  cgt: 'energy_level',
  mi: 'energy_level',
  systemisch: 'energy_level',
  grow: 'streak',
  oplossingsgericht: 'streak',
  strengths: 'streak',
  act: 'streak',
};

export const METRIC_LABELS: Record<'energy_level' | 'streak', string> = {
  energy_level: 'energieniveau',
  streak: 'streak',
};

const PREDICTION_HORIZON_DAYS = 7;

/** Legt na een coach-analyse een concrete, toetsbare voorspelling vast — de falsifieerbare
 *  tegenhanger van rememberLesson(). Slaat over als er al een onopgeloste predictie voor deze
 *  les loopt, zodat elke ochtendanalyse niet opnieuw dezelfde weddenschap aangaat. */
export async function maybeCreatePrediction(
  userId: string,
  organizationId: number | null,
  lessonId: number,
  ctx: CoachContext,
  technique: Technique
) {
  const metric = PREDICTION_METRIC[technique];
  const baseline = metric === 'energy_level' ? ctx.today.energyLevel : ctx.streak;
  if (baseline == null) return;

  const pending = await sql`SELECT id FROM coach_predictions WHERE lesson_id = ${lessonId} AND outcome IS NULL LIMIT 1`;
  if (pending.length > 0) return;

  const dueDate = new Date(Date.now() + PREDICTION_HORIZON_DAYS * 86400000).toISOString().split('T')[0];
  const statement = metric === 'energy_level'
    ? `Als deze aanpak werkt, verwacht ik dat je energieniveau over ${PREDICTION_HORIZON_DAYS} dagen hoger ligt dan vandaag (nu ${baseline}/10).`
    : `Als deze aanpak werkt, verwacht ik dat je streak over ${PREDICTION_HORIZON_DAYS} dagen minstens even hoog of hoger is dan nu (nu ${baseline} dag${baseline === 1 ? '' : 'en'}).`;

  await sql`
    INSERT INTO coach_predictions (organization_id, user_id, lesson_id, statement, metric, baseline, direction, horizon_days, due_date)
    VALUES (${organizationId}, ${userId}, ${lessonId}, ${statement}, ${metric}, ${baseline}, 'up', ${PREDICTION_HORIZON_DAYS}, ${dueDate})
  `;
}

/** Verwerkt de uitkomst van een getoetste predictie terug in de bijbehorende les: dit is het
 *  weerleggingsmechanisme dat rememberLesson() alleen niet kan bieden (die kan een les alleen
 *  bevestigen). Bij netto meer weerleggingen dan bevestigingen wordt de les gepensioneerd
 *  (active=false) — hij verschijnt dan niet meer in de coachprompt of /api/coach/lessons. */
async function applyPredictionOutcome(lessonId: number | null, outcome: 'correct' | 'incorrect' | 'unclear') {
  if (lessonId == null || outcome === 'unclear') return;

  const rows = await sql`SELECT times_confirmed, times_disproven FROM coach_lessons WHERE id = ${lessonId} LIMIT 1`;
  if (rows.length === 0) return;

  let confirmed = rows[0].times_confirmed as number;
  let disproven = rows[0].times_disproven as number;
  if (outcome === 'correct') confirmed += 1; else disproven += 1;
  const confidence = (confirmed + 1) / (confirmed + disproven + 2);
  const active = disproven <= confirmed;

  await sql`UPDATE coach_lessons SET times_confirmed = ${confirmed}, times_disproven = ${disproven},
    confidence = ${confidence}, active = ${active}, updated_at = NOW() WHERE id = ${lessonId}`;
}

/** Toetst elke voorspelling waarvan de due_date is verstreken: haalt de actuele metric-waarde op,
 *  vergelijkt met de baseline, en stroomt het resultaat terug naar de gekoppelde les. Aangeroepen
 *  als eerste stap van runCoachAnalysis() — geen aparte cron nodig, de dagelijkse ochtendflow is
 *  al frequent genoeg om predicties binnen een dag na hun due_date te toetsen. */
export async function resolveDuePredictions(userId: string, organizationId: number | null) {
  const due = await sql`
    SELECT id, lesson_id, metric, baseline FROM coach_predictions
    WHERE user_id = ${userId} AND outcome IS NULL AND due_date <= CURRENT_DATE
  `;
  if (due.length === 0) return;

  const [morningRows, allMorningDates] = await Promise.all([
    sql`SELECT data FROM daily_logs WHERE user_id = ${userId} AND type = 'morning' ORDER BY date_string DESC LIMIT 1`,
    sql`SELECT date_string FROM daily_logs WHERE user_id = ${userId} AND type = 'morning' ORDER BY date_string DESC LIMIT 30`,
  ]);
  const currentEnergy = morningRows.length > 0 ? parseData(morningRows[0].data)?.energyLevel : null;
  const currentStreak = getCurrentStreak((allMorningDates as { date_string: string }[]).map((r) => r.date_string));

  for (const prediction of due as { id: number; lesson_id: number | null; metric: 'energy_level' | 'streak'; baseline: number }[]) {
    const currentValue = prediction.metric === 'energy_level' ? currentEnergy : currentStreak;
    const outcome: 'correct' | 'incorrect' | 'unclear' =
      currentValue == null ? 'unclear'
      : currentValue > prediction.baseline ? 'correct'
      : currentValue < prediction.baseline ? 'incorrect'
      : 'unclear';

    await sql`UPDATE coach_predictions SET outcome = ${outcome}, resolved_at = NOW() WHERE id = ${prediction.id}`;
    await applyPredictionOutcome(prediction.lesson_id, outcome);
  }
}

export interface ProactiveSignal {
  signal: boolean;
  patternKey: string;
  message: string;
}

/** Deterministisch, geen LLM: bepaalt of er een patroon sterk genoeg is om ImpactOS' coach-
 *  WhatsApp-job te laten appen. Bewust een hogere drempel dan chooseTechnique (die kiest een
 *  techniek voor de ochtendreflectie op ELKE dag) — hier moet een écht aanhoudend patroon staan,
 *  anders leert een proactief bericht Vincent het nummer te negeren. Puur functioneel en dus
 *  triviaal te testen zonder database. */
export function detectProactiveSignal(
  recentMorningEnergy: number[],
  recentEnergyLog: EnergyLogRow[]
): ProactiveSignal {
  if (recentMorningEnergy.length >= 3 && recentMorningEnergy.slice(0, 3).every((e) => e <= 4)) {
    return {
      signal: true,
      patternKey: 'cgt:energie-drie-dagen-laag',
      message: 'Je energie staat nu drie dagen op rij laag. Niets om nu meteen op te lossen — maar wat zou vandaag al iets makkelijker maken?',
    };
  }

  const recent14 = recentEnergyLog.slice(0, 20); // energy_log is al DESC, dit is ruim genoeg voor ~2 weken
  const costCount = recent14.filter((e) => e.direction === 'cost').length;
  const gainCount = recent14.filter((e) => e.direction === 'gain').length;
  if (costCount >= 4 && costCount - gainCount >= 3) {
    return {
      signal: true,
      patternKey: 'mi:energie-kost-meer-dan-geeft',
      message: `De laatste tijd noteer je vaker wat energie kost dan wat het geeft (${costCount} tegen ${gainCount}). Wat zou dat evenwicht al een klein beetje terugbrengen?`,
    };
  }

  return { signal: false, patternKey: '', message: '' };
}

/** Zet user_context recht na elke coachrun, zodat de tabel niet langer ongebruikt in het schema
 *  staat. organizationId alleen relevant voor de eerste keer (INSERT-tak) — user_context.
 *  organization_id is NOT NULL, en verandert toch niet meer op een bestaande rij. */
export async function updateUserContext(userId: string, organizationId: number | null, ctx: CoachContext) {
  const mood = (ctx.today.energyLevel ?? 5) >= 7 ? 'energized'
    : (ctx.today.energyLevel ?? 5) <= 3 ? 'overwhelmed'
    : 'neutral';

  await sql`
    INSERT INTO user_context (user_id, current_energy_level, current_stress_level, recent_mood, updated_at, organization_id)
    VALUES (${userId}, ${ctx.today.energyLevel ?? 5}, ${ctx.userContext.current_stress_level}, ${mood}, NOW(), ${organizationId})
    ON CONFLICT (user_id) DO UPDATE SET
      current_energy_level = EXCLUDED.current_energy_level,
      recent_mood = EXCLUDED.recent_mood,
      updated_at = NOW()
  `;
}

export interface BridgeOrganization {
  userId: string;
  organizationId: number;
}

/** Machine-to-machine auth voor de bridge-routes (ImpactOS -> mijn-ondernemers-os), per
 *  organisatie i.p.v. het vroegere ene gedeelde COACH_BRIDGE_TOKEN dat altijd naar de eerste
 *  gebruiker in de hele tabel resolvede (loadSingleUserId — brak zodra er een tweede
 *  organisatie bijkwam, zoals het bestaande demo-account). Hasht het token en zoekt 'm op in
 *  client_bridge_tokens; geeft de eerste user van díe organisatie terug. Fail closed: geen of
 *  onbekend token betekent null, nooit "open by default" of een gok naar de verkeerde klant.
 *  Zelfde patroon als ImpactOS' remote/api/_lib.js:resolveBridgeTenant(). */
export async function resolveBridgeOrganization(
  authorizationHeader: string | null
): Promise<BridgeOrganization | null> {
  const auth = authorizationHeader ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const rows = await sql`
    SELECT organization_id FROM client_bridge_tokens WHERE token_hash = ${tokenHash}
  `;
  if (rows.length === 0) return null;
  const organizationId = rows[0].organization_id;

  const users = await sql`
    SELECT id FROM users WHERE organization_id = ${organizationId} ORDER BY id ASC LIMIT 1
  `;
  if (users.length === 0) return null;
  return { userId: String(users[0].id), organizationId };
}

function slugifyPattern(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

/** MECHANISME 1 — Kikker-knop: genereert 3 korte, direct te gebruiken openingszinnen voor het
 *  telefoontje/bericht dat wordt uitgesteld, gebaseerd op het bekende vluchtgedrag en de top-
 *  tijdvreters uit de onboarding. Geen audioprimer (geen voice-assets beschikbaar) — alleen tekst,
 *  bedoeld om precies bij de 15-minuten countdown te verschijnen zodat er niet nagedacht hoeft te
 *  worden, alleen getypt of gebeld. */
export async function generateFrogOpeners(userId: string, taskDescription: string | null): Promise<{ displayName: string; lines: string[] }> {
  const challenger = await loadChallengerProfile(userId);
  const displayName = challenger?.displayName ?? 'je coach';
  const task = taskDescription?.trim() || challenger?.topTimeWasterLabels[0] || 'de taak die je uitstelt';

  const prompt = `Jij bent ${displayName}, een nuchtere, directieve executive-challenger voor een ondernemer.
Context: de ondernemer stelt dit uit: "${task}"${challenger ? `. Bekende valkuil: ${challenger.avoidanceLabel}.` : '.'}
Geef EXACT 3 korte openingszinnen (max 20 woorden elk) die de ondernemer letterlijk kan gebruiken om dit gesprek of bericht nu te starten, zonder verder na te denken. Geen inleiding, geen uitleg — alleen de 3 zinnen, elk op een eigen regel, genummerd "1." "2." "3.".`;

  try {
    const raw = await openRouterChat(prompt, 200);
    const lines = raw
      .split('\n')
      .map((l) => l.replace(/^\s*\d+[.)]\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 3);
    if (lines.length === 3) return { displayName, lines };
  } catch (err) {
    console.error('Kikker-opener LLM error:', err);
  }
  return {
    displayName,
    lines: [
      `Hoi, ik bel je nu even over ${task} — heb je twee minuten?`,
      `Ik wilde dit niet langer laten liggen: ${task}. Zullen we dat nu afronden?`,
      `Kort en direct: ${task}. Kunnen we dat nu even regelen?`,
    ],
  };
}

export interface CommercialDensity {
  /** Percentage van de avond-realiteitstoetsen deze week die 'waarde_verkocht' waren — 0-100,
   *  null als er nog geen enkele avondcheck deze week is gedaan (dan is een percentage misleidend). */
  percentage: number | null;
  verdictsLogged: number;
  waardeVerkocht: number;
  gevluchtInVeiligheid: number;
}

/** MECHANISME 4 — Wekelijkse Data-Spiegel: berekent hoeveel van de laatste 7 avond-
 *  realiteitstoetsen 'waarde verkocht / kikker afgemaakt' waren t.o.v. 'gevlucht in veilige
 *  klussen'. Dit is de enige plek in de dagritmes waar "veilige klussen" een expliciete, eigen
 *  keuze is (focusblok-categorieën zijn allemaal legitieme werksoorten) — dus de avondkeuze is
 *  het eerlijkste signaal, geen aanname op basis van focusblok-labels. */
export async function getCommercialDensity(userId: string): Promise<CommercialDensity> {
  const rows = await sql`
    SELECT data FROM daily_logs
    WHERE user_id = ${userId} AND type = 'evening' AND date_string >= (CURRENT_DATE - INTERVAL '6 days')
    ORDER BY date_string DESC
  `;
  const verdicts = (rows as { data: any }[])
    .map((r) => parseData(r.data)?.eveningVerdict)
    .filter((v): v is string => typeof v === 'string');

  const waardeVerkocht = verdicts.filter((v) => v === 'waarde_verkocht').length;
  const gevluchtInVeiligheid = verdicts.filter((v) => v === 'gevlucht_in_veiligheid').length;

  return {
    percentage: verdicts.length > 0 ? Math.round((waardeVerkocht / verdicts.length) * 100) : null,
    verdictsLogged: verdicts.length,
    waardeVerkocht,
    gevluchtInVeiligheid,
  };
}

export type CoachAnalysisResult =
  | { ok: true; technique: Technique; techniqueLabel: string; reason: string; analysis: string; streak: number }
  | { ok: false; status: number; error: string; technique?: Technique; reason?: string };

/** Eén coach-reflectie, los van hoe de aanroeper geauthenticeerd is: de browser via JWT
 *  (/api/coach/analyse) of ImpactOS' Control Room via het gedeelde bridge-token
 *  (/api/coach/bridge/analyse). Cijfers eerst (deterministisch gekozen techniek), dan pas het
 *  LLM-oordeel erbovenop — zelfde volgorde als Iris' briefing. Legt de observatie vast als
 *  coach_lesson en werkt user_context bij. */
export async function runCoachAnalysis(userId: string, organizationId: number | null): Promise<CoachAnalysisResult> {
  await resolveDuePredictions(userId, organizationId);
  const ctx = await loadCoachContext(userId, organizationId);

  if (!ctx.today.energyLevel) {
    return {
      ok: false,
      status: 409,
      error: 'Nog geen ochtendritueel van vandaag — de coach heeft een echte meting nodig, geen aanname.',
    };
  }

  const { technique, reason } = chooseTechnique(ctx);
  const prompt = buildCoachPrompt(ctx, technique);

  let analysis: string;
  try {
    analysis = await openRouterChat(prompt, 400);
  } catch (err) {
    console.error('Coach LLM error:', err);
    return {
      ok: false,
      status: 502,
      error: 'De coach-reflectie kon niet gegenereerd worden. De cijfers hieronder blijven wel geldig.',
      technique,
      reason,
    };
  }

  const patternKey = `${technique}:${slugifyPattern(reason)}`;
  const lesson = await rememberLesson(userId, organizationId, patternKey, technique, reason);
  await maybeCreatePrediction(userId, organizationId, lesson.id, ctx, technique);
  await updateUserContext(userId, organizationId, ctx);

  return {
    ok: true,
    technique,
    techniqueLabel: TECHNIQUE_LABELS[technique],
    reason,
    analysis,
    streak: ctx.streak,
  };
}
