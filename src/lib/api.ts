const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
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

  // Goals
  goals = {
    get: () => this.request('/goals'),
    getAll: (type?: string, period?: string) => {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (period) params.append('period', period);
      const queryString = params.toString();
      return this.request(`/goals${queryString ? `?${queryString}` : ''}`);
    },
    create: (data: any) => this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: any) => this.request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => this.request(`/goals/${id}`, {
      method: 'DELETE',
    }),
  };

  // Logs
  logs = {
    getAll: () => this.request('/logs'),
    create: (data: any) => this.request('/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
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

  // Wins
  wins = {
    getAll: (params?: {
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
      return this.request<any[]>(
        `/wins${queryString ? `?${queryString}` : ''}`
      );
    },

    getById: (id: number) =>
      this.request<any>(`/wins/${id}`),

    create: (data: any) =>
      this.request<any>('/wins', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: Partial<any>) =>
      this.request<any>(`/wins/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      this.request<{ message: string }>(`/wins/${id}`, {
        method: 'DELETE',
      }),
  };
}

export const api = new ApiClient();