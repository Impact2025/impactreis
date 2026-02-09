/**
 * Background Sync Service
 * Handles synchronization of offline data when connection is restored
 */

import { offlineDB, STORES, SyncQueueItem } from './offline-db';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: Array<{ id: string; error: string }>;
}

class SyncService {
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupListeners();
    }
  }

  private setupListeners(): void {
    // Listen for online event
    window.addEventListener('online', () => {
      this.scheduleSync();
    });

    // Listen for visibility change (tab becomes visible)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.scheduleSync();
      }
    });
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private async apiRequest(
    endpoint: string,
    method: string,
    body?: Record<string, unknown>
  ): Promise<unknown> {
    const token = this.getAuthToken();

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Schedule a sync attempt
  private scheduleSync(delayMs = 1000): void {
    if (this.syncInterval) {
      clearTimeout(this.syncInterval);
    }

    this.syncInterval = setTimeout(() => {
      this.sync();
    }, delayMs);
  }

  // Main sync function
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, failedCount: 0, errors: [] };
    }

    if (!navigator.onLine) {
      return { success: false, syncedCount: 0, failedCount: 0, errors: [] };
    }

    this.isSyncing = true;
    window.dispatchEvent(new CustomEvent('sync:start'));

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      // Get all pending sync items
      const queue = await offlineDB.getSyncQueue();

      for (const item of queue) {
        try {
          await this.processSyncItem(item);
          await offlineDB.removeSyncQueueItem(item.id);
          result.syncedCount++;
        } catch (error) {
          result.failedCount++;
          result.errors.push({
            id: item.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Update retry count
          const retries = item.retries + 1;
          if (retries >= 3) {
            // Remove after 3 failed attempts
            await offlineDB.removeSyncQueueItem(item.id);
          } else {
            await offlineDB.updateSyncQueueItem(item.id, {
              retries,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }

      // Sync unsynced rituals
      await this.syncUnsyncedRituals();

      if (result.failedCount > 0) {
        result.success = false;
        window.dispatchEvent(new CustomEvent('sync:error', { detail: result }));
      } else {
        window.dispatchEvent(new CustomEvent('sync:complete', { detail: result }));
      }
    } catch (error) {
      result.success = false;
      window.dispatchEvent(new CustomEvent('sync:error', { detail: error }));
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const { action, store, payload } = item;

    // Map store to API endpoint
    const endpointMap: Record<string, string> = {
      [STORES.RITUALS]: '/logs',
      [STORES.GOALS]: '/goals',
      [STORES.WINS]: '/wins',
      [STORES.FOCUS_SESSIONS]: '/focus',
      [STORES.WEEKLY_DATA]: '/weekly-reviews',
    };

    const endpoint = endpointMap[store];
    if (!endpoint) {
      throw new Error(`Unknown store: ${store}`);
    }

    switch (action) {
      case 'create':
        await this.apiRequest(endpoint, 'POST', payload);
        break;
      case 'update':
        await this.apiRequest(`${endpoint}/${item.entityId}`, 'PUT', payload);
        break;
      case 'delete':
        await this.apiRequest(`${endpoint}/${item.entityId}`, 'DELETE');
        break;
    }
  }

  private async syncUnsyncedRituals(): Promise<void> {
    const unsyncedRituals = await offlineDB.getUnsyncedRituals();

    for (const ritual of unsyncedRituals) {
      try {
        await this.apiRequest('/logs', 'POST', {
          type: ritual.type,
          date: ritual.date,
          data: ritual.data,
        });
        await offlineDB.markRitualSynced(ritual.id);
      } catch {
        // Will retry on next sync
      }
    }
  }

  // Manual sync trigger
  async triggerSync(): Promise<SyncResult> {
    return this.sync();
  }

  // Check if there are pending items
  async hasPendingItems(): Promise<boolean> {
    const queue = await offlineDB.getSyncQueue();
    return queue.length > 0;
  }

  // Get pending items count
  async getPendingCount(): Promise<number> {
    const queue = await offlineDB.getSyncQueue();
    return queue.length;
  }

  // Start periodic sync check
  startPeriodicSync(intervalMs = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync();
      }
    }, intervalMs);
  }

  // Stop periodic sync
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();

// Helper to add items to sync queue
export async function queueForSync(
  action: 'create' | 'update' | 'delete',
  store: typeof STORES[keyof typeof STORES],
  entityId: string | number,
  payload: Record<string, unknown>
): Promise<void> {
  await offlineDB.addToSyncQueue(action, store, entityId, payload);

  // Try to sync immediately if online
  if (navigator.onLine) {
    syncService.triggerSync();
  }
}
