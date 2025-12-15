import { CheckCircle, Clock, Lock, Zap } from 'lucide-react';

export type RitualBadgeStatus = 'complete' | 'available' | 'locked' | 'upcoming';

interface RitualStatusBadgeProps {
  status: RitualBadgeStatus;
  className?: string;
}

/**
 * RitualStatusBadge Component
 *
 * Visual indicator for ritual completion status:
 * - ✓ Complete (green)
 * - ⏰ Available (orange)
 * - 🔒 Locked (gray)
 * - ⏱ Upcoming (yellow)
 */
export function RitualStatusBadge({ status, className = '' }: RitualStatusBadgeProps) {
  const variants = {
    complete: {
      icon: CheckCircle,
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      label: 'Voltooid',
    },
    available: {
      icon: Zap,
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
      label: 'Nu doen',
    },
    locked: {
      icon: Lock,
      bg: 'bg-slate-100 dark:bg-slate-800/30',
      text: 'text-slate-500 dark:text-slate-500',
      border: 'border-slate-200 dark:border-slate-700',
      label: 'Niet beschikbaar',
    },
    upcoming: {
      icon: Clock,
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      label: 'Straks',
    },
  };

  const variant = variants[status];
  const Icon = variant.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${variant.bg} ${variant.text} ${variant.border} text-sm font-medium ${className}`}
    >
      <Icon size={14} />
      <span>{variant.label}</span>
    </div>
  );
}
