import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  habits: ['habits'] as const,
  goals: (type?: string, period?: string) =>
    ['goals', type, period].filter(Boolean),
  logs: (params?: { limit?: number; type?: string; date?: string }) =>
    ['logs', params],
  weeklyReviews: (week?: string) => ['weekly-reviews', week],
  focusSessions: (params?: { date?: string; limit?: number }) =>
    ['focus-sessions', params],
};
