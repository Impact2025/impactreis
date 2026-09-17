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
import { normalizeNextActions } from './goal-actions';
import { getCurrentQuarter, getDayType, getDateDaysAgo } from './weekflow.service';
import { isCalendarConfiguredFor, listTodayEvents } from './google-calendar';
import { getRitualStatus } from './ritual-status.service';

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
  type: 'morning' | 'evening' | 'dagboek_ochtend' | 'dagboek_avond' | 'controle_cirkel' | string;
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
  /** Actieve identiteitsstatements + bewijs-cijfers uit de /identity-pagina, leeg als iemand die
   *  feature niet gebruikt — zie loadActiveIdentityStatements(). */
  identityStatements: ActiveIdentityStatement[];
  /** Impact Coach-persona + Bedrijfs-DNA uit de tap-first onboarding — null zolang iemand nog de
   *  oude AIPA-intake heeft (of nooit `coachProfile.toneSeverity: 'high_challenger'` koos), dan
   *  valt de prompt terug op de bestaande "Sparringpartner"-persona hieronder. */
  challenger: ChallengerProfile | null;
  /** Openstaande 80/20-hefboomtaak van dit kwartaal — zelfde bron/logica als runNextStepAnalysis
   *  (zie sql-query daar), maar nu ook zichtbaar voor de reflectie-analyse en de chat, die dit
   *  voorheen niet zagen ondanks dat het dashboard het wél toont. */
  openLeverageTask: { goalTitle: string; actionText: string } | null;
  openRocksCount: number;
  /** Laatste wins + hoeveel er deze week gelogd zijn — de coach wist hier voorheen niets van. */
  recentWins: { title: string; category: string; date: string }[];
  winsThisWeek: number;
  /** Focus-sessies van vandaag — telt mee als "heb ik überhaupt gewerkt aan mijn hefboomtaak",
   *  niet alleen "wat zei ik in het ochtendritueel". */
  focusSessionsToday: number;
  focusMinutesToday: number;
  /** Dagboek- en Controle Cirkel-entries van vandaag. Deze data werd al opgehaald (in de oude
   *  `last7Days`-query) maar nergens gebruikt door een `.find()` die alleen op type 'morning'/
   *  'evening' matchte — dagboek/controle-cirkel-rijen werden zo stilzwijgend genegeerd. */
  todayJournal: { moment: 'ochtend' | 'avond'; stemming: string; tekst: string }[];
  todayControleCirkel: { probleem: string; gekozenActie: string; losgelaten: boolean }[];
}

export interface ChallengerProfile {
  displayName: string;
  gender: 'male' | 'female';
  industryLabel: string;
  topTimeWasterLabels: string[];
  avoidanceBehavior: string;
  avoidanceLabel: string;
  quarterlyLeverageLabel: string;
  /** Martell Stap 4 (Stakes) — null zolang iemand de onboarding vóór de Consequentie-Module
   *  heeft doorlopen. Geen consequentie is geen reden om de rest te blokkeren. */
  painfulConsequence: string | null;
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
    painfulConsequence: profile.consequenceModule?.description ?? null,
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
    return `CHALLENGER_MODE_ACTIVE: de ondernemer geeft zelf aan vandaag gevlucht te zijn in veilige klussen in plaats van de belangrijkste taak af te maken${detail ? ` ("${detail}")` : ''}. Vraag: "Welke veilige taak heeft je afgeleid, en staat deze taak morgen om 09:00 uur ingepland?" — accepteer geen ontwijkend antwoord.`;
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

  const currentQuarter = getCurrentQuarter();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [
    morningRows, allMorningDates, energyRows, lessonRows, contextRows, holding, challenger, identityStatements,
    goalRows, winRows, winsThisWeekRows, focusRows,
  ] = await Promise.all([
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
    loadActiveIdentityStatements(userId),
    // Zelfde bron als runNextStepAnalysis (zie sql-query daar) — nu ook zichtbaar voor de
    // reflectie-analyse en de chat, die dit voorheen niet zagen.
    sql`SELECT data FROM goals WHERE user_id = ${userId} AND organization_id = ${organizationId}`,
    sql`SELECT title, category, date FROM wins WHERE user_id = ${userId}
        ORDER BY date DESC LIMIT 3`,
    sql`SELECT COUNT(*)::int AS count FROM wins WHERE user_id = ${userId} AND date >= ${sevenDaysAgo}`,
    sql`SELECT duration_minutes FROM focus_sessions
        WHERE user_id = ${userId} AND date = ${today} AND completed = TRUE`,
  ]);

  const todayMorning = (morningRows as DailyLogRow[]).find((r) => r.date_string === today && r.type === 'morning');
  const yesterdayMorning = (morningRows as DailyLogRow[]).find((r) => r.date_string === yesterday && r.type === 'morning');
  const todayEvening = (morningRows as DailyLogRow[]).find((r) => r.date_string === today && r.type === 'evening');

  // Dagboek/Controle Cirkel: was al opgehaald via bovenstaande query (geen type-filter), maar
  // werd nergens uitgelezen — zie het commentaar bij CoachContext.todayJournal hierboven.
  const todayJournal = (morningRows as DailyLogRow[])
    .filter((r) => r.date_string === today && (r.type === 'dagboek_ochtend' || r.type === 'dagboek_avond'))
    .map((r) => {
      const d = parseData(r.data) as { stemming?: string; tekst?: string } | undefined;
      return { moment: (r.type === 'dagboek_ochtend' ? 'ochtend' : 'avond') as 'ochtend' | 'avond', stemming: d?.stemming ?? '', tekst: d?.tekst ?? '' };
    });
  const todayControleCirkel = (morningRows as DailyLogRow[])
    .filter((r) => r.date_string === today && r.type === 'controle_cirkel')
    .map((r) => {
      const d = parseData(r.data) as { probleem?: string; gekozen_actie?: string; losgelaten?: boolean } | undefined;
      return { probleem: d?.probleem ?? '', gekozenActie: d?.gekozen_actie ?? '', losgelaten: !!d?.losgelaten };
    });

  const openLeverageTask = (goalRows as { data: any }[])
    .map((r) => r.data)
    .filter((g) => !g.completed && g.isRock && g.quarter === currentQuarter)
    .flatMap((g) => normalizeNextActions(g.nextActions)
      .filter((a) => a.leverage && !a.completed)
      .map((a) => ({ goalTitle: g.title as string, actionText: a.text })))[0] ?? null;
  const openRocksCount = (goalRows as { data: any }[])
    .map((r) => r.data)
    .filter((g) => !g.completed && g.isRock && g.quarter === currentQuarter).length;

  const focusSessionsToday = (focusRows as { duration_minutes: number | null }[]).length;
  const focusMinutesToday = (focusRows as { duration_minutes: number | null }[])
    .reduce((sum, r) => sum + (r.duration_minutes ?? 0), 0);

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
    identityStatements: identityStatements as ActiveIdentityStatement[],
    challenger: challenger as ChallengerProfile | null,
    openLeverageTask,
    openRocksCount,
    recentWins: (winRows as { title: string; category: string; date: string }[]),
    winsThisWeek: (winsThisWeekRows as { count: number }[])[0]?.count ?? 0,
    focusSessionsToday,
    focusMinutesToday,
    todayJournal,
    todayControleCirkel,
  };
}

export interface ActiveIdentityStatement {
  statement: string;
  proofCount: number;
  streak: number;
}

/** Actieve identiteitsstatements uit de /identity-pagina (zie identity_profiles) — de coach
 *  gebruikt dit als extra laag naast de gemeten cijfers: niet "wat is er gebeurd" maar "wie
 *  probeert deze ondernemer te zijn", zodat de reflectie daar ook op kan spiegelen. Uitgeschakelde
 *  statements (isActive: false) tellen niet mee, net als op de pagina zelf. */
export async function loadActiveIdentityStatements(userId: string): Promise<ActiveIdentityStatement[]> {
  const rows = await sql`SELECT statements FROM identity_profiles WHERE user_id = ${userId} LIMIT 1`;
  const statements = (rows[0]?.statements as any[] | undefined) ?? [];
  return statements
    .filter((s) => s?.isActive)
    .map((s) => ({ statement: String(s.statement ?? ''), proofCount: Number(s.proofCount ?? 0), streak: Number(s.streak ?? 0) }));
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

  // Wie ${object} probeert te zijn (niet wat er gemeten is) — alleen aanwezig als iemand de
  // /identity-pagina daadwerkelijk gebruikt, dus mag zonder blok ook prima ontbreken.
  const identityBlock = ctx.identityStatements.length
    ? `\nGEKOZEN IDENTITEIT (waar ${object} zichzelf op wil aanspreken, gebruik dit om te spiegelen — niet elke sessie herhalen):\n${ctx.identityStatements
        .map((s) => `- "${s.statement}" (${s.proofCount} bewijzen verzameld${s.streak > 0 ? `, ${s.streak} dag streak` : ''})`)
        .join('\n')}\n`
    : '';

  // Doelen/wins/focus/dagboek/controle-cirkel — voorheen zag geen enkele coach-functie dit,
  // ondanks dat het dashboard het wél toont.
  const activityParts: string[] = [];
  if (ctx.openLeverageTask) {
    activityParts.push(`- Openstaande 80/20-hefboomtaak dit kwartaal: "${ctx.openLeverageTask.actionText}" (bij doel "${ctx.openLeverageTask.goalTitle}")${ctx.openRocksCount > 1 ? `, nog ${ctx.openRocksCount - 1} andere kwartaaldoelen open` : ''}.`);
  } else if (ctx.openRocksCount > 0) {
    activityParts.push(`- ${ctx.openRocksCount} kwartaaldoel(en) actief, geen hefboomtaak specifiek als 80/20 gemarkeerd.`);
  }
  activityParts.push(
    ctx.focusSessionsToday > 0
      ? `- Vandaag al ${ctx.focusSessionsToday} focussessie(s) afgerond (${ctx.focusMinutesToday} minuten).`
      : '- Nog geen focussessie afgerond vandaag.'
  );
  if (ctx.recentWins.length > 0) {
    activityParts.push(`- Recente wins: ${ctx.recentWins.map((w) => `"${w.title}" (${w.category})`).join(', ')}${ctx.winsThisWeek > ctx.recentWins.length ? ` — ${ctx.winsThisWeek} deze week` : ''}.`);
  } else {
    activityParts.push('- Nog geen wins gelogd deze week.');
  }
  ctx.todayJournal.forEach((j) => {
    if (j.tekst.trim()) activityParts.push(`- Dagboek (${j.moment}, stemming: ${j.stemming}): "${j.tekst.slice(0, 200)}${j.tekst.length > 200 ? '…' : ''}"`);
  });
  ctx.todayControleCirkel.forEach((c) => {
    activityParts.push(`- Controle Cirkel: "${c.probleem}"${c.gekozenActie ? ` → gekozen actie: "${c.gekozenActie}"` : ''}${c.losgelaten ? ' (losgelaten)' : ''}.`);
  });
  const activityBlock = `\nWAT ${object.toUpperCase()} VERDER DOET IN DE APP (gebruik dit om je vraag te aarden in wat er echt speelt, niet alleen in de ochtendmeting):\n${activityParts.join('\n')}\n`;

  const sessionBlock = `SESSIE VAN VANDAAG (${todayDate}, ${dayName}):
- Energie: ${ctx.today.energyLevel ?? 'onbekend'}/10
- Slaap: ${ctx.today.sleepQuality ?? 'onbekend'}/10
- Wakker om: ${ctx.today.wakeTime ?? 'onbekend'}
- Intentie: "${ctx.today.intentie ?? ''}"
- Huidige streak: ${ctx.streak} dag${ctx.streak !== 1 ? 'en' : ''}

${ctx.yesterday ? `GISTEREN: energie ${ctx.yesterday.energyLevel}/10, slaap ${ctx.yesterday.sleepQuality}/10` : 'GISTEREN: geen sessie.'}

RECENTE ENERGIE-ATTRIBUTIE (wat gaf/kostte energie):
${energyBlock}
${activityBlock}
GELEERDE PATRONEN OVER ${identity.addressName ? identity.addressName.toUpperCase() : 'DEZE ONDERNEMER'} (gebruik deze, herhaal ze niet letterlijk):
${lessonsBlock}
${identityBlock}${holdingBlock(ctx.holding)}`;

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
${challenger.painfulConsequence ? `- Eigen afgesproken consequentie bij het missen van het kwartaaldoel: "${challenger.painfulConsequence}". Gebruik dit als de ondernemer wegglijdt — herinner eraan wat er op het spel staat, dreig er niet mee als straf.` : ''}

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


/** Laatste bekende avond-realiteitstoets van vandaag — losstaand van loadCoachContext (die
 *  alleen ochtend+avond van vandaag/gisteren samenvoegt voor de reflectie-prompt) omdat de
 *  coach-chat een lichter path is dat geen hele CoachContext hoeft op te bouwen. */
async function loadTodayEveningVerdict(userId: string): Promise<string | null> {
  const today = new Date().toISOString().split('T')[0];
  const rows = await sql`
    SELECT data FROM daily_logs WHERE user_id = ${userId} AND type = 'evening' AND date_string = ${today} LIMIT 1
  `;
  const data = (rows as { data: any }[])[0]?.data;
  return parseData(data)?.eveningVerdict ?? null;
}

/**
 * Build a prompt for follow-up messages in the coach chat conversation.
 * Takes the message history and constructs a prompt that continues the coaching dialogue.
 */
export async function buildFollowUpPrompt(
  messages: { role: string; content: string }[],
  organizationId: number | null = null,
  userId: string | null = null
): Promise<string> {
  const identity = await loadCoachIdentity(organizationId);
  const object = identity.addressName || 'de ondernemer';
  const conversation = messages
    .map((m) => `${m.role === 'coach' ? 'Coach' : object}: ${m.content}`)
    .join('\\n\\n');

  const challenger = userId ? await loadChallengerProfile(userId) : null;

  // MECHANISME (Martell Stap 3) — Double-Click Root Cause Mode: als de kikker vandaag niet is
  // afgemaakt, geeft de coach de eerste 3 beurten GEEN advies — alleen een steeds dieper
  // doorvragende waarom-vraag, om de echte weerstand bloot te leggen vóór er iets opgelost wordt.
  if (challenger && userId) {
    const eveningVerdict = await loadTodayEveningVerdict(userId);
    if (eveningVerdict === 'gevlucht_in_veiligheid') {
      const coachTurnsSoFar = messages.filter((m) => m.role === 'coach').length;
      const round = coachTurnsSoFar + 1;
      if (round <= 3) {
        return `Jij bent ${challenger.displayName}, in Root Cause Mode (doorvraag-ronde ${round} van 3).

REGELS VOOR DEZE RONDE:
- Geef GEEN advies, GEEN oplossing, GEEN geruststelling.
- Stel exact één "waarom"-vraag die dieper gaat dan het vorige antwoord van ${object} — double-click op wat hij net zei, niet op iets nieuws.
- Maximaal 2 zinnen. Geen inleiding.
- Bekende valkuil van ${object}: ${challenger.avoidanceLabel}.

CONVERSATIEGESCHIEDENIS:
${conversation}

Stel nu de doorvraag-vraag van ronde ${round}.`;
      }
      return `Jij bent ${challenger.displayName}. De 3 doorvraag-rondes zijn voorbij — de echte weerstand ligt nu op tafel.

REGELS: geen nieuwe vragen meer over "waarom". Breek dit nu af tot één concrete actie die binnen 15 minuten gestart kan worden, met een expliciet moment (vandaag of morgenvroeg 09:00). ${challenger.painfulConsequence ? `Refereer kort aan de afgesproken consequentie als het nog steeds vaag blijft: "${challenger.painfulConsequence}".` : ''} Maximaal 3 zinnen.

CONVERSATIEGESCHIEDENIS:
${conversation}

Reageer nu op het laatste bericht van ${object}.`;
    }
  }

  if (challenger) {
    return `Jij bent ${challenger.displayName}, de executive AI-challenger van ${object}. Nuchter, scherp, maximaal 2-3 zinnen, geen wellness-taal. Gebruik de jij-vorm.

CONVERSATIEGESCHIEDENIS:
${conversation}

${messages.length > 0 ? `Reageer nu op het laatste bericht van ${object}.` : 'Start het gesprek.'}`;
  }

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
export async function resolveDuePredictions(userId: string, _organizationId: number | null) {
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

export interface ScorecardMetric {
  key: 'kikker' | 'energie' | 'consistentie';
  label: string;
  /** 0-10, of null als er deze week nog niets over te zeggen valt (geen loze aanname). */
  score: number | null;
}

export interface WeeklyScorecard {
  metrics: ScorecardMetric[];
  /** De 2 laagste met een score — dit is precies wat de Vrijdagmiddag Scorecard isoleert
   *  voor het maandelijkse executive sparringgesprek (Martell Stap 2). */
  lowestTwo: ScorecardMetric[];
}

/** MECHANISME — Vrijdagmiddag Scorecard (Martell Stap 2): berekent de 3 non-negotiables van
 *  Impact Coach over de laatste 7 dagen en isoleert de 2 laagste, in plaats van alles te tonen —
 *  precies het punt van een scorecard: niet vieren wat al goed gaat, focussen op wat achterblijft. */
export async function computeWeeklyScorecard(userId: string): Promise<WeeklyScorecard> {
  // date_string is een text-kolom (ISO "YYYY-MM-DD"), dus vergelijken tegen een SQL date/interval
  // ("(CURRENT_DATE - INTERVAL '6 days')") faalt met "operator does not exist: text >= timestamp"
  // — vandaar hier dezelfde aanpak als elders (bv. ritual-status.service.ts): de grens als
  // ISO-stringparameter meegeven i.p.v. in SQL uit te rekenen.
  const since = getDateDaysAgo(6);
  const [morningRows, eveningRows] = await Promise.all([
    sql`SELECT date_string, data FROM daily_logs
        WHERE user_id = ${userId} AND type = 'morning' AND date_string >= ${since}`,
    sql`SELECT data FROM daily_logs
        WHERE user_id = ${userId} AND type = 'evening' AND date_string >= ${since}`,
  ]);

  const mornings = (morningRows as { date_string: string; data: any }[]).map((r) => ({ date: r.date_string, ...parseData(r.data) }));
  const verdicts = (eveningRows as { data: any }[]).map((r) => parseData(r.data)?.eveningVerdict).filter((v): v is string => typeof v === 'string');

  const energyValues = mornings.map((m) => m.energyLevel).filter((v): v is number => typeof v === 'number');
  const energieScore = energyValues.length > 0 ? Math.round((energyValues.reduce((a, b) => a + b, 0) / energyValues.length) * 10) / 10 : null;

  const kikkerScore = verdicts.length > 0 ? Math.round((verdicts.filter((v) => v === 'waarde_verkocht').length / verdicts.length) * 10 * 10) / 10 : null;

  const uniqueDays = new Set(mornings.map((m) => m.date)).size;
  const consistentieScore = Math.round((Math.min(uniqueDays, 7) / 7) * 10 * 10) / 10;

  const metrics: ScorecardMetric[] = [
    { key: 'kikker', label: 'Belangrijkste taak afgemaakt', score: kikkerScore },
    { key: 'energie', label: 'Energie', score: energieScore },
    { key: 'consistentie', label: 'Ritueel-consistentie', score: consistentieScore },
  ];

  const lowestTwo = [...metrics]
    .filter((m) => m.score !== null)
    .sort((a, b) => (a.score as number) - (b.score as number))
    .slice(0, 2);

  return { metrics, lowestTwo };
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

// ═══ "BESTE VOLGENDE STAP" — /api/coach/next-step ═══════════════════════════════════════
//
// Het dashboard stapelt ~10 gelijkwaardige kaarten (rituelen, hefboomtaken, agenda, scorecard,
// ...). Deze kaart pikt daar één winnaar uit met vaste, deterministische prioriteit — zelfde
// "cijfers eerst" filosofie als chooseTechnique/detectProactiveSignal — en laat de LLM alleen
// de FORMULERING doen, nooit de keuze zelf.

export type NextStepKey =
  | 'geen-ochtendritueel'
  | 'proactief-signaal'
  | 'weekstart-open'
  | 'kikker-open'
  | 'hefboomtaak-open'
  | 'drukke-dag'
  | 'zwakke-scorecard'
  | 'weekreview-open'
  | 'verdieping-suggestie'
  | 'streak-fallback';

export interface NextStepCandidate {
  key: NextStepKey;
  headline: string;
  /** Het meetbare feit, puur uit de data — dit is wat de prompt aan de LLM meegeeft, de LLM
   *  mag dit nooit zelf verzinnen. */
  factLine: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface NextStepInput {
  hasMorningRitual: boolean;
  proactiveSignal: ProactiveSignal;
  weeklyStartOpen: boolean;
  frogLabel: string | null;
  frogDone: boolean;
  leverageTask: { goalTitle: string; actionText: string } | null;
  meetingMinutes: number;
  scorecard: WeeklyScorecard;
  weeklyReviewOpen: boolean;
  /** Al kant-en-klaar bepaald door determineToolSuggestion — zie daar voor de "welke tool is
   *  het langst niet gebruikt"-logica. Hier alleen nog de prioriteit t.o.v. de andere kandidaten. */
  toolSuggestion: NextStepCandidate | null;
  streak: number;
}

/** Puur functioneel en dus triviaal te testen zonder database — zelfde stijl als
 *  detectProactiveSignal. Eerste match wint, altijd een geldig eindpunt (nooit null). */
export function determineNextStepCandidate(input: NextStepInput): NextStepCandidate {
  if (!input.hasMorningRitual) {
    return {
      key: 'geen-ochtendritueel',
      headline: 'Begin met je ochtendritueel',
      factLine: 'Er is vandaag nog geen ochtendritueel ingevuld — zonder die meting heeft geen enkele andere aanbeveling houvast.',
      ctaLabel: 'Start ochtendritueel',
      ctaHref: '/morning',
    };
  }
  if (input.proactiveSignal.signal) {
    return {
      key: 'proactief-signaal',
      headline: 'Sparren signaleert een patroon',
      factLine: input.proactiveSignal.message,
      ctaLabel: 'Bespreek met Sparren',
      ctaHref: '/coach',
    };
  }
  if (input.weeklyStartOpen) {
    return {
      key: 'weekstart-open',
      headline: 'Start je week',
      factLine: 'Er is deze week nog geen weekstart gedaan — zonder gekozen focus voor de week stuurt de rest van de dagen op toeval.',
      ctaLabel: 'Start je week',
      ctaHref: '/weekly-start',
    };
  }
  if (input.frogLabel && !input.frogDone) {
    return {
      key: 'kikker-open',
      headline: 'Maak eerst je belangrijkste taak af',
      factLine: `Je belangrijkste taak van vandaag ("${input.frogLabel}") is nog niet afgerond.`,
      ctaLabel: 'Doorbreek uitstel',
      ctaHref: '/dashboard',
    };
  }
  if (input.leverageTask) {
    return {
      key: 'hefboomtaak-open',
      headline: 'Hefboomtaak wacht',
      factLine: `Openstaande 80/20-hefboomtaak "${input.leverageTask.actionText}" bij het doel "${input.leverageTask.goalTitle}".`,
      ctaLabel: 'Naar doelen',
      ctaHref: '/goals',
    };
  }
  if (input.meetingMinutes >= 300) {
    return {
      key: 'drukke-dag',
      headline: 'Bouw hersteltijd in',
      factLine: `Vandaag staat er ${Math.round((input.meetingMinutes / 60) * 10) / 10} uur aan afspraken gepland — een drukke dag zonder ingepland herstel.`,
      ctaLabel: 'Bekijk agenda',
      ctaHref: '/dashboard',
    };
  }
  const weakest = input.scorecard.lowestTwo[0];
  if (weakest && weakest.score !== null && weakest.score < 6) {
    return {
      key: 'zwakke-scorecard',
      headline: 'Zwakste punt deze week',
      factLine: `"${weakest.label}" staat deze week op ${weakest.score}/10 — de zwakste van de drie non-negotiables.`,
      ctaLabel: 'Bespreek met Sparren',
      ctaHref: '/coach',
    };
  }
  if (input.weeklyReviewOpen) {
    return {
      key: 'weekreview-open',
      headline: 'Sluit je week af',
      factLine: 'Deze week is nog niet afgesloten met een Week Review — reflectie is wat een week tot leerstof maakt in plaats van alleen tijd die voorbijging.',
      ctaLabel: 'Naar Week Review',
      ctaHref: '/weekly-review',
    };
  }
  if (input.toolSuggestion) {
    return input.toolSuggestion;
  }
  return {
    key: 'streak-fallback',
    headline: 'Hou de lijn vast',
    factLine: `Streak van ${input.streak} dag${input.streak !== 1 ? 'en' : ''}, geen acute knelpunten — de kans om verder te bouwen.`,
    ctaLabel: 'Naar doelen',
    ctaHref: '/goals',
  };
}

const STALE_DAGBOEK_DAYS = 10;
const STALE_CIRKEL_DAYS = 21;

export interface ToolSuggestionInput {
  /** Nog geen enkele identiteitsverklaring vastgelegd. */
  identityEmpty: boolean;
  /** null = nog nooit gebruikt. */
  daysSinceDagboek: number | null;
  daysSinceControleCirkel: number | null;
}

/** Kiest, buiten de kern-rituelen om, welke "verdiepings"-tool (Identiteit, Dagboek, Controle
 *  Cirkel) het langst is blijven liggen — puur functioneel, zelfde stijl als
 *  determineNextStepCandidate. Identiteit weegt zwaarst (fundament), daarna wint de tool met de
 *  langste stilte (nooit gebruikt = oneindig stil). Geeft null als niets stil genoeg staat. */
export function determineToolSuggestion(input: ToolSuggestionInput): NextStepCandidate | null {
  if (input.identityEmpty) {
    return {
      key: 'verdieping-suggestie',
      headline: 'Nog niet verkend: Identiteit',
      factLine: 'Er is nog geen enkele identiteitsverklaring vastgelegd — de tool waarmee je claimt wie je wil zijn.',
      ctaLabel: 'Naar Identiteit',
      ctaHref: '/identity',
    };
  }

  const dagboekStale = input.daysSinceDagboek === null || input.daysSinceDagboek >= STALE_DAGBOEK_DAYS;
  const cirkelStale = input.daysSinceControleCirkel === null || input.daysSinceControleCirkel >= STALE_CIRKEL_DAYS;
  if (!dagboekStale && !cirkelStale) return null;

  const dagboekAge = input.daysSinceDagboek ?? Infinity;
  const cirkelAge = input.daysSinceControleCirkel ?? Infinity;
  if (dagboekStale && (!cirkelStale || dagboekAge >= cirkelAge)) {
    return {
      key: 'verdieping-suggestie',
      headline: 'Nog niet verkend: Dagboek',
      factLine: input.daysSinceDagboek === null
        ? 'Het Dagboek is nog nooit gebruikt om bij te houden hoe het gaat.'
        : `De laatste dagboek-notitie is ${input.daysSinceDagboek} dagen geleden.`,
      ctaLabel: 'Open Dagboek',
      ctaHref: '/dagboek',
    };
  }
  return {
    key: 'verdieping-suggestie',
    headline: 'Nog niet verkend: Controle Cirkel',
    factLine: input.daysSinceControleCirkel === null
      ? 'De Controle Cirkel-oefening is nog nooit gebruikt om iets los te laten.'
      : `De laatste Controle Cirkel-oefening is ${input.daysSinceControleCirkel} dagen geleden.`,
    ctaLabel: 'Open Controle Cirkel',
    ctaHref: '/controle-cirkel',
  };
}

/** Korte, aparte prompt-variant t.o.v. buildCoachPrompt: geen hele reflectie, alleen de
 *  gekozen kandidaat in 1-2 zinnen formuleren in de bestaande persona. De feiten staan al vast
 *  (candidate.factLine) — de LLM mag ze herformuleren, niet aanvullen. */
function buildNextStepPrompt(ctx: CoachContext, candidate: NextStepCandidate): string {
  const { identity, challenger } = ctx;
  const object = identity.addressName || 'deze ondernemer';
  const persona = challenger
    ? `Jij bent ${challenger.displayName}, de nuchtere, scherpe executive-challenger van ${object}. Kort, direct, geen wollige inleiding, geen wellness-taal.`
    : `Je bent De Sparringpartner, ${identity.addressName ? `${identity.addressName}s` : 'de'} persoonlijke business- en welzijnscoach. Warm maar scherp.`;

  return `${persona}

FEIT (al vastgesteld door het systeem — verzin niets extra's, gebruik alleen dit):
${candidate.factLine}

Schrijf in het Nederlands, in de jij-vorm (jij/je/jouw — jij spreekt ${object} aan, dus gebruik nooit "ik" of "mij"), maximaal 2 zinnen: leg in één zin uit waarom dit nu de beste volgende stap is voor ${object}, en eindig met een korte, directe aansporing om de actie te nemen ("${candidate.ctaLabel}"). Geen inleiding, geen bullet points, geen aanhalingstekens, geen quote of gesimuleerde uitspraak van ${object} zelf — alleen jouw eigen coach-tekst.`;
}

export type NextStepResult =
  | { ok: true; key: NextStepKey; headline: string; message: string; ctaLabel: string; ctaHref: string }
  | { ok: false; status: number; error: string };

/** Bepaalt en formuleert de "beste volgende stap" voor het dashboard. Cachet het resultaat per
 *  (user, dag) in coach_next_steps zodat een pagina-refresh niet telkens een nieuwe LLM-call
 *  kost — alleen als de gekozen kandidaat wijzigt (patternKey anders dan de cache) wordt er
 *  opnieuw geformuleerd, zodat het advies wel vers blijft als de situatie verandert. */
export async function runNextStepAnalysis(userId: string, organizationId: number | null): Promise<NextStepResult> {
  const today = new Date().toISOString().split('T')[0];

  const [ctx, recentMorningEnergy, goalRows, ritualStatus, identityRows, dagboekRows, cirkelRows] = await Promise.all([
    loadCoachContext(userId, organizationId),
    loadRecentMorningEnergy(userId, 5),
    sql`SELECT data FROM goals WHERE user_id = ${userId} AND organization_id = ${organizationId}`,
    getRitualStatus(userId, organizationId),
    sql`SELECT statements FROM identity_profiles WHERE user_id = ${userId}`,
    sql`SELECT MAX(timestamp) AS last FROM daily_logs WHERE user_id = ${userId} AND organization_id = ${organizationId} AND type IN ('dagboek_ochtend', 'dagboek_avond')`,
    sql`SELECT MAX(timestamp) AS last FROM daily_logs WHERE user_id = ${userId} AND organization_id = ${organizationId} AND type = 'controle_cirkel'`,
  ]);

  const currentQuarter = getCurrentQuarter();
  const leverageTask = (goalRows as { data: any }[])
    .map((r) => r.data)
    .filter((g) => !g.completed && g.isRock && g.quarter === currentQuarter)
    .flatMap((g) => normalizeNextActions(g.nextActions)
      .filter((a) => a.leverage && !a.completed)
      .map((a) => ({ goalTitle: g.title as string, actionText: a.text })))[0] ?? null;

  let meetingMinutes = 0;
  if (isCalendarConfiguredFor(organizationId)) {
    try {
      const events = await listTodayEvents(organizationId);
      meetingMinutes = events.reduce((sum, ev) => {
        if (ev.isAllDay || !ev.start || !ev.end) return sum;
        return sum + Math.max(0, (new Date(ev.end).getTime() - new Date(ev.start).getTime()) / 60000);
      }, 0);
    } catch {
      meetingMinutes = 0; // agenda-uitval mag deze kaart nooit blokkeren
    }
  }

  const scorecard = await computeWeeklyScorecard(userId);
  const proactiveSignal = detectProactiveSignal(recentMorningEnergy, ctx.recentEnergyLog);
  const frogLabel = (ctx.today as any).kikkerCategory
    ? ((ctx.today as any).kikkerDetail ? `${(ctx.today as any).kikkerCategory} — ${(ctx.today as any).kikkerDetail}` : String((ctx.today as any).kikkerCategory))
    : null;
  const frogDone = (ctx.today as any).eveningVerdict === 'waarde_verkocht';

  const weeklyStartOpen = !ritualStatus.weeklyStart.isComplete && ritualStatus.weeklyStart.canStillComplete;
  const weeklyReviewOpen = getDayType(ritualStatus.settings) === 'weekend' && !ritualStatus.weeklyReview.isComplete;

  const identityStatements = (identityRows as { statements: unknown }[])[0]?.statements;
  const identityList = Array.isArray(identityStatements)
    ? identityStatements
    : typeof identityStatements === 'string'
      ? (() => { try { const p = JSON.parse(identityStatements); return Array.isArray(p) ? p : []; } catch { return []; } })()
      : [];
  const daysSince = (rows: { last: string | null }[]): number | null => {
    const last = rows[0]?.last;
    return last ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000) : null;
  };
  const toolSuggestion = determineToolSuggestion({
    identityEmpty: identityList.length === 0,
    daysSinceDagboek: daysSince(dagboekRows as { last: string | null }[]),
    daysSinceControleCirkel: daysSince(cirkelRows as { last: string | null }[]),
  });

  const candidate = determineNextStepCandidate({
    hasMorningRitual: ctx.today.energyLevel != null,
    proactiveSignal,
    weeklyStartOpen,
    frogLabel,
    frogDone,
    leverageTask,
    meetingMinutes,
    scorecard,
    weeklyReviewOpen,
    toolSuggestion,
    streak: ctx.streak,
  });

  const cachedRows = await sql`
    SELECT pattern_key, headline, message, cta_label, cta_href FROM coach_next_steps
    WHERE user_id = ${userId} AND date = ${today} LIMIT 1
  `;
  const cached = (cachedRows as any[])[0];
  if (cached && cached.pattern_key === candidate.key) {
    return { ok: true, key: candidate.key, headline: cached.headline, message: cached.message, ctaLabel: cached.cta_label, ctaHref: cached.cta_href };
  }

  let message: string;
  if (candidate.key === 'geen-ochtendritueel') {
    message = `${candidate.factLine} Dat is de beste volgende stap nu — de rest van de dag bouwt hierop voort.`;
  } else {
    try {
      const generated = (await openRouterChat(buildNextStepPrompt(ctx, candidate), 150)).trim();
      // Val terug op de kale factLine als het model toch de jij-vorm verlaat (bijv. een
      // "ik"-geformuleerde rationalisatie namens de ondernemer i.p.v. coach-tekst aan hem) —
      // dat is verwarrender dan de simpele feitzin die het systeem al had vastgesteld.
      message = /\b(ik|mij|mijn|me)\b/i.test(generated) ? candidate.factLine : generated;
    } catch (err) {
      console.error('Next-step LLM error:', err);
      message = candidate.factLine;
    }
  }

  await sql`
    INSERT INTO coach_next_steps (user_id, organization_id, date, pattern_key, headline, message, cta_label, cta_href)
    VALUES (${userId}, ${organizationId}, ${today}, ${candidate.key}, ${candidate.headline}, ${message}, ${candidate.ctaLabel}, ${candidate.ctaHref})
    ON CONFLICT (user_id, date) DO UPDATE SET
      pattern_key = EXCLUDED.pattern_key, headline = EXCLUDED.headline, message = EXCLUDED.message,
      cta_label = EXCLUDED.cta_label, cta_href = EXCLUDED.cta_href, created_at = NOW()
  `;

  return { ok: true, key: candidate.key, headline: candidate.headline, message, ctaLabel: candidate.ctaLabel, ctaHref: candidate.ctaHref };
}
