import { offlineDB, STORES, StoredRitual, StoredGoal, StoredWin } from './offline-db';
import { queueForSync } from './sync-service';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Check if online
const isOnline = () => isBrowser && navigator.onLine;

class ApiClient {
  private getAuthToken(): string | null {
    if (isBrowser) {
      return localStorage.getItem('token');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Offline-first request wrapper
  private async offlineFirstRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    offlineConfig?: {
      store: typeof STORES[keyof typeof STORES];
      action: 'create' | 'update' | 'delete';
      entityId?: string | number;
      fallbackData?: T;
    }
  ): Promise<T> {
    // If online, try the network request
    if (isOnline()) {
      try {
        return await this.request<T>(endpoint, options);
      } catch (error) {
        // If network fails and we have offline config, queue for sync
        if (offlineConfig && options.body) {
          const payload = JSON.parse(options.body as string);
          await queueForSync(
            offlineConfig.action,
            offlineConfig.store,
            offlineConfig.entityId || `temp_${Date.now()}`,
            payload
          );
          // Return the payload as if it succeeded
          return payload as T;
        }
        throw error;
      }
    }

    // Offline: queue the request and return optimistically
    if (offlineConfig && options.body) {
      const payload = JSON.parse(options.body as string);
      await queueForSync(
        offlineConfig.action,
        offlineConfig.store,
        offlineConfig.entityId || `temp_${Date.now()}`,
        payload
      );
      // Return the payload as if it succeeded
      return payload as T;
    }

    // If we have fallback data, return it
    if (offlineConfig?.fallbackData) {
      return offlineConfig.fallbackData;
    }

    throw new Error('Offline and no cached data available');
  }

  // Auth
  auth = {
    login: (email: string, password: string) =>
      this.request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (email: string, password: string) =>
      this.request<{ user: any; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  };

  // Habits
  habits = {
    getAll: () => this.request('/habits'),
    create: (data: any) => this.request('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: any) => this.request(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => this.request(`/habits/${id}`, {
      method: 'DELETE',
    }),
  };

  // Goals (offline-first)
  goals = {
    get: async () => {
      if (isOnline()) {
        try {
          const result = await this.request<any[]>('/goals');
          // Cache in IndexedDB
          for (const goal of result) {
            await offlineDB.saveGoal(goal.id, goal, true);
          }
          return result;
        } catch {
          const cached = await offlineDB.getGoals();
          return cached.map(g => g.data);
        }
      }
      const cached = await offlineDB.getGoals();
      return cached.map(g => g.data);
    },

    getAll: async (type?: string, period?: string) => {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (period) params.append('period', period);
      const queryString = params.toString();

      if (isOnline()) {
        try {
          const result = await this.request<any[]>(`/goals${queryString ? `?${queryString}` : ''}`);
          // Cache in IndexedDB
          for (const goal of result) {
            await offlineDB.saveGoal(goal.id, goal, true);
          }
          return result;
        } catch {
          const cached = await offlineDB.getGoals();
          return cached.map(g => g.data);
        }
      }
      const cached = await offlineDB.getGoals();
      return cached.map(g => g.data);
    },

    create: async (data: any) => {
      const tempId = `temp_${Date.now()}`;

      // Save to IndexedDB first
      await offlineDB.saveGoal(tempId, { ...data, id: tempId }, false);

      if (isOnline()) {
        try {
          const result = await this.request<any>('/goals', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          // Update with real ID
          await offlineDB.delete(STORES.GOALS, tempId);
          await offlineDB.saveGoal(result.id, result, true);
          return result;
        } catch {
          await queueForSync('create', STORES.GOALS, tempId, data);
          return { ...data, id: tempId };
        }
      }

      await queueForSync('create', STORES.GOALS, tempId, data);
      return { ...data, id: tempId };
    },

    update: async (id: number, data: any) => {
      // Update in IndexedDB
      await offlineDB.saveGoal(id, { ...data, id }, false);

      if (isOnline()) {
        try {
          const result = await this.request<any>(`/goals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          });
          await offlineDB.saveGoal(id, result, true);
          return result;
        } catch {
          await queueForSync('update', STORES.GOALS, id, data);
          return { ...data, id };
        }
      }

      await queueForSync('update', STORES.GOALS, id, data);
      return { ...data, id };
    },

    delete: async (id: number) => {
      // Delete from IndexedDB
      await offlineDB.delete(STORES.GOALS, id);

      if (isOnline()) {
        try {
          return await this.request(`/goals/${id}`, { method: 'DELETE' });
        } catch {
          await queueForSync('delete', STORES.GOALS, id, {});
          return { message: 'Deleted offline' };
        }
      }

      await queueForSync('delete', STORES.GOALS, id, {});
      return { message: 'Deleted offline' };
    },
  };

  // Logs (offline-first for rituals)
  logs = {
    getAll: async () => {
      if (isOnline()) {
        try {
          return await this.request<any[]>('/logs');
        } catch {
          // Fallback to IndexedDB
          const rituals = await offlineDB.getAll<StoredRitual>(STORES.RITUALS);
          return rituals.map(r => ({ ...r.data, type: r.type, date: r.date }));
        }
      }
      // Offline: return from IndexedDB
      const rituals = await offlineDB.getAll<StoredRitual>(STORES.RITUALS);
      return rituals.map(r => ({ ...r.data, type: r.type, date: r.date }));
    },

    getByTypeAndDate: async (type: string, date: string) => {
      if (isOnline()) {
        try {
          return await this.request<any[]>(`/logs?type=${type}&date=${date}`);
        } catch {
          // Fallback to IndexedDB
          const ritual = await offlineDB.getRitualByDateAndType(date, type as 'morning' | 'evening');
          return ritual ? [{ ...ritual.data, type: ritual.type, date: ritual.date }] : [];
        }
      }
      // Offline: return from IndexedDB
      const ritual = await offlineDB.getRitualByDateAndType(date, type as 'morning' | 'evening');
      return ritual ? [{ ...ritual.data, type: ritual.type, date: ritual.date }] : [];
    },

    create: async (data: any) => {
      const { type, date, ...rest } = data;

      // Always save to IndexedDB first
      await offlineDB.saveRitual(type, date, rest, isOnline());

      if (isOnline()) {
        try {
          const result = await this.request('/logs', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          // Mark as synced
          await offlineDB.markRitualSynced(`${date}_${type}`);
          return result;
        } catch {
          // Already saved to IndexedDB, will sync later
          return data;
        }
      }

      // Offline: already saved to IndexedDB
      return data;
    },
  };

  // Ritual status check (offline-first)
  rituals = {
    checkStatus: async (type: 'morning' | 'evening' | 'weeklyStart' | 'weeklyReview', date: string) => {
      // First check IndexedDB for immediate response
      const localRitual = await offlineDB.getRitualByDateAndType(date, type as 'morning' | 'evening');
      if (localRitual) return true;

      // Then check server if online
      if (isOnline()) {
        try {
          const logs = await this.request<any[]>(`/logs?type=${type}&date=${date}`);
          return logs.length > 0;
        } catch {
          return false;
        }
      }
      return false;
    },

    getTodayStatus: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Check IndexedDB first
      const [localMorning, localEvening] = await Promise.all([
        offlineDB.getRitualByDateAndType(today, 'morning'),
        offlineDB.getRitualByDateAndType(today, 'evening'),
      ]);

      // If we have local data, return it immediately
      const localStatus = {
        morning: !!localMorning,
        evening: !!localEvening,
      };

      // If offline, return local status
      if (!isOnline()) {
        return localStatus;
      }

      // If online, also check server
      try {
        const [serverMorning, serverEvening] = await Promise.all([
          this.request<any[]>(`/logs?type=morning&date=${today}`).catch(() => []),
          this.request<any[]>(`/logs?type=evening&date=${today}`).catch(() => []),
        ]);
        return {
          morning: localStatus.morning || serverMorning.length > 0,
          evening: localStatus.evening || serverEvening.length > 0,
        };
      } catch {
        return localStatus;
      }
    },
  };

  // Weekly Reviews
  weeklyReviews = {
    create: (data: any) => this.request('/weekly-reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  };

  // Focus Sessions
  focus = {
    getAll: () => this.request('/focus'),
    create: (data: any) => this.request('/focus', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getByDate: (date: string) => this.request(`/focus?date=${date}`),
    update: (id: string, data: any) => this.request(`/focus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  };

  // Alias for backwards compatibility
  focusSessions = this.focus;

  // Wins (offline-first)
  wins = {
    getAll: async (params?: {
      category?: string;
      startDate?: string;
      endDate?: string;
      impactLevel?: number;
      search?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const queryString = queryParams.toString();

      if (isOnline()) {
        try {
          const result = await this.request<any[]>(
            `/wins${queryString ? `?${queryString}` : ''}`
          );
          // Cache in IndexedDB
          for (const win of result) {
            await offlineDB.saveWin(win.id, win, true);
          }
          return result;
        } catch {
          const cached = await offlineDB.getWins();
          return cached.map(w => w.data);
        }
      }

      const cached = await offlineDB.getWins();
      return cached.map(w => w.data);
    },

    getById: async (id: number) => {
      if (isOnline()) {
        try {
          const result = await this.request<any>(`/wins/${id}`);
          await offlineDB.saveWin(id, result, true);
          return result;
        } catch {
          const cached = await offlineDB.get<StoredWin>(STORES.WINS, id);
          return cached?.data;
        }
      }
      const cached = await offlineDB.get<StoredWin>(STORES.WINS, id);
      return cached?.data;
    },

    create: async (data: any) => {
      const tempId = `temp_${Date.now()}`;

      // Save to IndexedDB first
      await offlineDB.saveWin(tempId, { ...data, id: tempId }, false);

      if (isOnline()) {
        try {
          const result = await this.request<any>('/wins', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          // Update with real ID
          await offlineDB.delete(STORES.WINS, tempId);
          await offlineDB.saveWin(result.id, result, true);
          return result;
        } catch {
          await queueForSync('create', STORES.WINS, tempId, data);
          return { ...data, id: tempId };
        }
      }

      await queueForSync('create', STORES.WINS, tempId, data);
      return { ...data, id: tempId };
    },

    update: async (id: number, data: Partial<any>) => {
      // Update in IndexedDB
      const existing = await offlineDB.get<StoredWin>(STORES.WINS, id);
      const updated = { ...(existing?.data || {}), ...data, id };
      await offlineDB.saveWin(id, updated, false);

      if (isOnline()) {
        try {
          const result = await this.request<any>(`/wins/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          });
          await offlineDB.saveWin(id, result, true);
          return result;
        } catch {
          await queueForSync('update', STORES.WINS, id, data);
          return updated;
        }
      }

      await queueForSync('update', STORES.WINS, id, data);
      return updated;
    },

    delete: async (id: number) => {
      // Delete from IndexedDB
      await offlineDB.delete(STORES.WINS, id);

      if (isOnline()) {
        try {
          return await this.request<{ message: string }>(`/wins/${id}`, {
            method: 'DELETE',
          });
        } catch {
          await queueForSync('delete', STORES.WINS, id, {});
          return { message: 'Deleted offline' };
        }
      }

      await queueForSync('delete', STORES.WINS, id, {});
      return { message: 'Deleted offline' };
    },
  };
}

export const api = new ApiClient();