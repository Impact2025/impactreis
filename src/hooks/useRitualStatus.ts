'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { getDayType, isAfter5PM, DEFAULT_RITUAL_SETTINGS, type RitualSettings } from '@/lib/weekflow.service';
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
  settings: RitualSettings;
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

// De server (ritual-status.service.ts:getRitualStatus) is de enige bron van waarheid voor
// "wat is de volgende stap" — hier vroeger nog een tweede, bijna-identieke beslisboom
// (computeNextRitual) laten leven zorgde ervoor dat client en server uit de pas konden lopen
// zodra één van de twee gewijzigd werd zonder de ander mee te nemen (bv. de evening-actie
// ontbrak lange tijd server-side terwijl de client 'm wel toonde).
function toNextRitual(action: RecoveryAction | null): NextRitual | null {
  if (!action) return null;
  return {
    path: action.path,
    title: action.title,
    isRequired: action.type !== 'freshStart',
    isAvailable: action.isAvailable,
    reason: action.description,
  };
}

export function useRitualStatus(): RitualStatusData {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ritualStatus,
    queryFn: () => api.ritualStatus.get(),
    staleTime: 1000 * 30,
  });

  if (!data) {
    const dayType = getDayType(DEFAULT_RITUAL_SETTINGS);
    const after5PM = isAfter5PM(DEFAULT_RITUAL_SETTINGS);
    const isWeekday = dayType === 'weekday' || dayType === 'monday';
    const isWeekend = dayType === 'weekend';
    const isMonday = dayType === 'monday';
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
      settings: DEFAULT_RITUAL_SETTINGS,
      isLoading,
    };
  }

  // Vanaf hier is data.settings (server-geladen, per gebruiker) de bron van waarheid — niet
  // meer de client-default die hierboven alleen dient als optimistische eerste render.
  const dayType = getDayType(data.settings);
  const after5PM = isAfter5PM(data.settings);
  const isWeekday = dayType === 'weekday' || dayType === 'monday';
  const isWeekend = dayType === 'weekend';

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
    nextRitual: toNextRitual(data.suggestedAction),
    settings: data.settings,
    isLoading: false,
  };
}
