'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { getDayType, isAfter5PM } from '@/lib/weekflow.service';
import type { MissedRitual, RecoveryAction, RitualStatusPayload } from '@/lib/ritual-status.service';

export interface NextRitual {
  path: string;
  title: string;
  isRequired: boolean;
  isAvailable: boolean;
  reason?: string;
}

export interface RitualStatusData {
  morning: { isComplete: boolean; isAvailable: boolean; isRequired: boolean };
  evening: { isComplete: boolean; isAvailable: boolean; isRequired: boolean };
  weeklyStart: { isComplete: boolean; isAvailable: boolean; isRequired: boolean; canStillComplete: boolean };
  weeklyReview: { isComplete: boolean; isAvailable: boolean; isRequired: boolean };
  streak: RitualStatusPayload['streak'];
  missedRituals: MissedRitual[];
  suggestedAction: RecoveryAction | null;
  welcomeMessage: RitualStatusPayload['welcomeMessage'];
  daysAwayFromApp: number;
  nextRitual: NextRitual | null;
  isLoading: boolean;
}

const emptyStreak: RitualStatusPayload['streak'] = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  totalDaysCompleted: 0,
  isAtRisk: false,
  speedOfReturn: null,
};

const defaultWelcome: RitualStatusPayload['welcomeMessage'] = {
  greeting: 'Hallo!',
  subtitle: 'Maak er een productieve dag van.',
  type: 'normal',
};

function computeNextRitual(status: RitualStatusPayload): NextRitual | null {
  const dayType = getDayType();
  const after5PM = isAfter5PM();
  const isWeekday = dayType === 'weekday' || dayType === 'monday';

  if (dayType === 'monday' && !status.weeklyStart.isComplete) {
    return { path: '/weekly-start', title: 'Week Start', isRequired: true, isAvailable: true, reason: 'Start je nieuwe week met intentie' };
  }
  if (isWeekday) {
    if (!status.today.morningDone) {
      return { path: '/morning', title: 'Ochtend Ritueel', isRequired: true, isAvailable: true, reason: 'Begin je dag met focus en intentie' };
    }
    if (!status.today.eveningDone) {
      return after5PM
        ? { path: '/evening', title: 'Avond Ritueel', isRequired: true, isAvailable: true, reason: 'Sluit je dag af met reflectie' }
        : { path: '/evening', title: 'Avond Ritueel', isRequired: true, isAvailable: false, reason: 'Beschikbaar na 17:00' };
    }
  }
  if (dayType === 'weekend' && !status.weeklyReview.isComplete) {
    return { path: '/weekly-review', title: 'Week Review', isRequired: true, isAvailable: true, reason: 'Sluit je week af met reflectie' };
  }
  return null;
}

export function useRitualStatus(): RitualStatusData {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ritualStatus,
    queryFn: () => api.ritualStatus.get(),
    staleTime: 1000 * 30,
  });

  const dayType = getDayType();
  const after5PM = isAfter5PM();
  const isWeekday = dayType === 'weekday' || dayType === 'monday';
  const isWeekend = dayType === 'weekend';
  const isMonday = dayType === 'monday';

  if (!data) {
    return {
      morning: { isComplete: false, isAvailable: isWeekday, isRequired: isWeekday },
      evening: { isComplete: false, isAvailable: isWeekday && after5PM, isRequired: isWeekday && after5PM },
      weeklyStart: { isComplete: false, isAvailable: isMonday, isRequired: isMonday, canStillComplete: false },
      weeklyReview: { isComplete: false, isAvailable: isWeekend, isRequired: isWeekend },
      streak: emptyStreak,
      missedRituals: [],
      suggestedAction: null,
      welcomeMessage: defaultWelcome,
      daysAwayFromApp: 0,
      nextRitual: null,
      isLoading,
    };
  }

  return {
    morning: { isComplete: data.today.morningDone, isAvailable: isWeekday, isRequired: isWeekday },
    evening: {
      isComplete: data.today.eveningDone,
      isAvailable: isWeekday && after5PM,
      isRequired: isWeekday && after5PM,
    },
    weeklyStart: {
      isComplete: data.weeklyStart.isComplete,
      isAvailable: data.weeklyStart.canStillComplete,
      isRequired: data.weeklyStart.canStillComplete && !data.weeklyStart.isComplete,
      canStillComplete: data.weeklyStart.canStillComplete,
    },
    weeklyReview: { isComplete: data.weeklyReview.isComplete, isAvailable: isWeekend, isRequired: isWeekend },
    streak: data.streak,
    missedRituals: data.missedRituals,
    suggestedAction: data.suggestedAction,
    welcomeMessage: data.welcomeMessage,
    daysAwayFromApp: data.daysAwayFromApp,
    nextRitual: computeNextRitual(data),
    isLoading: false,
  };
}
