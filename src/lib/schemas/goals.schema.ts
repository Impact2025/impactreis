import { z } from 'zod';

export const createGoalSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  period: z.string().optional(),
  completed: z.boolean().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  completed: z.boolean().optional(),
});
