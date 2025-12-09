import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

export const useHabits = () => {
  return useQuery({
    queryKey: queryKeys.habits,
    queryFn: () => api.habits.getAll(),
  });
};

export const useCreateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, streak }: { name: string; streak?: number }) =>
      api.habits.create({ name, streak }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
    },
  });
};

export const useUpdateHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { streak?: number; lastCompleted?: string } }) =>
      api.habits.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
    },
  });
};

export const useDeleteHabit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.habits.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits });
    },
  });
};
