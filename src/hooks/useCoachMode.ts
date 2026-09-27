'use client';

import { useEffect, useState } from 'react';
import { AuthService } from '@/lib/auth';
import { getProfileMode, type CoachMode } from '@/lib/onboarding';

/** Coach-modus van de ingelogde gebruiker. Bij een fout of ontbrekend profiel: `commercial`. */
export function useCoachMode(): { mode: CoachMode; loading: boolean } {
  const [mode, setMode] = useState<CoachMode>('commercial');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/onboarding/profile', { headers: { Authorization: `Bearer ${AuthService.getToken()}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled) setMode(getProfileMode(data?.profile)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return { mode, loading };
}
