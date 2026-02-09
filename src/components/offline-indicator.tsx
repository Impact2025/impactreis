'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/use-network-status';

type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check pending sync items
  useEffect(() => {
    const checkPending = () => {
      try {
        const queue = localStorage.getItem('sync_queue');
        if (queue) {
          const items = JSON.parse(queue);
          setPendingCount(Array.isArray(items) ? items.length : 0);
        } else {
          setPendingCount(0);
        }
      } catch {
        setPendingCount(0);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 2000);
    return () => clearInterval(interval);
  }, []);

  // Handle visibility based on network status
  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
      setIsDismissed(false);
      setSyncState('idle');
    } else if (wasOffline && pendingCount > 0) {
      setIsVisible(true);
      setSyncState('syncing');
      // Simulate sync completion
      const timer = setTimeout(() => {
        setSyncState('synced');
        setTimeout(() => {
          if (pendingCount === 0) {
            setIsVisible(false);
          }
        }, 3000);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (wasOffline && pendingCount === 0) {
      setIsVisible(true);
      setSyncState('synced');
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, pendingCount]);

  // Listen for sync events
  useEffect(() => {
    const handleSyncStart = () => setSyncState('syncing');
    const handleSyncComplete = () => {
      setSyncState('synced');
      setTimeout(() => {
        if (pendingCount === 0) {
          setIsVisible(false);
        }
      }, 3000);
    };
    const handleSyncError = () => setSyncState('error');

    window.addEventListener('sync:start', handleSyncStart);
    window.addEventListener('sync:complete', handleSyncComplete);
    window.addEventListener('sync:error', handleSyncError);

    return () => {
      window.removeEventListener('sync:start', handleSyncStart);
      window.removeEventListener('sync:complete', handleSyncComplete);
      window.removeEventListener('sync:error', handleSyncError);
    };
  }, [pendingCount]);

  if (!isVisible || isDismissed) return null;

  const getContent = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        text: pendingCount > 0
          ? `Offline - ${pendingCount} wijziging${pendingCount !== 1 ? 'en' : ''} wacht${pendingCount === 1 ? '' : 'en'}`
          : 'Je bent offline - wijzigingen worden lokaal opgeslagen',
        bgClass: 'bg-amber-500/90',
        textClass: 'text-amber-950',
      };
    }

    switch (syncState) {
      case 'syncing':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          text: `Synchroniseren... (${pendingCount} item${pendingCount !== 1 ? 's' : ''})`,
          bgClass: 'bg-indigo-500/90',
          textClass: 'text-white',
        };
      case 'synced':
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          text: 'Gesynchroniseerd!',
          bgClass: 'bg-emerald-500/90',
          textClass: 'text-white',
        };
      case 'error':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          text: 'Synchronisatie mislukt - probeer later opnieuw',
          bgClass: 'bg-red-500/90',
          textClass: 'text-white',
        };
      default:
        return {
          icon: <Wifi className="w-4 h-4" />,
          text: 'Verbonden',
          bgClass: 'bg-emerald-500/90',
          textClass: 'text-white',
        };
    }
  };

  const content = getContent();

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50
        animate-in slide-in-from-bottom-5 duration-300`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm
          ${content.bgClass} ${content.textClass}`}
      >
        {content.icon}
        <span className="text-sm font-medium flex-1">{content.text}</span>
        {isOnline && syncState !== 'syncing' && (
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Sluiten"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
