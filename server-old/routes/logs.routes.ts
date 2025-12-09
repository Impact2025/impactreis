import express from 'express';
import { sql } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = express.Router();
router.use(authenticateToken);

// Get logs
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { limit = 50, type, date } = req.query;

    let logs;
    if (date) {
      logs = await sql`
        SELECT * FROM daily_logs
        WHERE user_id = ${req.userId}
          AND date = ${date}
        ORDER BY timestamp DESC
        LIMIT ${Number(limit)}
      `;
    } else if (type) {
      logs = await sql`
        SELECT * FROM daily_logs
        WHERE user_id = ${req.userId}
          AND log_type = ${type}
        ORDER BY timestamp DESC
        LIMIT ${Number(limit)}
      `;
    } else {
      logs = await sql`
        SELECT * FROM daily_logs
        WHERE user_id = ${req.userId}
        ORDER BY timestamp DESC
        LIMIT ${Number(limit)}
      `;
    }

    res.json(logs);
  })
);

// Create log
router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { date, logType, content } = req.body;

    const result = await sql`
      INSERT INTO daily_logs (user_id, date, log_type, content)
      VALUES (${req.userId}, ${date}, ${logType}, ${JSON.stringify(content)})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  })
);

// Delete log
router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM daily_logs
      WHERE id = ${id} AND user_id = ${req.userId}
      RETURNING id
    `;

    if (result.length === 0) {
      res.status(404).json({ error: 'Log not found' });
      return;
    }

    res.json({ success: true, id: result[0].id });
  })
);

export default router;
