import express from 'express';
import { sql } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createGoalSchema, updateGoalSchema } from '../schemas/goals.schema';
import { asyncHandler } from '../middleware/error.middleware';

const router = express.Router();
router.use(authenticateToken);

// Get goals by type
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { type, period } = req.query;

    let goals;
    if (period) {
      goals = await sql`
        SELECT * FROM goals
        WHERE user_id = ${req.userId}
          AND type = ${type}
          AND period = ${period}
        ORDER BY created_at DESC
      `;
    } else if (type) {
      goals = await sql`
        SELECT * FROM goals
        WHERE user_id = ${req.userId}
          AND type = ${type}
        ORDER BY created_at DESC
      `;
    } else {
      goals = await sql`
        SELECT * FROM goals
        WHERE user_id = ${req.userId}
        ORDER BY created_at DESC
      `;
    }

    res.json(goals);
  })
);

// Create goal
router.post(
  '/',
  validate(createGoalSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { type, title, period, completed } = req.body;

    const result = await sql`
      INSERT INTO goals (user_id, type, title, period, completed)
      VALUES (${req.userId}, ${type}, ${title}, ${period || null}, ${completed || false})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  })
);

// Update goal
router.put(
  '/:id',
  validate(updateGoalSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { title, completed } = req.body;

    const result = await sql`
      UPDATE goals
      SET
        title = COALESCE(${title}, title),
        completed = COALESCE(${completed}, completed)
      WHERE id = ${id} AND user_id = ${req.userId}
      RETURNING *
    `;

    if (result.length === 0) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.json(result[0]);
  })
);

// Delete goal
router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM goals
      WHERE id = ${id} AND user_id = ${req.userId}
      RETURNING id
    `;

    if (result.length === 0) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.json({ success: true, id: result[0].id });
  })
);

export default router;
