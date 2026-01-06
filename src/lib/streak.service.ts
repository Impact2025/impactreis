/**
 * Streak Service
 *
 * Beheert streak tracking voor dagelijkse rituelen.
 * Een streak telt alleen als zowel ochtend als avond ritueel zijn voltooid.
 */

import {
  isMorningRitualComplete,
  isEveningRitualComplete,
  getToday,
} from './weekflow.service';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  totalDaysCompleted: number;
  isAtRisk: boolean; // True als vandaag nog niet compleet is
}

const STORAGE_KEY = 'streak_data';

interface StoredStreakData {
  longestStreak: number;
  completedDates: string[]; // Array van YYYY-MM-DD strings
}

/**
 * Get stored streak data from localStorage
 */
function getStoredData(): StoredStreakData {
  if (typeof window === 'undefined') {
    return { longestStreak: 0, completedDates: [] };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { longestStreak: 0, completedDates: [] };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return { longestStreak: 0, completedDates: [] };
  }
}

/**
 * Save streak data to localStorage
 */
function saveStoredData(data: StoredStreakData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Check if a specific date is completed (both morning and evening rituals)
 */
export function isDayCompleted(date: string): boolean {
  return isMorningRitualComplete(date) && isEveningRitualComplete(date);
}

/**
 * Get date string for X days ago
 */
function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Calculate current streak by checking consecutive completed days
 */
function calculateCurrentStreak(): number {
  let streak = 0;
  let checkDate = 1; // Start from yesterday

  // Check if today is completed - if so, start from today
  const today = getToday();
  if (isDayCompleted(today)) {
    streak = 1;
    checkDate = 1;
  } else {
    // If today not completed, check if yesterday was (streak might still be active)
    checkDate = 1;
  }

  // Count consecutive days backwards
  while (true) {
    const dateToCheck = getDateDaysAgo(checkDate);
    if (isDayCompleted(dateToCheck)) {
      if (checkDate === 1 && !isDayCompleted(today)) {
        // Yesterday completed but today not - streak is at risk
        streak++;
      } else if (isDayCompleted(today)) {
        // Today is completed, count previous days
        streak++;
      }
      checkDate++;
    } else {
      break;
    }

    // Safety limit
    if (checkDate > 365) break;
  }

  // Recalculate properly
  streak = 0;
  const todayCompleted = isDayCompleted(today);
  const yesterdayCompleted = isDayCompleted(getDateDaysAgo(1));

  if (todayCompleted) {
    streak = 1;
    let daysBack = 1;
    while (isDayCompleted(getDateDaysAgo(daysBack))) {
      streak++;
      daysBack++;
      if (daysBack > 365) break;
    }
  } else if (yesterdayCompleted) {
    // Streak still active but at risk
    streak = 1;
    let daysBack = 2;
    while (isDayCompleted(getDateDaysAgo(daysBack))) {
      streak++;
      daysBack++;
      if (daysBack > 365) break;
    }
  }

  return streak;
}

/**
 * Calculate total days completed (all time)
 */
function calculateTotalCompleted(): number {
  let total = 0;
  const today = getToday();

  // Check last 365 days
  for (let i = 0; i <= 365; i++) {
    const date = getDateDaysAgo(i);
    if (isDayCompleted(date)) {
      total++;
    }
  }

  return total;
}

/**
 * Get the last completed date
 */
function getLastCompletedDate(): string | null {
  for (let i = 0; i <= 365; i++) {
    const date = getDateDaysAgo(i);
    if (isDayCompleted(date)) {
      return date;
    }
  }
  return null;
}

/**
 * Get complete streak data
 */
export function getStreakData(): StreakData {
  const currentStreak = calculateCurrentStreak();
  const stored = getStoredData();

  // Update longest streak if current is higher
  const longestStreak = Math.max(stored.longestStreak, currentStreak);
  if (longestStreak > stored.longestStreak) {
    saveStoredData({ ...stored, longestStreak });
  }

  const today = getToday();
  const todayCompleted = isDayCompleted(today);
  const yesterdayCompleted = isDayCompleted(getDateDaysAgo(1));

  // Streak is at risk if yesterday was completed but today isn't yet
  const isAtRisk = !todayCompleted && yesterdayCompleted && currentStreak > 0;

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate: getLastCompletedDate(),
    totalDaysCompleted: calculateTotalCompleted(),
    isAtRisk,
  };
}

/**
 * Check if streak was just broken (yesterday not completed)
 */
export function wasStreakBroken(): boolean {
  const yesterday = getDateDaysAgo(1);
  const twoDaysAgo = getDateDaysAgo(2);

  // Streak broken if two days ago was completed but yesterday wasn't
  return isDayCompleted(twoDaysAgo) && !isDayCompleted(yesterday);
}

/**
 * Get motivational message based on streak status
 */
export function getStreakMessage(): { message: string; type: 'success' | 'warning' | 'neutral' } {
  const data = getStreakData();
  const today = getToday();
  const todayCompleted = isDayCompleted(today);

  if (data.currentStreak === 0) {
    return {
      message: 'Start vandaag je nieuwe streak!',
      type: 'neutral',
    };
  }

  if (data.isAtRisk) {
    return {
      message: `${data.currentStreak} dagen streak - maak vandaag af om hem te behouden!`,
      type: 'warning',
    };
  }

  if (todayCompleted) {
    if (data.currentStreak === data.longestStreak && data.currentStreak > 1) {
      return {
        message: `${data.currentStreak} dagen - nieuw record!`,
        type: 'success',
      };
    }
    return {
      message: `${data.currentStreak} dagen streak - keep going!`,
      type: 'success',
    };
  }

  return {
    message: `${data.currentStreak} dagen streak`,
    type: 'neutral',
  };
}

/**
 * Get streak milestone info
 */
export function getStreakMilestone(streak: number): { milestone: number; progress: number } | null {
  const milestones = [7, 14, 30, 60, 90, 180, 365];

  for (const milestone of milestones) {
    if (streak < milestone) {
      return {
        milestone,
        progress: Math.round((streak / milestone) * 100),
      };
    }
  }

  return null;
}

/**
 * Check today's completion status for streak purposes
 */
export function getTodayStatus(): {
  morningDone: boolean;
  eveningDone: boolean;
  fullyCompleted: boolean;
} {
  const today = getToday();
  const morningDone = isMorningRitualComplete(today);
  const eveningDone = isEveningRitualComplete(today);

  return {
    morningDone,
    eveningDone,
    fullyCompleted: morningDone && eveningDone,
  };
}
