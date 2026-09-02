'use client';

interface RitualGuardProps {
  children: React.ReactNode;
}

/**
 * RitualGuard Component
 *
 * Historically force-redirected to the next required ritual (morning/evening/
 * weekly-start/weekly-review) before the dashboard could render at all. That
 * made the app feel like a maze of forced screens instead of one home base.
 *
 * Now a pass-through: the dashboard itself surfaces "nog te doen" rituals as
 * an inline, dismissable card (see useRitualStatus().nextRitual, backed by
 * /api/ritual-status) so the user can see their day and choose when to act,
 * instead of being forced there.
 */
export function RitualGuard({ children }: RitualGuardProps) {
  return <>{children}</>;
}
