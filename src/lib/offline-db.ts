/**
 * IndexedDB wrapper for offline data storage
 * Provides stores for rituals, goals, wins, focus sessions, and sync queue
 */

const DB_NAME = 'mijn-ondernemers-os';
const DB_VERSION = 1;

// Store names
export const STORES = {
  RITUALS: 'rituals',
  GOALS: 'goals',
  WINS: 'wins',
  FOCUS_SESSIONS: 'focusSessions',
  WEEKLY_DATA: 'weeklyData',
  SYNC_QUEUE: 'syncQueue',
  SETTINGS: 'settings',
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

// Types for stored data
export interface StoredRitual {
  id: string;
  date: string;
  type: 'morning' | 'evening';
  data: Record<string, unknown>;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoredGoal {
  id: string | number;
  data: Record<string, unknown>;
  synced: boolean;
  updatedAt: string;
}

export interface StoredWin {
  id: string | number;
  data: Record<string, unknown>;
  synced: boolean;
  updatedAt: string;
}

export interface StoredFocusSession {
  id: string;
  date: string;
  data: Record<string, unknown>;
  synced: boolean;
  updatedAt: string;
}

export interface StoredWeeklyData {
  id: string;
  weekStart: string;
  data: Record<string, unknown>;
  synced: boolean;
  updatedAt: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  store: StoreName;
  entityId: string | number;
  payload: Record<string, unknown>;
  timestamp: string;
  retries: number;
  error?: string;
}

class OfflineDB {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Rituals store
        if (!db.objectStoreNames.contains(STORES.RITUALS)) {
          const ritualStore = db.createObjectStore(STORES.RITUALS, { keyPath: 'id' });
          ritualStore.createIndex('date', 'date', { unique: false });
          ritualStore.createIndex('type', 'type', { unique: false });
          ritualStore.createIndex('synced', 'synced', { unique: false });
          ritualStore.createIndex('date_type', ['date', 'type'], { unique: true });
        }

        // Goals store
        if (!db.objectStoreNames.contains(STORES.GOALS)) {
          const goalStore = db.createObjectStore(STORES.GOALS, { keyPath: 'id' });
          goalStore.createIndex('synced', 'synced', { unique: false });
        }

        // Wins store
        if (!db.objectStoreNames.contains(STORES.WINS)) {
          const winStore = db.createObjectStore(STORES.WINS, { keyPath: 'id' });
          winStore.createIndex('synced', 'synced', { unique: false });
        }

        // Focus sessions store
        if (!db.objectStoreNames.contains(STORES.FOCUS_SESSIONS)) {
          const focusStore = db.createObjectStore(STORES.FOCUS_SESSIONS, { keyPath: 'id' });
          focusStore.createIndex('date', 'date', { unique: false });
          focusStore.createIndex('synced', 'synced', { unique: false });
        }

        // Weekly data store
        if (!db.objectStoreNames.contains(STORES.WEEKLY_DATA)) {
          const weeklyStore = db.createObjectStore(STORES.WEEKLY_DATA, { keyPath: 'id' });
          weeklyStore.createIndex('weekStart', 'weekStart', { unique: false });
          weeklyStore.createIndex('synced', 'synced', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('store', 'store', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };
    });

    return this.dbPromise;
  }

  // Generic CRUD operations
  async put<T extends { id: string | number }>(storeName: StoreName, data: T): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: StoreName, id: string | number): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: StoreName, id: string | number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: StoreName): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<T>(
    storeName: StoreName,
    indexName: string,
    value: IDBValidKey | IDBKeyRange
  ): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  // Ritual-specific methods
  async saveRitual(
    type: 'morning' | 'evening',
    date: string,
    data: Record<string, unknown>,
    synced = false
  ): Promise<StoredRitual> {
    const id = `${date}_${type}`;
    const now = new Date().toISOString();
    const ritual: StoredRitual = {
      id,
      date,
      type,
      data,
      synced,
      createdAt: now,
      updatedAt: now,
    };
    await this.put(STORES.RITUALS, ritual);

    // Also save to localStorage for offline page access
    this.updateLocalStorageRituals();

    return ritual;
  }

  async getRitualByDateAndType(date: string, type: 'morning' | 'evening'): Promise<StoredRitual | undefined> {
    const id = `${date}_${type}`;
    return this.get<StoredRitual>(STORES.RITUALS, id);
  }

  async getRitualsByDate(date: string): Promise<StoredRitual[]> {
    return this.getByIndex<StoredRitual>(STORES.RITUALS, 'date', date);
  }

  async getUnsyncedRituals(): Promise<StoredRitual[]> {
    // Get all rituals and filter for unsynced ones
    const allRituals = await this.getAll<StoredRitual>(STORES.RITUALS);
    return allRituals.filter(r => !r.synced);
  }

  async markRitualSynced(id: string): Promise<void> {
    const ritual = await this.get<StoredRitual>(STORES.RITUALS, id);
    if (ritual) {
      ritual.synced = true;
      ritual.updatedAt = new Date().toISOString();
      await this.put(STORES.RITUALS, ritual);
    }
  }

  private async updateLocalStorageRituals(): Promise<void> {
    try {
      const rituals = await this.getAll<StoredRitual>(STORES.RITUALS);
      const recentRituals = rituals
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      localStorage.setItem('offline_rituals', JSON.stringify(recentRituals));
    } catch {
      // Ignore errors
    }
  }

  // Sync queue methods
  async addToSyncQueue(
    action: 'create' | 'update' | 'delete',
    store: StoreName,
    entityId: string | number,
    payload: Record<string, unknown>
  ): Promise<SyncQueueItem> {
    const item: SyncQueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      store,
      entityId,
      payload,
      timestamp: new Date().toISOString(),
      retries: 0,
    };
    await this.put(STORES.SYNC_QUEUE, item);

    // Update localStorage for quick access
    this.updateLocalStorageSyncQueue();

    return item;
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const items = await this.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
    return items.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    await this.delete(STORES.SYNC_QUEUE, id);
    this.updateLocalStorageSyncQueue();
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const item = await this.get<SyncQueueItem>(STORES.SYNC_QUEUE, id);
    if (item) {
      await this.put(STORES.SYNC_QUEUE, { ...item, ...updates });
      this.updateLocalStorageSyncQueue();
    }
  }

  private async updateLocalStorageSyncQueue(): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      localStorage.setItem('sync_queue', JSON.stringify(queue));
    } catch {
      // Ignore errors
    }
  }

  // Goals methods
  async saveGoal(id: string | number, data: Record<string, unknown>, synced = false): Promise<StoredGoal> {
    const goal: StoredGoal = {
      id,
      data,
      synced,
      updatedAt: new Date().toISOString(),
    };
    await this.put(STORES.GOALS, goal);
    return goal;
  }

  async getGoals(): Promise<StoredGoal[]> {
    return this.getAll<StoredGoal>(STORES.GOALS);
  }

  async getUnsyncedGoals(): Promise<StoredGoal[]> {
    const allGoals = await this.getAll<StoredGoal>(STORES.GOALS);
    return allGoals.filter(g => !g.synced);
  }

  // Wins methods
  async saveWin(id: string | number, data: Record<string, unknown>, synced = false): Promise<StoredWin> {
    const win: StoredWin = {
      id,
      data,
      synced,
      updatedAt: new Date().toISOString(),
    };
    await this.put(STORES.WINS, win);
    return win;
  }

  async getWins(): Promise<StoredWin[]> {
    return this.getAll<StoredWin>(STORES.WINS);
  }

  async getUnsyncedWins(): Promise<StoredWin[]> {
    const allWins = await this.getAll<StoredWin>(STORES.WINS);
    return allWins.filter(w => !w.synced);
  }

  // Focus session methods
  async saveFocusSession(
    id: string,
    date: string,
    data: Record<string, unknown>,
    synced = false
  ): Promise<StoredFocusSession> {
    const session: StoredFocusSession = {
      id,
      date,
      data,
      synced,
      updatedAt: new Date().toISOString(),
    };
    await this.put(STORES.FOCUS_SESSIONS, session);
    return session;
  }

  async getFocusSessionsByDate(date: string): Promise<StoredFocusSession[]> {
    return this.getByIndex<StoredFocusSession>(STORES.FOCUS_SESSIONS, 'date', date);
  }

  // Settings methods
  async getSetting<T>(key: string): Promise<T | undefined> {
    const result = await this.get<{ key: string; value: T }>(STORES.SETTINGS, key);
    return result?.value;
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    await this.put(STORES.SETTINGS, { id: key, key, value });
  }

  // Utility methods
  async getStoreCounts(): Promise<Record<StoreName, number>> {
    const counts: Record<string, number> = {};
    for (const store of Object.values(STORES)) {
      const items = await this.getAll(store);
      counts[store] = items.length;
    }
    return counts as Record<StoreName, number>;
  }

  async clearAllData(): Promise<void> {
    for (const store of Object.values(STORES)) {
      await this.clear(store);
    }
    localStorage.removeItem('offline_rituals');
    localStorage.removeItem('sync_queue');
  }
}

// Export singleton instance
export const offlineDB = new OfflineDB();
