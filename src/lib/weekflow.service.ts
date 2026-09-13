/**
 * Week Flow Service — pure datum/tijd-helpers, geen localStorage.
 *
 * De completion-checks (isMorningRitualComplete e.d.) en alles wat daarvan afhing
 * (ritual-recovery.service.ts, streak.service.ts) zijn vervangen door het server-side
 * ritual-status.service.ts + de useRitualStatus() hook, die de database (daily_logs /
 * weekly_reviews) als bron van waarheid gebruiken in plaats van localStorage — nodig voor
 * cross-device continuïteit. Deze pure helpers blijven client-side bruikbaar.
 *
 * Alle "wat is nu/vandaag"-berekeningen gebruiken expliciet een tijdzone in plaats van de
 * tijdzone van het uitvoerende proces. Zonder dat kan de server (vaak UTC op Vercel) rond
 * middernacht of de avond-openingstijd een ander "vandaag"/"is het al open" concluderen dan de
 * browser van de gebruiker — met als gevolg dat server- en client-berekende ritueel-status uit
 * de pas lopen op precies de momenten die er het meest toe doen.
 *
 * `RitualSettings` maakt dagtype/openingstijd/weekstart-deadline per gebruiker instelbaar
 * (zie ritual_settings-tabel + ritual-status.service.ts) i.p.v. de vaste ma-vr/17:00/t-m-wo
 * aannames die alleen klopten voor de oorspronkelijke single-user situatie. Elke functie
 * hieronder valt terug op `DEFAULT_RITUAL_SETTINGS` (= dat oorspronkelijke gedrag) wanneer geen
 * instellingen zijn geladen, dus bestaand gedrag verandert niet zonder een expliciete
 * ritual_settings-rij.
 */

export interface RitualSettings {
  timezone: string;
  /** ISO-weekdagen die als werkdag tellen: 1 = maandag .. 7 = zondag. */
  workDays: number[];
  /** Uur (0-23) waarop het avondritueel opengaat. */
  eveningRitualOpensHour: number;
  /** Laatste ISO-weekdag waarop de weekstart nog ingehaald mag worden. */
  weekStartDeadlineWeekday: number;
}

export const DEFAULT_RITUAL_SETTINGS: RitualSettings = {
  timezone: 'Europe/Amsterdam',
  workDays: [1, 2, 3, 4, 5],
  eveningRitualOpensHour: 17,
  weekStartDeadlineWeekday: 3,
};

interface TzParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  weekday: number; // 0 = zondag .. 6 = zaterdag, zoals Date#getDay()
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getTzParts(timezone: string, date: Date = new Date()): TzParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    // hour12:false geeft in sommige locales "24" voor middernacht i.p.v. "00".
    hour: map.hour === '24' ? 0 : Number(map.hour),
    weekday: WEEKDAY_INDEX[map.weekday],
  };
}

/** Middaganker (UTC-noon) voor de huidige kalenderdag in `timezone` — veilig om kalenderdagen
 * bij op te tellen/af te trekken zonder DST-verspringingen rond middernacht. */
function tzAnchor(timezone: string, date: Date = new Date()): Date {
  const { year, month, day } = getTzParts(timezone, date);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

/** JS-weekdag (0 = zondag .. 6 = zaterdag) naar ISO-weekdag (1 = maandag .. 7 = zondag). */
function toIsoWeekday(jsWeekday: number): number {
  return jsWeekday === 0 ? 7 : jsWeekday;
}

export type DayType = 'weekday' | 'weekend' | 'monday';

/**
 * Get current day type, op basis van de kalenderdag in `settings.timezone` en de
 * geconfigureerde werkdagen.
 * @returns 'monday' (eerste werkdag van de week) | 'weekday' (overige werkdagen) | 'weekend' (geen werkdag)
 */
export function getDayType(settings: RitualSettings = DEFAULT_RITUAL_SETTINGS): DayType {
  const isoWeekday = toIsoWeekday(getTzParts(settings.timezone).weekday);
  const workDays = [...settings.workDays].sort((a, b) => a - b);
  if (!workDays.includes(isoWeekday)) return 'weekend';
  return isoWeekday === workDays[0] ? 'monday' : 'weekday';
}

/**
 * Check of het avondritueel al open is (huidig uur >= `settings.eveningRitualOpensHour`,
 * lokale tijd in `settings.timezone`).
 */
export function isAfter5PM(settings: RitualSettings = DEFAULT_RITUAL_SETTINGS): boolean {
  return getTzParts(settings.timezone).hour >= settings.eveningRitualOpensHour;
}

/**
 * Huidig uur (0-23) in `timezone` — voor begroetingen e.d. i.p.v. `new Date().getHours()`
 * (die de tijdzone van het uitvoerende proces gebruikt).
 */
export function getCurrentHour(timezone: string = DEFAULT_RITUAL_SETTINGS.timezone): number {
  return getTzParts(timezone).hour;
}

/**
 * Get current date in YYYY-MM-DD format, kalenderdag in `timezone`.
 */
export function getToday(timezone: string = DEFAULT_RITUAL_SETTINGS.timezone): string {
  const { year, month, day } = getTzParts(timezone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Weekdag (0 = zondag .. 6 = zaterdag) van een YYYY-MM-DD datumstring. Kalenderdatums zijn
 * tijdzone-onafhankelijk, dus dit parset expliciet als UTC i.p.v. via `new Date(str).getDay()`
 * — dat laatste leest de lokale tijdzone van het proces en kan de weekdag met één dag laten
 * verspringen wanneer server en gebruiker in verschillende tijdzones zitten.
 */
export function getWeekdayOf(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/**
 * Formatteert een uur (0-23) als "HH:00", voor UI-teksten over openingstijden.
 */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/**
 * Calculate ISO week number, op basis van de kalenderdag in `timezone`.
 */
export function getCurrentWeekNumber(timezone: string = DEFAULT_RITUAL_SETTINGS.timezone): number {
  const anchor = tzAnchor(timezone);
  const start = new Date(Date.UTC(anchor.getUTCFullYear(), 0, 1, 12));
  const days = Math.floor((anchor.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getUTCDay() + 1) / 7);
}

/**
 * Get Monday of current week (kalenderdag in `timezone`, UTC-noon anker).
 */
export function getWeekStart(timezone: string = DEFAULT_RITUAL_SETTINGS.timezone): Date {
  const anchor = tzAnchor(timezone);
  const currentDay = anchor.getUTCDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay;
  anchor.setUTCDate(anchor.getUTCDate() + diff);
  return anchor;
}

/**
 * Get Sunday of current week (kalenderdag in `timezone`, UTC-noon anker).
 */
export function getWeekEnd(timezone: string = DEFAULT_RITUAL_SETTINGS.timezone): Date {
  const monday = getWeekStart(timezone);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return sunday;
}

/**
 * Get date string (YYYY-MM-DD) for X days before today (kalenderdag in `timezone`)
 */
export function getDateDaysAgo(daysAgo: number, timezone: string = DEFAULT_RITUAL_SETTINGS.timezone): string {
  const anchor = tzAnchor(timezone);
  anchor.setUTCDate(anchor.getUTCDate() - daysAgo);
  return anchor.toISOString().split('T')[0];
}

/**
 * Get the current quarter as "YYYY-Qn" (bv. "2026-Q3") — gebruikt om Rocks (EOS-kwartaal-
 * prioriteiten) aan een periode te koppelen.
 */
export function getCurrentQuarter(timezone: string = DEFAULT_RITUAL_SETTINGS.timezone): string {
  const { year, month } = getTzParts(timezone);
  const quarter = Math.floor((month - 1) / 3) + 1;
  return `${year}-Q${quarter}`;
}
