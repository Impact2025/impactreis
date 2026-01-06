/**
 * Ritual Recovery Service
 *
 * Detecteert gemiste rituelen en biedt recovery flows.
 * Implementeert flexibele weekstart (t/m woensdag).
 */

import {
  isMorningRitualComplete,
  isEveningRitualComplete,
  isWeeklyStartComplete,
  isWeeklyReviewComplete,
  getCurrentWeekNumber,
  getToday,
  getDayType,
} from './weekflow.service';

export interface MissedRitual {
  type: 'weeklyStart' | 'morning' | 'evening' | 'weeklyReview';
  date: string;
  daysAgo: number;
  canRecover: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface RecoveryStatus {
  hasMissedRituals: boolean;
  missedRituals: MissedRitual[];
  suggestedAction: RecoveryAction | null;
  weeklyStartStatus: WeeklyStartStatus;
  daysAwayFromApp: number;
}

export interface RecoveryAction {
  type: 'weeklyStart' | 'morning' | 'freshStart' | 'continue';
  title: string;
  description: string;
  path: string;
  isPrimary: boolean;
}

export interface WeeklyStartStatus {
  isComplete: boolean;
  canStillComplete: boolean; // True t/m woensdag
  dayOfWeek: number; // 0-6 (zondag-zaterdag)
  message: string;
}

/**
 * Get the current day of week (0 = Sunday, 1 = Monday, etc.)
 */
function getCurrentDayOfWeek(): number {
  return new Date().getDay();
}

/**
 * Check if weekly start can still be completed this week
 * Returns true on Monday, Tuesday, Wednesday
 */
export function canStillDoWeeklyStart(): boolean {
  const day = getCurrentDayOfWeek();
  // Monday (1), Tuesday (2), Wednesday (3)
  return day >= 1 && day <= 3;
}

/**
 * Get weekly start status with user-friendly message
 */
export function getWeeklyStartStatus(): WeeklyStartStatus {
  const isComplete = isWeeklyStartComplete();
  const canStillComplete = canStillDoWeeklyStart();
  const day = getCurrentDayOfWeek();

  let message = '';

  if (isComplete) {
    message = 'Week gestart';
  } else if (day === 1) {
    message = 'Start je week vandaag!';
  } else if (day === 2) {
    message = 'Je kunt je week nog starten';
  } else if (day === 3) {
    message = 'Laatste kans om je week te starten!';
  } else if (day >= 4 && day <= 5) {
    message = 'Weekstart gemist - focus op dagelijkse rituelen';
  } else {
    message = 'Weekend - geniet ervan!';
  }

  return {
    isComplete,
    canStillComplete,
    dayOfWeek: day,
    message,
  };
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
 * Calculate days since last app usage based on ritual completion
 */
export function getDaysAwayFromApp(): number {
  // Check last 30 days for any activity
  for (let i = 0; i < 30; i++) {
    const date = getDateDaysAgo(i);
    if (isMorningRitualComplete(date) || isEveningRitualComplete(date)) {
      return i;
    }
  }
  return 30; // More than 30 days
}

/**
 * Detect all missed rituals from recent days
 */
export function detectMissedRituals(): MissedRitual[] {
  const missed: MissedRitual[] = [];
  const today = getToday();
  const dayType = getDayType();

  // Check weekly start (only relevant on weekdays)
  if (dayType !== 'weekend') {
    const weeklyStartStatus = getWeeklyStartStatus();
    if (!weeklyStartStatus.isComplete) {
      missed.push({
        type: 'weeklyStart',
        date: today,
        daysAgo: 0,
        canRecover: weeklyStartStatus.canStillComplete,
        priority: weeklyStartStatus.canStillComplete ? 'high' : 'low',
      });
    }
  }

  // Check yesterday's rituals (only if it was a weekday)
  const yesterday = getDateDaysAgo(1);
  const yesterdayDate = new Date(yesterday);
  const yesterdayDay = yesterdayDate.getDay();

  // If yesterday was a weekday (1-5)
  if (yesterdayDay >= 1 && yesterdayDay <= 5) {
    if (!isMorningRitualComplete(yesterday)) {
      missed.push({
        type: 'morning',
        date: yesterday,
        daysAgo: 1,
        canRecover: false,
        priority: 'low',
      });
    }
    if (!isEveningRitualComplete(yesterday)) {
      missed.push({
        type: 'evening',
        date: yesterday,
        daysAgo: 1,
        canRecover: false,
        priority: 'low',
      });
    }
  }

  // Check today's morning (if weekday and past morning time)
  if (dayType !== 'weekend') {
    const hour = new Date().getHours();
    if (hour >= 12 && !isMorningRitualComplete(today)) {
      missed.push({
        type: 'morning',
        date: today,
        daysAgo: 0,
        canRecover: true,
        priority: 'high',
      });
    }
  }

  // Check last week's review
  const lastWeek = getCurrentWeekNumber() - 1;
  if (!isWeeklyReviewComplete(lastWeek)) {
    missed.push({
      type: 'weeklyReview',
      date: 'last week',
      daysAgo: 7,
      canRecover: false,
      priority: 'low',
    });
  }

  return missed;
}

/**
 * Get suggested recovery action based on current state
 */
export function getSuggestedAction(): RecoveryAction | null {
  const dayType = getDayType();
  const today = getToday();
  const weeklyStartStatus = getWeeklyStartStatus();
  const daysAway = getDaysAwayFromApp();

  // If user was away for a while, suggest fresh start
  if (daysAway >= 7) {
    return {
      type: 'freshStart',
      title: 'Welkom terug!',
      description: `Je was ${daysAway} dagen weg. Laten we fris beginnen.`,
      path: dayType === 'weekend' ? '/weekly-review' : '/morning',
      isPrimary: true,
    };
  }

  // On weekdays, check weekly start first
  if (dayType !== 'weekend') {
    // Weekly start not done and can still do it
    if (!weeklyStartStatus.isComplete && weeklyStartStatus.canStillComplete) {
      const urgency = weeklyStartStatus.dayOfWeek === 3 ? 'Laatste kans!' : '';
      return {
        type: 'weeklyStart',
        title: 'Week nog niet gestart',
        description: `${urgency} Plan je week met focus en intentie.`.trim(),
        path: '/weekly-start',
        isPrimary: true,
      };
    }

    // Check morning ritual
    if (!isMorningRitualComplete(today)) {
      return {
        type: 'morning',
        title: 'Start je dag',
        description: 'Begin met je ochtend ritueel.',
        path: '/morning',
        isPrimary: true,
      };
    }
  }

  // Weekend - suggest weekly review
  if (dayType === 'weekend') {
    if (!isWeeklyReviewComplete()) {
      return {
        type: 'continue',
        title: 'Week Review',
        description: 'Sluit je week af met reflectie.',
        path: '/weekly-review',
        isPrimary: true,
      };
    }
  }

  return null;
}

/**
 * Get complete recovery status
 */
export function getRecoveryStatus(): RecoveryStatus {
  const missedRituals = detectMissedRituals();
  const suggestedAction = getSuggestedAction();
  const weeklyStartStatus = getWeeklyStartStatus();
  const daysAway = getDaysAwayFromApp();

  return {
    hasMissedRituals: missedRituals.length > 0,
    missedRituals,
    suggestedAction,
    weeklyStartStatus,
    daysAwayFromApp: daysAway,
  };
}

/**
 * Get contextual welcome message based on recovery status
 */
export function getWelcomeMessage(): {
  greeting: string;
  subtitle: string;
  type: 'normal' | 'recovery' | 'celebration';
} {
  const status = getRecoveryStatus();
  const dayType = getDayType();
  const hour = new Date().getHours();

  // Time-based greeting
  let timeGreeting = 'Hallo';
  if (hour < 12) timeGreeting = 'Goedemorgen';
  else if (hour < 17) timeGreeting = 'Goedemiddag';
  else timeGreeting = 'Goedeavond';

  // User was away
  if (status.daysAwayFromApp >= 7) {
    return {
      greeting: 'Welkom terug!',
      subtitle: 'Fijn dat je er weer bent. Laten we verder gaan.',
      type: 'recovery',
    };
  }

  // Missed weekly start (can recover)
  if (
    !status.weeklyStartStatus.isComplete &&
    status.weeklyStartStatus.canStillComplete &&
    dayType !== 'weekend'
  ) {
    const day = status.weeklyStartStatus.dayOfWeek;
    if (day === 1) {
      return {
        greeting: `${timeGreeting}!`,
        subtitle: 'Nieuwe week! Start met intentie.',
        type: 'normal',
      };
    } else if (day === 2) {
      return {
        greeting: `${timeGreeting}!`,
        subtitle: 'Je kunt je weekstart nog doen.',
        type: 'recovery',
      };
    } else if (day === 3) {
      return {
        greeting: `${timeGreeting}!`,
        subtitle: 'Laatste kans voor je weekstart!',
        type: 'recovery',
      };
    }
  }

  // Missed weekly start (too late)
  if (
    !status.weeklyStartStatus.isComplete &&
    !status.weeklyStartStatus.canStillComplete &&
    dayType !== 'weekend'
  ) {
    return {
      greeting: `${timeGreeting}!`,
      subtitle: 'Focus op je dagelijkse rituelen.',
      type: 'normal',
    };
  }

  // Normal flow
  if (dayType === 'weekend') {
    return {
      greeting: `${timeGreeting}!`,
      subtitle: 'Geniet van je weekend.',
      type: 'normal',
    };
  }

  return {
    greeting: `${timeGreeting}!`,
    subtitle: 'Maak er een productieve dag van.',
    type: 'normal',
  };
}

/**
 * Check if user should see recovery modal
 */
export function shouldShowRecoveryModal(): boolean {
  const status = getRecoveryStatus();

  // Show if away for a while
  if (status.daysAwayFromApp >= 3) return true;

  // Show if weekly start missed but can still do it (on tue/wed)
  const day = status.weeklyStartStatus.dayOfWeek;
  if (
    !status.weeklyStartStatus.isComplete &&
    status.weeklyStartStatus.canStillComplete &&
    day >= 2
  ) {
    return true;
  }

  return false;
}
