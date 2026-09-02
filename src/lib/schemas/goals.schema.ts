import { z } from 'zod';

// RPM-model (Result, Purpose, Massive Action) — het model dat de goals-pagina al gebruikt.
// `data` in de `goals`-tabel is jsonb, dus dit schema bepaalt de vorm, niet de kolommen.

// "Massive Action" met voltooiing + 80/20-hefboommarkering (Fase 3) — zie src/lib/goal-actions.ts.
// Ook oude, kale strings toestaan zodat bestaande clients/scripts die nog steeds `string[]`
// versturen niet meteen op een 400 stuiten; normalizeNextActions() maakt er op de GET-route
// en bij het aanmaken altijd de objectvorm van.
const nextActionSchema = z.union([
  z.string(),
  z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
    leverage: z.boolean(),
  }),
]);

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  why: z.string().optional(),
  painIfNot: z.string().optional(),
  pleasureIfDone: z.string().optional(),
  nextActions: z.array(nextActionSchema).optional(),
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
  nextActions: z.array(nextActionSchema).optional(),
  deadline: z.string().optional(),
  category: z.enum(['business', 'health', 'relationships', 'personal']).optional(),
  completed: z.boolean().optional(),
  progress: z.number().min(0).max(100).optional(),
  isRock: z.boolean().optional(),
  quarter: z.string().optional(),
});
