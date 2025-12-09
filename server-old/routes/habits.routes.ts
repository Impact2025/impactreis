import express from 'express';
import { sql } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createHabitSchema, updateHabitSchema } from '../schemas/habits.schema';
import { asyncHandler } from '../middleware/error.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all habits for user
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const habits = await sql`
      SELECT * FROM habits
      WHERE user_id = ${req.userId}
      ORDER BY created_at DESC
    `;
    res.json(habits);
  })
);

// Create habit
router.post(
  '/',
  validate(createHabitSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { name, streak } = req.body;

    const result = await sql`
      INSERT INTO habits (user_id, name, streak)
      VALUES (${req.userId}, ${name}, ${streak || 0})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  })
);

// Update habit
router.put(
  '/:id',
  validate(updateHabitSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { streak, lastCompleted } = req.body;

    const result = await sql`
      UPDATE habits
      SET
        streak = COALESCE(${streak}, streak),
        last_completed = COALESCE(${lastCompleted}, last_completed)
      WHERE id = ${id} AND user_id = ${req.userId}
      RETURNING *
    `;

    if (result.length === 0) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    res.json(result[0]);
  })
);

// Delete habit
router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM habits
      WHERE id = ${id} AND user_id = ${req.userId}
      RETURNING id
    `;

    if (result.length === 0) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    res.json({ success: true, id: result[0].id });
  })
);

export default router;
