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
        <div className="h-8 bg-surface-sunken  rounded w-48 mb-2" />
        <div className="h-5 bg-surface-sunken  rounded w-64" />
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
        <div className="bg-gradient-to-r from-accent to-accent rounded-2xl p-6 text-white mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={24} />
                <h2 className="text-2xl font-bold">Welkom terug!</h2>
              </div>
              <p className="text-accent-soft mb-4">
                {daysAwayFromApp >= 7
                  ? `Je was ${daysAwayFromApp} dagen weg. Geen zorgen - laten we opnieuw beginnen!`
                  : `Je was ${daysAwayFromApp} dagen weg. Laten we verder gaan waar je was gebleven.`}
              </p>
              <div className="flex gap-3">
                {suggestedAction && (
                  <Link
                    href={suggestedAction.path}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-accent rounded-lg font-medium hover:bg-accent-soft transition-colors"
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
            <h2 className="text-2xl font-bold text-ink ">
              {welcome.greeting}
            </h2>
            {streakData.currentStreak > 0 && (
              <p className={`text-sm ${streakMessage.type === 'warning' ? 'text-tertiary ' : 'text-ink-soft'}`}>
                {streakMessage.message}
              </p>
            )}
          </div>
          <StreakBadge />
        </div>

        {/* Weekly Start Prompt */}
        <div className={`rounded-2xl p-5 border ${isLastChance
          ? 'bg-gradient-to-r from-tertiary-soft to-tertiary-soft   border-tertiary-soft '
          : 'bg-gradient-to-r from-primary-muted to-primary-muted   border-primary-muted '
          }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isLastChance ? 'bg-tertiary' : 'bg-primary'
              }`}>
              <CalendarDays className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink ">
                {isLastChance ? 'Laatste kans voor je weekstart!' : 'Je kunt je week nog starten'}
              </h3>
              <p className="text-sm text-ink-soft ">
                {isLastChance
                  ? 'Vandaag is de laatste dag om je week te plannen.'
                  : 'Plan je week met focus en intentie.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/weekly-start"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isLastChance
                  ? 'bg-tertiary hover:bg-tertiary text-white'
                  : 'bg-primary hover:bg-primary text-white'
                  }`}
              >
                Start Week
              </Link>
              <Link
                href="/morning"
                className="px-4 py-2 text-ink-soft  hover:text-ink  transition-colors"
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
          <h2 className="text-2xl font-bold text-ink  mb-1">
            {welcome.greeting} {userName ? userName : ''}
          </h2>
          <p className="text-ink-soft ">
            {welcome.subtitle}
          </p>
          {streakData.currentStreak > 0 && streakMessage.type !== 'neutral' && (
            <p className={`text-sm mt-1 ${streakMessage.type === 'warning'
              ? 'text-tertiary '
              : 'text-primary '
              }`}>
              {streakMessage.message}
            </p>
          )}
        </div>
        <StreakBadge />
      </div>

      {/* Quick action if morning not done */}
      {suggestedAction && suggestedAction.type === 'morning' && (
        <div className="mt-4 flex items-center gap-3 p-3 bg-tertiary-soft  rounded-xl border border-tertiary-soft ">
          <Sunrise className="text-tertiary" size={20} />
          <span className="text-sm text-ink-soft  flex-1">
            {suggestedAction.description}
          </span>
          <Link
            href={suggestedAction.path}
            className="text-sm font-medium text-tertiary  hover:text-tertiary"
          >
            Start nu
          </Link>
        </div>
      )}
    </div>
  );
}
