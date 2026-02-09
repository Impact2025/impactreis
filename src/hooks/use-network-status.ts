'use client';

import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
  const [lastOfflineAt, setLastOfflineAt] = useState<Date | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineAt(new Date());
    // If we were offline before, mark it
    if (!isOnline) {
      setWasOffline(true);
      // Reset wasOffline after a short delay (for showing "back online" messages)
      setTimeout(() => setWasOffline(false), 5000);
    }
  }, [isOnline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setLastOfflineAt(new Date());
  }, []);

  useEffect(() => {
    // Set initial state
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        setLastOnlineAt(new Date());
      }
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
    lastOnlineAt,
    lastOfflineAt,
  };
}

// Hook for checking connection quality
export function useConnectionQuality() {
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('unknown');
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const connection = (navigator as Navigator & {
      connection?: {
        type?: string;
        effectiveType?: string;
        saveData?: boolean;
        addEventListener?: (type: string, listener: () => void) => void;
        removeEventListener?: (type: string, listener: () => void) => void;
      }
    }).connection;

    if (connection) {
      const updateConnectionInfo = () => {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || 'unknown');
        setSaveData(connection.saveData || false);
      };

      updateConnectionInfo();
      connection.addEventListener?.('change', updateConnectionInfo);

      return () => {
        connection.removeEventListener?.('change', updateConnectionInfo);
      };
    }
  }, []);

  return {
    connectionType,
    effectiveType,
    saveData,
    isSlow: effectiveType === 'slow-2g' || effectiveType === '2g',
  };
}
