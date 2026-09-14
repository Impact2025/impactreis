/**
 * Ritual Status Service (server-side)
 *
 * Vervangt de client-side, localStorage-gebaseerde logica uit ritual-recovery.service.ts en
 * streak.service.ts. Databron is `daily_logs`/`weekly_reviews` — dezelfde tabellen die de
 * ochtend/avond/week-pagina's al vullen — zodat streak- en herstelstatus cross-device klopt
 * en niet meer afhangt van of useRitualStatus() al eens gemount is geweest in déze browser.
 *
 * Eén geïndexeerde query van 400 dagen `daily_logs` is snel genoeg om streak/missed-rituals
 * in-memory te berekenen — dat maakt een aparte, incrementeel bijgewerkte streak-tabel
 * overbodig (en voorkomt de subtiele bugs die incrementele upserts bij teruggehaalde/gemiste
 * dagen kunnen geven).
 *
 * Alle dag/tijd-afhankelijke beslissingen (werkdag of niet, wanneer het avondritueel opengaat,
 * tot wanneer de weekstart nog mag) lopen via `RitualSettings` (ritual_settings-tabel, zie
 * getRitualSettingsFor) i.p.v. vaste ma-vr/17:00/t-m-wo aannames — nodig zodra dit systeem
 * door meer dan één gebruiker/tijdzone/werkweek gebruikt wordt.
 */
import { sql } from './db';
import {
  getDayType,
  isAfter5PM,
  getToday,
  getCurrentWeekNumber,
  getDateDaysAgo,
  getWeekdayOf,
  getCurrentHour,
  formatHour,
  DEFAULT_RITUAL_SETTINGS,
  type RitualSettings,
} from './weekflow.service';

const STREAK_WINDOW_DAYS = 400;

export interface MissedRitual {
  type: 'weeklyStart' | 'morning' | 'evening' | 'weeklyReview';
  date: string;
  daysAgo: number;
  canRecover: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface RecoveryAction {
  type: 'weeklyStart' | 'morning' | 'evening' | 'freshStart' | 'continue';
  title: string;
  description: string;
  path: string;
  isPrimary: boolean;
  /** false zodra het ritueel wel de voorgestelde volgende stap is, maar nog niet open is
   * (bv. avondritueel vóór de geconfigureerde openingstijd) — consumenten kunnen dit gebruiken
   * om "later vandaag" te tonen in plaats van een actieve call-to-action. */
  isAvailable: boolean;
}

export interface RitualStatusPayload {
  today: { morningDone: boolean; eveningDone: boolean; fullyCompleted: boolean };
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string | null;
    totalDaysCompleted: number;
    isAtRisk: boolean;
    speedOfReturn: 'lightning' | 'fast' | 'steady' | null;
  };
  weeklyStart: { isComplete: boolean; canStillComplete: boolean; dayOfWeek: number; message: string };
  weeklyReview: { isComplete: boolean };
  missedRituals: MissedRitual[];
  suggestedAction: RecoveryAction | null;
  welcomeMessage: { greeting: string; subtitle: string; type: 'normal' | 'recovery' | 'celebration' };
  daysAwayFromApp: number;
  /** De instellingen waarmee bovenstaande berekend is — client-side consumenten (bv. de
   * time-gate op /evening) gebruiken dit i.p.v. hun eigen (mogelijk verouderde) default. */
  settings: RitualSettings;
}

async function getRitualSettingsFor(userId: string): Promise<RitualSettings> {
  const rows = await sql`
    SELECT timezone, work_days, evening_ritual_opens_hour, week_start_deadline_weekday, meditations_enabled
    FROM ritual_settings WHERE user_id = ${userId}
  `;
  const row = rows[0] as
    | {
        timezone: string;
        work_days: unknown;
        evening_ritual_opens_hour: number;
        week_start_deadline_weekday: number;
        meditations_enabled: boolean | null;
      }
    | undefined;
  if (!row) return DEFAULT_RITUAL_SETTINGS;

  let workDays: unknown = row.work_days;
  if (typeof workDays === 'string') {
    try {
      workDays = JSON.parse(workDays);
    } catch {
      workDays = DEFAULT_RITUAL_SETTINGS.workDays;
    }
  }
  const validWorkDays =
    Array.isArray(workDays) && workDays.every((d) => Number.isInteger(d) && d >= 1 && d <= 7) && workDays.length > 0
      ? (workDays as number[])
      : DEFAULT_RITUAL_SETTINGS.workDays;

  return {
    timezone: row.timezone || DEFAULT_RITUAL_SETTINGS.timezone,
    workDays: validWorkDays,
    eveningRitualOpensHour: row.evening_ritual_opens_hour ?? DEFAULT_RITUAL_SETTINGS.eveningRitualOpensHour,
    weekStartDeadlineWeekday: row.week_start_deadline_weekday ?? DEFAULT_RITUAL_SETTINGS.weekStartDeadlineWeekday,
    meditationsEnabled: row.meditations_enabled ?? DEFAULT_RITUAL_SETTINGS.meditationsEnabled,
  };
}

type CompletionMap = Map<string, { morning: boolean; evening: boolean }>;

async function getCompletionMap(
  userId: string,
  organizationId: number | null,
  windowDays: number,
  settings: RitualSettings
): Promise<CompletionMap> {
  const since = getDateDaysAgo(windowDays, settings.timezone);
  const rows = await sql`
    SELECT date_string, type FROM daily_logs
    WHERE user_id = ${userId} AND organization_id = ${organizationId}
      AND type IN ('morning', 'evening') AND date_string >= ${since}
  `;
  const map: CompletionMap = new Map();
  for (const row of rows as { date_string: string; type: string }[]) {
    const entry = map.get(row.date_string) ?? { morning: false, evening: false };
    if (row.type === 'morning') entry.morning = true;
    if (row.type === 'evening') entry.evening = true;
    map.set(row.date_string, entry);
  }
  return map;
}

function isDayCompleted(map: CompletionMap, date: string): boolean {
  const entry = map.get(date);
  return !!(entry?.morning && entry?.evening);
}

async function getWeeklyFlags(
  userId: string,
  organizationId: number | null,
  weekNumber: number
): Promise<{ start: boolean; review: boolean }> {
  const rows = await sql`
    SELECT data FROM weekly_reviews
    WHERE user_id = ${userId} AND organization_id = ${organizationId} AND week_number = ${String(weekNumber)}
  `;
  let start = false;
  let review = false;
  for (const row of rows as { data: unknown }[]) {
    try {
      const d = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data as Record<string, unknown>);
      if (d?.type === 'weekly-start') start = true;
      if (d?.type === 'weekly-review') review = true;
    } catch { /* corrupte rij negeren */ }
  }
  return { start, review };
}

function calculateStreaks(
  map: CompletionMap,
  today: string,
  timezone: string
): { current: number; longest: number; lastCompletedDate: string | null; totalDaysCompleted: number } {
  const todayCompleted = isDayCompleted(map, today);
  const yesterdayCompleted = isDayCompleted(map, getDateDaysAgo(1, timezone));

  let current = 0;
  if (todayCompleted) {
    current = 1;
    let daysBack = 1;
    while (isDayCompleted(map, getDateDaysAgo(daysBack, timezone)) && daysBack < STREAK_WINDOW_DAYS) {
      current++;
      daysBack++;
    }
  } else if (yesterdayCompleted) {
    current = 1;
    let daysBack = 2;
    while (isDayCompleted(map, getDateDaysAgo(daysBack, timezone)) && daysBack < STREAK_WINDOW_DAYS) {
      current++;
      daysBack++;
    }
  }

  // Langste streak ooit binnen het venster + totaal aantal voltooide dagen: loop één keer door.
  let longest = 0;
  let running = 0;
  let lastCompletedDate: string | null = null;
  let totalDaysCompleted = 0;
  for (let i = STREAK_WINDOW_DAYS; i >= 0; i--) {
    const date = getDateDaysAgo(i, timezone);
    if (isDayCompleted(map, date)) {
      running++;
      totalDaysCompleted++;
      longest = Math.max(longest, running);
      lastCompletedDate = date;
    } else {
      running = 0;
    }
  }

  return { current, longest: Math.max(longest, current), lastCompletedDate, totalDaysCompleted };
}

function getWeeklyStartMessage(isComplete: boolean, isoDayOfWeek: number, settings: RitualSettings): string {
  if (isComplete) return 'Week gestart';
  const workDays = [...settings.workDays].sort((a, b) => a - b);
  if (!workDays.includes(isoDayOfWeek)) return 'Weekend - geniet ervan!';
  if (isoDayOfWeek === workDays[0]) return 'Start je week vandaag!';
  if (isoDayOfWeek === settings.weekStartDeadlineWeekday) return 'Laatste kans om je week te starten!';
  if (isoDayOfWeek < settings.weekStartDeadlineWeekday) return 'Je kunt je week nog starten';
  return 'Weekstart gemist - focus op dagelijkse rituelen';
}

export async function getRitualStatus(
  userId: string,
  organizationId: number | null
): Promise<RitualStatusPayload> {
  const settings = await getRitualSettingsFor(userId);
  const workDays = [...settings.workDays].sort((a, b) => a - b);

  const today = getToday(settings.timezone);
  const dayType = getDayType(settings);
  const after5PM = isAfter5PM(settings);
  const weekNumber = getCurrentWeekNumber(settings.timezone);
  const dayOfWeek = getWeekdayOf(today); // JS-conventie: 0 = zondag .. 6 = zaterdag
  const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
  const yesterday = getDateDaysAgo(1, settings.timezone);

  const [completionMap, weekFlags, lastWeekFlags] = await Promise.all([
    getCompletionMap(userId, organizationId, STREAK_WINDOW_DAYS, settings),
    getWeeklyFlags(userId, organizationId, weekNumber),
    getWeeklyFlags(userId, organizationId, weekNumber - 1),
  ]);

  const morningDone = !!completionMap.get(today)?.morning;
  const eveningDone = !!completionMap.get(today)?.evening;
  const todayFullyDone = morningDone && eveningDone;
  const yesterdayFullyDone = isDayCompleted(completionMap, yesterday);

  const { current: currentStreak, longest: longestStreak, lastCompletedDate, totalDaysCompleted } =
    calculateStreaks(completionMap, today, settings.timezone);
  const isAtRisk = !todayFullyDone && yesterdayFullyDone && currentStreak > 0;

  // Snelheid van terugkomst: dagen tussen de laatste voltooide dag vóór de meest recente
  // onderbreking en de eerstvolgende weer-voltooide dag. Vereenvoudigd tot: als er een gat
  // is tussen lastCompletedDate en vandaag, hoe lang was dat gat?
  let speedOfReturn: 'lightning' | 'fast' | 'steady' | null = null;
  if (lastCompletedDate && lastCompletedDate !== today && !todayFullyDone) {
    const gapDays = Math.round(
      (new Date(today).getTime() - new Date(lastCompletedDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (gapDays === 1) speedOfReturn = null; // nog geen break, gewoon vandaag nog niet klaar
    else if (gapDays === 2) speedOfReturn = 'lightning';
    else if (gapDays === 3) speedOfReturn = 'fast';
    else if (gapDays > 3) speedOfReturn = 'steady';
  }

  let daysAwayFromApp = STREAK_WINDOW_DAYS;
  for (let i = 0; i < 30; i++) {
    const date = getDateDaysAgo(i, settings.timezone);
    const entry = completionMap.get(date);
    if (entry?.morning || entry?.evening) {
      daysAwayFromApp = i;
      break;
    }
  }

  const canStillCompleteWeeklyStart = isoDayOfWeek >= workDays[0] && isoDayOfWeek <= settings.weekStartDeadlineWeekday;
  const weeklyStart = {
    isComplete: weekFlags.start,
    canStillComplete: canStillCompleteWeeklyStart,
    dayOfWeek,
    message: getWeeklyStartMessage(weekFlags.start, isoDayOfWeek, settings),
  };
  const weeklyReview = { isComplete: weekFlags.review };

  // --- Gemiste rituelen ---
  const missedRituals: MissedRitual[] = [];
  if (dayType !== 'weekend' && !weeklyStart.isComplete) {
    missedRituals.push({
      type: 'weeklyStart',
      date: today,
      daysAgo: 0,
      canRecover: weeklyStart.canStillComplete,
      priority: weeklyStart.canStillComplete ? 'high' : 'low',
    });
  }
  const yesterdayIsoDayOfWeek = (() => {
    const jsDay = getWeekdayOf(yesterday);
    return jsDay === 0 ? 7 : jsDay;
  })();
  if (workDays.includes(yesterdayIsoDayOfWeek)) {
    const yEntry = completionMap.get(yesterday);
    if (!yEntry?.morning) {
      missedRituals.push({ type: 'morning', date: yesterday, daysAgo: 1, canRecover: false, priority: 'low' });
    }
    if (!yEntry?.evening) {
      missedRituals.push({ type: 'evening', date: yesterday, daysAgo: 1, canRecover: true, priority: 'medium' });
    }
  }
  if (dayType !== 'weekend' && getCurrentHour(settings.timezone) >= 12 && !morningDone) {
    missedRituals.push({ type: 'morning', date: today, daysAgo: 0, canRecover: true, priority: 'high' });
  }
  // Niet op de eerste werkdag melden: de gebruiker heeft de nieuwe week dan nog niet eens een
  // dag achter de rug en heeft geen realistische kans gehad om dit al op te merken/te herstellen.
  if (isoDayOfWeek !== workDays[0] && !lastWeekFlags.review) {
    missedRituals.push({ type: 'weeklyReview', date: 'last week', daysAgo: 7, canRecover: false, priority: 'low' });
  }

  // --- Voorgestelde actie ---
  let suggestedAction: RecoveryAction | null = null;
  if (daysAwayFromApp >= 7) {
    suggestedAction = {
      type: 'freshStart',
      title: 'Welkom terug!',
      description: `Je was ${daysAwayFromApp} dagen weg. Laten we fris beginnen.`,
      path: dayType === 'weekend' ? '/weekly-review' : '/morning',
      isPrimary: true,
      isAvailable: true,
    };
  } else if (dayType !== 'weekend' && !weeklyStart.isComplete && weeklyStart.canStillComplete) {
    suggestedAction = {
      type: 'weeklyStart',
      title: 'Week nog niet gestart',
      description: (isoDayOfWeek === settings.weekStartDeadlineWeekday ? 'Laatste kans! ' : '') + 'Plan je week met focus en intentie.',
      path: '/weekly-start',
      isPrimary: true,
      isAvailable: true,
    };
  } else if (dayType !== 'weekend' && !morningDone) {
    suggestedAction = {
      type: 'morning',
      title: 'Start je dag',
      description: 'Begin met je ochtend ritueel.',
      path: '/morning',
      isPrimary: true,
      isAvailable: true,
    };
  } else if (dayType !== 'weekend' && morningDone && !eveningDone) {
    suggestedAction = after5PM
      ? {
          type: 'evening',
          title: 'Rond je dag af',
          description: 'Sluit je dag af met je avond ritueel.',
          path: '/evening',
          isPrimary: true,
          isAvailable: true,
        }
      : {
          type: 'evening',
          title: 'Avond ritueel',
          description: `Beschikbaar vanaf ${formatHour(settings.eveningRitualOpensHour)}.`,
          path: '/evening',
          isPrimary: false,
          isAvailable: false,
        };
  } else if (dayType === 'weekend' && !weeklyReview.isComplete) {
    suggestedAction = {
      type: 'continue',
      title: 'Week Review',
      description: 'Sluit je week af met reflectie.',
      path: '/weekly-review',
      isPrimary: true,
      isAvailable: true,
    };
  }

  // --- Welkomstbericht ---
  const hour = getCurrentHour(settings.timezone);
  const timeGreeting = hour < 12 ? 'Goedemorgen' : hour < 17 ? 'Goedemiddag' : 'Goedeavond';
  let welcomeMessage: RitualStatusPayload['welcomeMessage'];
  if (daysAwayFromApp >= 7) {
    welcomeMessage = { greeting: 'Welkom terug!', subtitle: 'Fijn dat je er weer bent. Laten we verder gaan.', type: 'recovery' };
  } else if (!weeklyStart.isComplete && weeklyStart.canStillComplete && dayType !== 'weekend') {
    if (isoDayOfWeek === workDays[0]) welcomeMessage = { greeting: `${timeGreeting}!`, subtitle: 'Nieuwe week! Start met intentie.', type: 'normal' };
    else if (isoDayOfWeek < settings.weekStartDeadlineWeekday) welcomeMessage = { greeting: `${timeGreeting}!`, subtitle: 'Je kunt je weekstart nog doen.', type: 'recovery' };
    else welcomeMessage = { greeting: `${timeGreeting}!`, subtitle: 'Laatste kans voor je weekstart!', type: 'recovery' };
  } else if (!weeklyStart.isComplete && !weeklyStart.canStillComplete && dayType !== 'weekend') {
    welcomeMessage = { greeting: `${timeGreeting}!`, subtitle: 'Focus op je dagelijkse rituelen.', type: 'normal' };
  } else if (dayType === 'weekend') {
    welcomeMessage = { greeting: `${timeGreeting}!`, subtitle: 'Geniet van je weekend.', type: 'normal' };
  } else {
    welcomeMessage = { greeting: `${timeGreeting}!`, subtitle: 'Maak er een productieve dag van.', type: 'normal' };
  }

  return {
    today: { morningDone, eveningDone, fullyCompleted: todayFullyDone },
    streak: { currentStreak, longestStreak, lastCompletedDate, totalDaysCompleted, isAtRisk, speedOfReturn },
    weeklyStart,
    weeklyReview,
    missedRituals,
    suggestedAction,
    welcomeMessage,
    daysAwayFromApp,
    settings,
  };
}
