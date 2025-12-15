'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { RitualStatusBadge, RitualBadgeStatus } from './ritual-status-badge';

interface RitualCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  isComplete: boolean;
  isAvailable: boolean;
  unavailableReason?: string;
  gradient: string;
}

/**
 * RitualCard Component
 *
 * Displays a ritual with its status and navigation link
 *
 * Features:
 * - Shows checkmark if completed (but remains clickable to redo)
 * - Disabled state if not available
 * - Visual gradient based on ritual type
 * - Status badge
 */
export function RitualCard({
  title,
  description,
  icon: Icon,
  path,
  isComplete,
  isAvailable,
  unavailableReason,
  gradient,
}: RitualCardProps) {
  const getBadgeStatus = (): RitualBadgeStatus => {
    if (isComplete) return 'complete';
    if (!isAvailable) return 'locked';
    return 'available';
  };

  const cardContent = (
    <div
      className={`
        relative group overflow-hidden rounded-2xl p-6 border-2 transition-all
        ${gradient}
        ${
          isAvailable
            ? 'hover:scale-[1.02] hover:shadow-xl cursor-pointer'
            : 'opacity-60 cursor-not-allowed'
        }
      `}
    >
      {/* Icon Background */}
      <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon size={80} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
            <Icon size={28} className="text-slate-800 dark:text-white" />
          </div>
          <RitualStatusBadge status={getBadgeStatus()} />
        </div>

        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h3>

        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          {isAvailable ? description : (unavailableReason || 'Nog niet beschikbaar')}
        </p>

        {isComplete && isAvailable && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 italic">
            ✓ Klik om opnieuw te doen
          </p>
        )}
      </div>

      {/* Hover Indicator */}
      {isAvailable && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform" />
      )}
    </div>
  );

  if (!isAvailable) {
    return cardContent;
  }

  return <Link href={path}>{cardContent}</Link>;
}
