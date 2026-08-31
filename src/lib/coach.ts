// De Sparringpartner — Vincents persoonlijke business- en welzijnscoach.
//
// Combineert businesscoaching (rol, keuzes, leiderschap) en welzijnscoaching (energie, herstel,
// gewoonten) in één persona, zoals in de praktijk bij een ondernemer altijd door elkaar loopt.
// Kiest deterministisch een coachtechniek op basis van het signaal (zie chooseTechnique), en
// onthoudt wat blijkt te kloppen via coach_lessons — een observatie is pas een les na bewijs,
// niet na één keer zenden. Zelfde filosofie als iris_lessons in Impact OS.
import { sql } from './db';

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
  today: { energyLevel?: number; sleepQuality?: number; wakeTime?: string; intentie?: string };
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
export async function loadCoachContext(userId: string): Promise<CoachContext> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const [morningRows, allMorningDates, energyRows, lessonRows, contextRows, holding] = await Promise.all([
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
    fetchHoldingContext(),
  ]);

  const todayMorning = (morningRows as DailyLogRow[]).find((r) => r.date_string === today && r.type === 'morning');
  const yesterdayMorning = (morningRows as DailyLogRow[]).find((r) => r.date_string === yesterday && r.type === 'morning');

  const streak = getCurrentStreak((allMorningDates as { date_string: string }[]).map((r) => r.date_string));

  const uc = (contextRows as any[])[0] ?? {
    current_energy_level: 5,
    current_stress_level: 5,
    recent_mood: 'neutral',
    current_focus_area: null,
    coaching_style: 'balanced',
  };

  return {
    today: todayMorning ? parseData(todayMorning.data) : {},
    yesterday: yesterdayMorning ? parseData(yesterdayMorning.data) : null,
    streak,
    last7Days: morningRows as DailyLogRow[],
    recentEnergyLog: energyRows as EnergyLogRow[],
    activeLessons: lessonRows as CoachLesson[],
    userContext: uc,
    holding: holding as HoldingContext | null,
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
    return { technique: 'systemisch', reason: 'Hoge stress — kijk naar wat er om Vincent heen speelt, niet alleen naar zijn agenda.' };
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

const TECHNIQUE_INSTRUCTIONS: Record<Technique, string> = {
  grow: 'Gebruik het GROW-model: help Vincent zijn doel voor vandaag scherp krijgen (Goal), benoem kort de huidige realiteit (Reality), noem één onconventionele optie (Options), en eindig met een concrete vraag over de eerste stap (Will).',
  mi: 'Gebruik motiverende gespreksvoering (OARS): geen advies, geen "je moet". Stel een open vraag die zijn eigen reden voor verandering naar boven haalt, en erken expliciet wat al goed gaat (affirmatie).',
  oplossingsgericht: 'Gebruik oplossingsgericht coachen: stel een schaalvraag ("waar sta je nu op een schaal van 0-10, en wat maakt dat je niet lager zit") en een uitzonderingsvraag over een moment dat het al wél lukte.',
  cgt: 'Gebruik een lichte CGT-geïnformeerde reflectie: benoem het patroon tussen wat er gebeurde en de reactie, zonder te diagnosticeren, en test één realistischer werkhypothese.',
  act: 'Gebruik ACT: erken dat onzekerheid of ongemak aanwezig mag zijn, en vraag welke kleine, aan zijn waarden verbonden actie daar toch bij past.',
  systemisch: 'Gebruik een systemische vraag: wat in de holding eromheen (team, projecten, verwachtingen) speelt mee, en welke rol neemt Vincent daar zelf in als spanning ontstaat.',
  strengths: 'Gebruik strengths-based coachen: vraag naar een concreet moment dat het al lukte en welke omstandigheden dat mogelijk maakten, en hoe dat patroon nu te gebruiken is.',
};

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

  return `Je bent De Sparringpartner: Vincents persoonlijke business- én welzijnscoach, niet gescheiden maar gecombineerd — precies zoals dat in de praktijk voor een ondernemer met een holding (WeAreImpact, met projecten als BewaardVoorJou eronder) altijd door elkaar loopt. Je bent niet zijn klantenservice-bot en je coacht niemand anders dan hem.

Belangrijke grens: je diagnosticeert of behandelt nooit psychische of medische klachten. Zie je een signaal van aanhoudende uitputting, burn-out, angst of iets vergelijkbaars dat langer dan een paar dagen aanhoudt, benoem dat expliciet en adviseer professionele hulp — coach dan niet verder met een techniek.

GEKOZEN TECHNIEK VOOR VANDAAG: ${TECHNIQUE_LABELS[technique]}
${TECHNIQUE_INSTRUCTIONS[technique]}

SESSIE VAN VANDAAG (${todayDate}, ${dayName}):
- Energie: ${ctx.today.energyLevel ?? 'onbekend'}/10
- Slaap: ${ctx.today.sleepQuality ?? 'onbekend'}/10
- Wakker om: ${ctx.today.wakeTime ?? 'onbekend'}
- Intentie: "${ctx.today.intentie ?? ''}"
- Huidige streak: ${ctx.streak} dag${ctx.streak !== 1 ? 'en' : ''}

${ctx.yesterday ? `GISTEREN: energie ${ctx.yesterday.energyLevel}/10, slaap ${ctx.yesterday.sleepQuality}/10` : 'GISTEREN: geen sessie.'}

RECENTE ENERGIE-ATTRIBUTIE (wat gaf/kostte energie):
${energyBlock}

GELEERDE PATRONEN OVER VINCENT (gebruik deze, herhaal ze niet letterlijk):
${lessonsBlock}
${holdingBlock(ctx.holding)}
Schrijf een coach-reflectie van 120-180 woorden in het Nederlands, in de jij-vorm, warm maar scherp. Volg de aangewezen techniek. Eindig met precies één concrete vraag aan Vincent — geen waslijst, geen bullet points, gewone paragrafen.`;
}

/** Legt een observatie vast als coach_lesson: dedupe op pattern_key, confidence groeit met bewijs
 *  (Laplace-gladgestreken, zelfde formule als iris_lessons) i.p.v. bij elke run een nieuwe rij.
 *  organizationId alleen nodig voor de INSERT-tak — coach_lessons.organization_id is NOT NULL. */
export async function rememberLesson(userId: string, organizationId: number | null, patternKey: string, technique: Technique, insight: string) {
  const existing = await sql`SELECT id, times_confirmed FROM coach_lessons WHERE user_id = ${userId} AND pattern_key = ${patternKey} LIMIT 1`;
  if (existing.length > 0) {
    const confirmed = (existing[0].times_confirmed as number) + 1;
    const confidence = (confirmed + 1) / (confirmed + 2); // Laplace smoothing
    await sql`UPDATE coach_lessons SET insight = ${insight}, technique = ${technique},
      times_confirmed = ${confirmed}, confidence = ${confidence}, updated_at = NOW()
      WHERE id = ${existing[0].id}`;
  } else {
    await sql`INSERT INTO coach_lessons (user_id, pattern_key, technique, insight, confidence, times_confirmed, source, organization_id)
      VALUES (${userId}, ${patternKey}, ${technique}, ${insight}, 0.5, 1, 'coach_analyse', ${organizationId})`;
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

/** Machine-to-machine auth voor de bridge-routes (ImpactOS -> mijn-ondernemers-os): een
 *  gedeeld geheim in plaats van een browsersessie. Fail closed — geen COACH_BRIDGE_TOKEN
 *  geconfigureerd betekent geen enkele aanroeper wordt doorgelaten, nooit "open by default". */
export function checkBridgeToken(authorizationHeader: string | null): boolean {
  const expected = process.env.COACH_BRIDGE_TOKEN;
  if (!expected) return false;
  const auth = authorizationHeader ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return token.length > 0 && token === expected;
}

/** Eén-gebruiker-app: geen tenant-model nodig, de eerste (en enige) gebruiker is Vincent. */
export async function loadSingleUserId(): Promise<string | null> {
  const users = await sql`SELECT id FROM users ORDER BY id ASC LIMIT 1`;
  return users.length > 0 ? String(users[0].id) : null;
}

/** organization_id bij een userId — alleen nodig voor de bridge-analyse-route, die (anders dan
 *  bridge/lessons en signal) ook schrijft naar coach_lessons/user_context, en die kolom is
 *  NOT NULL. */
export async function loadUserOrganizationId(userId: string): Promise<number | null> {
  const rows = await sql`SELECT organization_id FROM users WHERE id = ${userId}`;
  return rows[0]?.organization_id ?? null;
}

function slugifyPattern(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
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
  const ctx = await loadCoachContext(userId);

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
  await rememberLesson(userId, organizationId, patternKey, technique, reason);
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
