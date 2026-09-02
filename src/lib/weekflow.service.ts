/**
 * Week Flow Service — pure datum/tijd-helpers, geen localStorage.
 *
 * De completion-checks (isMorningRitualComplete e.d.) en alles wat daarvan afhing
 * (ritual-recovery.service.ts, streak.service.ts) zijn vervangen door het server-side
 * ritual-status.service.ts + de useRitualStatus() hook, die de database (daily_logs /
 * weekly_reviews) als bron van waarheid gebruiken in plaats van localStorage — nodig voor
 * cross-device continuïteit. Deze pure helpers blijven client-side bruikbaar.
 */

export type DayType = 'weekday' | 'weekend' | 'monday';

/**
 * Get current day type
 * @returns 'monday' | 'weekday' | 'weekend'
 */
export function getDayType(): DayType {
  const day = new Date().getDay();

  if (day === 1) return 'monday';
  if (day >= 2 && day <= 5) return 'weekday';
  return 'weekend'; // Saturday (6) or Sunday (0)
}

/**
 * Check if current time is after 17:00 (5 PM)
 */
export function isAfter5PM(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 17;
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculate ISO week number
 */
export function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}

/**
 * Get Monday of current week
 */
export function getWeekStart(): Date {
  const now = new Date();
  const currentDay = now.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get Sunday of current week
 */
export function getWeekEnd(): Date {
  const monday = getWeekStart();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * Get date string (YYYY-MM-DD) for X days before today
 */
export function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Get the current quarter as "YYYY-Qn" (bv. "2026-Q3") — gebruikt om Rocks (EOS-kwartaal-
 * prioriteiten) aan een periode te koppelen.
 */
export function getCurrentQuarter(): string {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${quarter}`;
}
