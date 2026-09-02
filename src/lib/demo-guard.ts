/**
 * Demo-guard: bepaalde functies (ACA Herstelpad, ADHD Klachten, Cursussen) zijn alleen
 * zichtbaar voor het demo-account van Vincent (v.munster@weareimpact.nl).
 * Andere accounts zien deze niet in het menu of op het dashboard.
 *
 * Dit is een client-side guard. De server-routes blijven bereikbaar maar de
 * navigation links worden verborgen. Voor een volledige guard moeten de API-routes
 * zelf ook de gebruiker moeten authenticeren.
 */

// Het enige account dat toegang heeft tot de demo-functies
const DEMO_ACCOUNT_EMAIL = 'v.munster@weareimpact.nl';

// Routes die alleen zichtbaar zijn voor het demo-account
export const DEMO_RESTRICTED_PATHS = ['/aca', '/adhd', '/courses'];

/**
 * Controleer of de huidige ingelogde gebruiker toegang heeft tot demo-functies.
 * Leest het emailadres uit localStorage (zodat het consistent is met AuthService).
 */
export function canAccessDemoFeatures(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    const user = JSON.parse(userStr);
    return user?.email === DEMO_ACCOUNT_EMAIL;
  } catch {
    return false;
  }
}

/**
 * Hook voor React componenten om te checken of demo-functies zichtbaar moeten zijn.
 * Geeft een boolean terug die reageert op localStorage wijzigingen.
 */
import { useState, useEffect } from 'react';

export function useDemoAccess(): boolean {
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    setCanAccess(canAccessDemoFeatures());
  }, []);

  return canAccess;
}
