/**
 * Week Flow Service
 *
 * Manages the automatic weekflow navigation logic:
 * - Monday-Friday: Morning ritual → Evening ritual (after 17:00)
 * - Saturday-Sunday: Weekly review
 * - Monday: Weekly start
 */

export type DayType = 'weekday' | 'weekend' | 'monday';

export interface NextRitual {
  path: string;
  title: string;
  isRequired: boolean;
  isAvailable: boolean;
  reason?: string;
}

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
  return new Date().toISOString().split('T')[0];
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
 * Check if morning ritual is completed for given date
 * @param date Optional date in YYYY-MM-DD format (defaults to today)
 */
export function isMorningRitualComplete(date?: string): boolean {
  if (typeof window === 'undefined') return false;

  const targetDate = date || getToday();
  const key = `morningRitual_${targetDate}`;
  const data = localStorage.getItem(key);

  return data !== null;
}

/**
 * Check if evening ritual is completed for given date
 * @param date Optional date in YYYY-MM-DD format (defaults to today)
 */
export function isEveningRitualComplete(date?: string): boolean {
  if (typeof window === 'undefined') return false;

  const targetDate = date || getToday();
  const key = `eveningRitual_${targetDate}`;
  const data = localStorage.getItem(key);

  return data !== null;
}

/**
 * Check if weekly review is completed for given week
 * @param weekNumber Optional week number (defaults to current week)
 */
export function isWeeklyReviewComplete(weekNumber?: number): boolean {
  if (typeof window === 'undefined') return false;

  const targetWeek = weekNumber || getCurrentWeekNumber();
  const year = new Date().getFullYear();

  // Check localStorage for weekly review
  // Format: weeklyReview_YYYY_WW
  const key = `weeklyReview_${year}_${targetWeek}`;
  const data = localStorage.getItem(key);

  return data !== null;
}

/**
 * Check if weekly start is completed for given week
 * @param weekNumber Optional week number (defaults to current week)
 */
export function isWeeklyStartComplete(weekNumber?: number): boolean {
  if (typeof window === 'undefined') return false;

  const targetWeek = weekNumber || getCurrentWeekNumber();
  const year = new Date().getFullYear();

  // Check localStorage for weekly start
  // Format: weeklyStart_YYYY_WW
  const key = `weeklyStart_${year}_${targetWeek}`;
  const data = localStorage.getItem(key);

  return data !== null;
}

/**
 * Get the next required ritual based on current day/time and completion status
 */
export function getNextRequiredRitual(): NextRitual | null {
  const dayType = getDayType();
  const after5PM = isAfter5PM();

  // Monday: Check weekly start first
  if (dayType === 'monday') {
    if (!isWeeklyStartComplete()) {
      return {
        path: '/weekly-start',
        title: 'Week Start',
        isRequired: true,
        isAvailable: true,
        reason: 'Start je nieuwe week met intentie',
      };
    }
  }

  // Weekdays (including Monday after weekly start): Morning → Evening flow
  if (dayType === 'weekday' || dayType === 'monday') {
    // Morning ritual required first
    if (!isMorningRitualComplete()) {
      return {
        path: '/morning',
        title: 'Ochtend Ritueel',
        isRequired: true,
        isAvailable: true,
        reason: 'Begin je dag met focus en intentie',
      };
    }

    // Evening ritual after 5 PM (if morning is done)
    if (after5PM && !isEveningRitualComplete()) {
      return {
        path: '/evening',
        title: 'Avond Ritueel',
        isRequired: true,
        isAvailable: true,
        reason: 'Sluit je dag af met reflectie',
      };
    }

    // Evening not yet available (before 5 PM)
    if (!after5PM && !isEveningRitualComplete()) {
      return {
        path: '/evening',
        title: 'Avond Ritueel',
        isRequired: true,
        isAvailable: false,
        reason: 'Beschikbaar na 17:00',
      };
    }
  }

  // Weekend: Weekly review
  if (dayType === 'weekend') {
    if (!isWeeklyReviewComplete()) {
      return {
        path: '/weekly-review',
        title: 'Week Review',
        isRequired: true,
        isAvailable: true,
        reason: 'Sluit je week af met reflectie',
      };
    }
  }

  // All rituals completed
  return null;
}

/**
 * Get all ritual statuses for dashboard display
 */
export interface RitualStatus {
  morning: {
    isComplete: boolean;
    isAvailable: boolean;
    isRequired: boolean;
  };
  evening: {
    isComplete: boolean;
    isAvailable: boolean;
    isRequired: boolean;
  };
  weeklyReview: {
    isComplete: boolean;
    isAvailable: boolean;
    isRequired: boolean;
  };
  weeklyStart: {
    isComplete: boolean;
    isAvailable: boolean;
    isRequired: boolean;
  };
}

export function getAllRitualStatuses(): RitualStatus {
  const dayType = getDayType();
  const after5PM = isAfter5PM();
  const isWeekday = dayType === 'weekday' || dayType === 'monday';
  const isWeekend = dayType === 'weekend';
  const isMonday = dayType === 'monday';

  return {
    morning: {
      isComplete: isMorningRitualComplete(),
      isAvailable: isWeekday,
      isRequired: isWeekday,
    },
    evening: {
      isComplete: isEveningRitualComplete(),
      isAvailable: isWeekday && after5PM,
      isRequired: isWeekday && after5PM,
    },
    weeklyReview: {
      isComplete: isWeeklyReviewComplete(),
      isAvailable: isWeekend,
      isRequired: isWeekend,
    },
    weeklyStart: {
      isComplete: isWeeklyStartComplete(),
      isAvailable: isMonday,
      isRequired: isMonday,
    },
  };
}
