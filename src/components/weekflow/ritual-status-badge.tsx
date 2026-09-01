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
      bg: 'bg-primary-muted',
      text: 'text-primary',
      border: 'border-primary-light',
      label: 'Voltooid',
    },
    available: {
      icon: Zap,
      bg: 'bg-tertiary-soft',
      text: 'text-tertiary',
      border: 'border-tertiary',
      label: 'Nu doen',
    },
    locked: {
      icon: Lock,
      bg: 'bg-surface-sunken',
      text: 'text-outline',
      border: 'border-line',
      label: 'Niet beschikbaar',
    },
    upcoming: {
      icon: Clock,
      bg: 'bg-tertiary-soft',
      text: 'text-tertiary',
      border: 'border-tertiary',
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
