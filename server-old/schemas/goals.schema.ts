import { z } from 'zod';

export const createGoalSchema = z.object({
  type: z.enum(['bhag', 'yearly', 'monthly', 'weekly']),
  title: z.string().min(1, 'Goal title is required').max(500),
  period: z.string().optional(),
  completed: z.boolean().default(false),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
