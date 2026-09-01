'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Sun, Moon } from 'lucide-react';

interface CachedRitual {
  type: 'morning' | 'evening';
  date: string;
  data: Record<string, unknown>;
}

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [cachedRituals, setCachedRituals] = useState<CachedRitual[]>([]);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    // Load cached rituals from localStorage
    try {
      const cached = localStorage.getItem('offline_rituals');
      if (cached) {
        setCachedRituals(JSON.parse(cached));
      }
    } catch {
      // Ignore parse errors
    }

    // Check pending sync queue
    try {
      const queue = localStorage.getItem('sync_queue');
      if (queue) {
        const items = JSON.parse(queue);
        setPendingChanges(Array.isArray(items) ? items.length : 0);
      }
    } catch {
      // Ignore parse errors
    }

    // Listen for online event
    const handleOnline = () => {
      window.location.href = '/dashboard';
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);

    // Check if we're back online
    if (navigator.onLine) {
      window.location.href = '/dashboard';
      return;
    }

    // Try to fetch something
    try {
      await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store'
      });
      window.location.href = '/dashboard';
    } catch {
      // Still offline
      setIsRetrying(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-inverse via-surface-inverse to-surface-inverse flex flex-col items-center justify-center p-6">
      {/* Offline Icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-surface-inverse/50 flex items-center justify-center border border-line/50">
          <WifiOff className="w-12 h-12 text-ink-soft" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-tertiary/20 flex items-center justify-center border border-tertiary/30">
          <span className="text-tertiary text-sm font-bold">!</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white mb-2">Je bent offline</h1>
      <p className="text-ink-soft text-center max-w-sm mb-8">
        Geen internetverbinding gevonden. Je wijzigingen worden lokaal opgeslagen en gesynchroniseerd zodra je weer online bent.
      </p>

      {/* Pending Changes Indicator */}
      {pendingChanges > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg mb-6">
          <CheckCircle2 className="w-4 h-4 text-accent" />
          <span className="text-accent text-sm">
            {pendingChanges} wijziging{pendingChanges !== 1 ? 'en' : ''} wacht{pendingChanges === 1 ? '' : 'en'} op synchronisatie
          </span>
        </div>
      )}

      {/* Retry Button */}
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent disabled:bg-accent disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors mb-8"
      >
        <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying ? 'Verbinding controleren...' : 'Opnieuw proberen'}
      </button>

      {/* Cached Rituals */}
      {cachedRituals.length > 0 && (
        <div className="w-full max-w-md">
          <h2 className="text-lg font-semibold text-white mb-4">
            Opgeslagen rituelen
          </h2>
          <div className="space-y-3">
            {cachedRituals.slice(0, 5).map((ritual, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-surface-inverse/50 border border-line/50 rounded-xl"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  ritual.type === 'morning'
                    ? 'bg-tertiary/20 text-tertiary'
                    : 'bg-accent/20 text-accent'
                }`}>
                  {ritual.type === 'morning' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">
                    {ritual.type === 'morning' ? 'Ochtend' : 'Avond'} Ritueel
                  </p>
                  <p className="text-ink-soft text-sm">
                    {formatDate(ritual.date)}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 p-4 bg-surface-inverse/30 border border-line/30 rounded-xl max-w-md">
        <h3 className="text-sm font-medium text-outline mb-2">Tips voor offline gebruik:</h3>
        <ul className="text-sm text-ink-soft space-y-1">
          <li>- Je kunt rituelen blijven invullen</li>
          <li>- Wijzigingen worden automatisch opgeslagen</li>
          <li>- Synchronisatie gebeurt automatisch bij verbinding</li>
        </ul>
      </div>
    </div>
  );
}
