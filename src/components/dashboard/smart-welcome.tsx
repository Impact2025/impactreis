'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Sunrise, RefreshCw, ArrowRight } from 'lucide-react';
import {
  getRecoveryStatus,
  getWelcomeMessage,
  shouldShowRecoveryModal,
  type RecoveryStatus,
} from '@/lib/ritual-recovery.service';
import { getStreakData, getStreakMessage } from '@/lib/streak.service';
import { StreakBadge } from '@/components/gamification/streak-badge';

interface SmartWelcomeProps {
  userName?: string;
}

export function SmartWelcome({ userName }: SmartWelcomeProps) {
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus | null>(null);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const status = getRecoveryStatus();
    setRecoveryStatus(status);
    setShowRecoveryPrompt(shouldShowRecoveryModal());
  }, []);

  if (!isClient || !recoveryStatus) {
    return (
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2" />
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-64" />
      </div>
    );
  }

  const welcome = getWelcomeMessage();
  const streakData = getStreakData();
  const streakMessage = getStreakMessage();
  const { suggestedAction, weeklyStartStatus, daysAwayFromApp } = recoveryStatus;

  // If user was away for a while, show recovery banner
  if (daysAwayFromApp >= 3 && showRecoveryPrompt) {
    return (
      <div className="mb-8">
        {/* Recovery Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={24} />
                <h2 className="text-2xl font-bold">Welkom terug!</h2>
              </div>
              <p className="text-indigo-100 mb-4">
                {daysAwayFromApp >= 7
                  ? `Je was ${daysAwayFromApp} dagen weg. Geen zorgen - laten we opnieuw beginnen!`
                  : `Je was ${daysAwayFromApp} dagen weg. Laten we verder gaan waar je was gebleven.`}
              </p>
              <div className="flex gap-3">
                {suggestedAction && (
                  <Link
                    href={suggestedAction.path}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                  >
                    {suggestedAction.title}
                    <ArrowRight size={16} />
                  </Link>
                )}
                <button
                  onClick={() => setShowRecoveryPrompt(false)}
                  className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            {streakData.currentStreak > 0 && (
              <StreakBadge compact />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Weekly start prompt (Tuesday/Wednesday)
  if (
    !weeklyStartStatus.isComplete &&
    weeklyStartStatus.canStillComplete &&
    weeklyStartStatus.dayOfWeek >= 2
  ) {
    const isLastChance = weeklyStartStatus.dayOfWeek === 3;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {welcome.greeting}
            </h2>
            {streakData.currentStreak > 0 && (
              <p className={`text-sm ${streakMessage.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                {streakMessage.message}
              </p>
            )}
          </div>
          <StreakBadge />
        </div>

        {/* Weekly Start Prompt */}
        <div className={`rounded-2xl p-5 border ${isLastChance
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800'
          : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800'
          }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLastChance ? 'bg-amber-500' : 'bg-emerald-500'
              }`}>
              <CalendarDays className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 dark:text-white">
                {isLastChance ? 'Laatste kans voor je weekstart!' : 'Je kunt je week nog starten'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isLastChance
                  ? 'Vandaag is de laatste dag om je week te plannen.'
                  : 'Plan je week met focus en intentie.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/weekly-start"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isLastChance
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
              >
                Start Week
              </Link>
              <Link
                href="/morning"
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                Ochtend
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal welcome with streak
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
            {welcome.greeting} {userName ? userName : ''}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {welcome.subtitle}
          </p>
          {streakData.currentStreak > 0 && streakMessage.type !== 'neutral' && (
            <p className={`text-sm mt-1 ${streakMessage.type === 'warning'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
              }`}>
              {streakMessage.message}
            </p>
          )}
        </div>
        <StreakBadge />
      </div>

      {/* Quick action if morning not done */}
      {suggestedAction && suggestedAction.type === 'morning' && (
        <div className="mt-4 flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-800">
          <Sunrise className="text-orange-500" size={20} />
          <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
            {suggestedAction.description}
          </span>
          <Link
            href={suggestedAction.path}
            className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700"
          >
            Start nu
          </Link>
        </div>
      )}
    </div>
  );
}
