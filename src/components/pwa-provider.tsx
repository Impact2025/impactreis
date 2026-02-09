'use client';

import { useEffect } from 'react';
import { OfflineIndicator } from './offline-indicator';
import { syncService } from '@/lib/sync-service';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Initialize sync service when app loads
    if (typeof window !== 'undefined') {
      // Start periodic sync checks
      syncService.startPeriodicSync(30000); // Check every 30 seconds

      // Initial sync if online
      if (navigator.onLine) {
        syncService.triggerSync();
      }

      // Listen for service worker messages
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_DATA') {
            syncService.triggerSync();
          }
        });
      }

      // Cleanup on unmount
      return () => {
        syncService.stopPeriodicSync();
      };
    }
  }, []);

  return (
    <>
      {children}
      <OfflineIndicator />
    </>
  );
}
