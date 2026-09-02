import { z } from 'zod';

// RPM-model (Result, Purpose, Massive Action) — het model dat de goals-pagina al gebruikt.
// `data` in de `goals`-tabel is jsonb, dus dit schema bepaalt de vorm, niet de kolommen.
export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  why: z.string().optional(),
  painIfNot: z.string().optional(),
  pleasureIfDone: z.string().optional(),
  nextActions: z.array(z.string()).optional(),
  deadline: z.string().optional(),
  category: z.enum(['business', 'health', 'relationships', 'personal']).optional(),
  isRock: z.boolean().optional(),
  quarter: z.string().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  why: z.string().optional(),
  painIfNot: z.string().optional(),
  pleasureIfDone: z.string().optional(),
  nextActions: z.array(z.string()).optional(),
  deadline: z.string().optional(),
  category: z.enum(['business', 'health', 'relationships', 'personal']).optional(),
  completed: z.boolean().optional(),
  progress: z.number().min(0).max(100).optional(),
  isRock: z.boolean().optional(),
  quarter: z.string().optional(),
});
