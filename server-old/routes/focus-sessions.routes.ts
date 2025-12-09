import express from 'express';
import { sql } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = express.Router();
router.use(authenticateToken);

// Get focus sessions
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { date, limit = 30 } = req.query;

    let sessions;
    if (date) {
      sessions = await sql`
        SELECT * FROM focus_sessions
        WHERE user_id = ${req.userId}
          AND date = ${date}
        ORDER BY created_at DESC
      `;
    } else {
      sessions = await sql`
        SELECT * FROM focus_sessions
        WHERE user_id = ${req.userId}
        ORDER BY created_at DESC
        LIMIT ${Number(limit)}
      `;
    }

    res.json(sessions);
  })
);

// Create focus session
router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { date, goal, completed = false } = req.body;

    const result = await sql`
      INSERT INTO focus_sessions (user_id, date, goal, completed)
      VALUES (${req.userId}, ${date}, ${goal}, ${completed})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  })
);

// Update focus session
router.put(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { completed } = req.body;

    const result = await sql`
      UPDATE focus_sessions
      SET completed = ${completed}
      WHERE id = ${id} AND user_id = ${req.userId}
      RETURNING *
    `;

    if (result.length === 0) {
      res.status(404).json({ error: 'Focus session not found' });
      return;
    }

    res.json(result[0]);
  })
);

export default router;
