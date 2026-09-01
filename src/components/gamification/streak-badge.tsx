'use client';

import { useEffect, useState } from 'react';
import { Flame, Trophy, AlertTriangle, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
  getStreakData,
  getStreakMilestone,
  wasStreakBroken,
  recordStreakBreak,
  getSpeedOfReturn,
  type StreakData,
} from '@/lib/streak.service';

interface StreakBadgeProps {
  compact?: boolean;
  showMilestone?: boolean;
}

export function StreakBadge({ compact = false, showMilestone = true }: StreakBadgeProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [streakWasBroken, setStreakWasBroken] = useState(false);
  const [speedOfReturn, setSpeedOfReturn] = useState<'lightning' | 'fast' | 'steady' | null>(null);

  useEffect(() => {
    setIsClient(true);
    const data = getStreakData();
    setStreakData(data);

    const broken = wasStreakBroken();
    setStreakWasBroken(broken);

    // If today's streak is 0 but there was a previous streak, record the break
    if (data.currentStreak === 0 && broken) {
      recordStreakBreak();
    }

    setSpeedOfReturn(getSpeedOfReturn());
  }, []);

  if (!isClient || !streakData) {
    return null;
  }

  const { currentStreak, longestStreak, isAtRisk } = streakData;
  const milestone = getStreakMilestone(currentStreak);
  const isRecord = currentStreak > 0 && currentStreak === longestStreak;

  // No streak yet — compassionate reset UI
  if (currentStreak === 0) {
    if (compact) return null;

    const isComeback = streakWasBroken;

    return (
      <div className="flex flex-col gap-3 p-4 bg-surface-sunken rounded-lg border border-line">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center">
            <Flame className="text-accent" size={20} />
          </div>
          <div className="flex-1">
            {isComeback ? (
              <>
                <p className="font-medium text-ink">Welkom terug.</p>
                <p className="text-sm text-ink-soft">
                  Elke dag is een nieuwe kans. Jouw comeback begint nu.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-ink">Start je streak!</p>
                <p className="text-sm text-ink-soft">
                  Voltooi ochtend & avond ritueel om te beginnen.
                </p>
              </>
            )}
          </div>
        </div>
        {isComeback && (
          <Link
            href="/morning"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Begin de dag opnieuw
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    );
  }

  // Returned after a break — show Speed of Return badge
  const showSpeedOfReturn = speedOfReturn && currentStreak >= 1;

  // Compact version for headers
  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isAtRisk
          ? 'bg-error-soft text-error'
          : isRecord
            ? 'bg-tertiary text-white'
            : 'bg-tertiary-soft text-tertiary'
          }`}
      >
        {isAtRisk ? (
          <AlertTriangle size={14} className="animate-pulse" />
        ) : (
          <Flame size={14} className={isRecord ? 'animate-pulse' : ''} />
        )}
        <span className="text-sm font-bold">{currentStreak}</span>
      </div>
    );
  }

  // Full version with milestone progress
  return (
    <div className="relative">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isAtRisk
          ? 'bg-error-soft border border-error'
          : isRecord
            ? 'bg-tertiary-soft border border-tertiary'
            : 'bg-surface-card border border-line'
          }`}
      >
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${isAtRisk
            ? 'bg-error'
            : isRecord
              ? 'bg-tertiary'
              : 'bg-accent'
            }`}
        >
          {isAtRisk ? (
            <AlertTriangle className="text-white animate-pulse" size={20} />
          ) : isRecord ? (
            <Trophy className="text-white" size={20} />
          ) : (
            <Flame className="text-white" size={20} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">
              {currentStreak}
            </span>
            <span className="text-sm text-ink-soft">
              {currentStreak === 1 ? 'dag' : 'dagen'}
            </span>
            {isRecord && currentStreak > 1 && (
              <span className="text-xs font-medium px-2 py-0.5 bg-tertiary text-white rounded-full">
                Record!
              </span>
            )}
          </div>

          {/* Status message */}
          {isAtRisk && (
            <p className="text-xs text-error">
              Maak vandaag af om je streak te behouden!
            </p>
          )}

          {/* Speed of Return badge */}
          {showSpeedOfReturn && !isAtRisk && (
            <div className="flex items-center gap-1 mt-0.5">
              <Zap size={12} className="text-tertiary" />
              <span className="text-xs text-tertiary font-medium">
                {speedOfReturn === 'lightning' ? 'Terug! Direct opgepakt ⚡' : speedOfReturn === 'fast' ? 'Terug! Snelle comeback ⚡' : 'Terug! Goed gedaan ⚡'}
              </span>
            </div>
          )}

          {/* Milestone progress */}
          {showMilestone && milestone && !isAtRisk && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-ink-soft mb-1">
                <span>Volgende: {milestone.milestone} dagen</span>
                <span>{milestone.progress}%</span>
              </div>
              <div className="h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                <div
                  className="h-full bg-tertiary rounded-full transition-all duration-500"
                  style={{ width: `${milestone.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record animation */}
      {isRecord && currentStreak > 1 && (
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary" />
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Mini streak display for use in lists/cards
 */
export function StreakMini() {
  const [streak, setStreak] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const data = getStreakData();
    setStreak(data.currentStreak);
  }, []);

  if (!isClient || streak === 0) return null;

  return (
    <div className="inline-flex items-center gap-1 text-tertiary">
      <Flame size={14} />
      <span className="text-sm font-medium">{streak}</span>
    </div>
  );
}
