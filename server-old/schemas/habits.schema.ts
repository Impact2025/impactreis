import { z } from 'zod';

export const createHabitSchema = z.object({
  name: z.string().min(1, 'Habit name is required').max(100, 'Name too long'),
  streak: z.number().int().min(0).default(0),
});

export const updateHabitSchema = z.object({
  streak: z.number().int().min(0).optional(),
  lastCompleted: z.string().optional(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
