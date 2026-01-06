'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  getDayType,
  isAfter5PM,
  getCurrentWeekNumber,
  getToday,
} from '@/lib/weekflow.service';
import { canStillDoWeeklyStart } from '@/lib/ritual-recovery.service';

export interface RitualStatusData {
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
  weeklyStart: {
    isComplete: boolean;
    isAvailable: boolean;
    isRequired: boolean;
  };
  weeklyReview: {
    isComplete: boolean;
    isAvailable: boolean;
    isRequired: boolean;
  };
  isLoading: boolean;
}

const defaultStatus: RitualStatusData = {
  morning: { isComplete: false, isAvailable: true, isRequired: true },
  evening: { isComplete: false, isAvailable: false, isRequired: true },
  weeklyStart: { isComplete: false, isAvailable: false, isRequired: false },
  weeklyReview: { isComplete: false, isAvailable: false, isRequired: false },
  isLoading: true,
};

export function useRitualStatus(): RitualStatusData {
  const [status, setStatus] = useState<RitualStatusData>(defaultStatus);

  useEffect(() => {
    const fetchStatus = async () => {
      const dayType = getDayType();
      const after5PM = isAfter5PM();
      const today = getToday();
      const weekNumber = getCurrentWeekNumber();
      const year = new Date().getFullYear();
      const weekKey = `${year}-W${weekNumber}`;

      const isWeekday = dayType === 'weekday' || dayType === 'monday';
      const isWeekend = dayType === 'weekend';
      const weekStartAvailable = canStillDoWeeklyStart();

      try {
        // Fetch all ritual statuses from database in parallel
        const [morningLogs, eveningLogs, weeklyStartLogs, weeklyReviewLogs] = await Promise.all([
          api.logs.getByTypeAndDate('morning', today).catch(() => []),
          api.logs.getByTypeAndDate('evening', today).catch(() => []),
          api.logs.getByTypeAndDate('weeklyStart', weekKey).catch(() => []),
          api.logs.getByTypeAndDate('weeklyReview', weekKey).catch(() => []),
        ]);

        const morningComplete = morningLogs.length > 0;
        const eveningComplete = eveningLogs.length > 0;
        const weeklyStartComplete = weeklyStartLogs.length > 0;
        const weeklyReviewComplete = weeklyReviewLogs.length > 0;

        // Sync to localStorage for offline support
        if (morningComplete) {
          const data = morningLogs[0].data;
          localStorage.setItem(`morningRitual_${today}`, JSON.stringify(typeof data === 'string' ? JSON.parse(data) : data));
        }
        if (eveningComplete) {
          const data = eveningLogs[0].data;
          localStorage.setItem(`eveningRitual_${today}`, JSON.stringify(typeof data === 'string' ? JSON.parse(data) : data));
        }
        if (weeklyStartComplete) {
          localStorage.setItem(`weeklyStart_${year}_${weekNumber}`, 'true');
        }
        if (weeklyReviewComplete) {
          localStorage.setItem(`weeklyReview_${year}_${weekNumber}`, 'true');
        }

        setStatus({
          morning: {
            isComplete: morningComplete,
            isAvailable: isWeekday,
            isRequired: isWeekday,
          },
          evening: {
            isComplete: eveningComplete,
            isAvailable: isWeekday && after5PM,
            isRequired: isWeekday && after5PM,
          },
          weeklyStart: {
            isComplete: weeklyStartComplete,
            isAvailable: weekStartAvailable,
            isRequired: weekStartAvailable && !weeklyStartComplete,
          },
          weeklyReview: {
            isComplete: weeklyReviewComplete,
            isAvailable: isWeekend,
            isRequired: isWeekend,
          },
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to fetch ritual status:', error);
        // Fall back to localStorage-based status
        setStatus({
          ...defaultStatus,
          isLoading: false,
        });
      }
    };

    fetchStatus();
  }, []);

  return status;
}
