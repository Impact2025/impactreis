'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getNextRequiredRitual } from '@/lib/weekflow.service';

interface RitualGuardProps {
  children: React.ReactNode;
}

/**
 * RitualGuard Component
 *
 * Automatically redirects users to the next required ritual based on:
 * - Day of week (weekday vs weekend vs Monday)
 * - Time of day (before/after 17:00)
 * - Completion status of rituals
 *
 * Wrap this around dashboard to enforce weekflow automation
 */
export function RitualGuard({ children }: RitualGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndRedirect = () => {
      // Get next required ritual
      const nextRitual = getNextRequiredRitual();

      // If there's a required ritual that's available, redirect to it
      if (nextRitual && nextRitual.isRequired && nextRitual.isAvailable) {
        console.log('[RitualGuard] Redirecting to:', nextRitual.path, nextRitual.reason);
        router.push(nextRitual.path);
        return;
      }

      // No redirect needed, show dashboard
      setIsChecking(false);
    };

    // Small delay to prevent flash
    const timer = setTimeout(checkAndRedirect, 100);

    return () => clearTimeout(timer);
  }, [router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            Even checken...
          </p>
        </div>
      </div>
    );
  }

  // Render dashboard
  return <>{children}</>;
}
