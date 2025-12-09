import express from 'express';
import { sql } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = express.Router();
router.use(authenticateToken);

// Get weekly reviews
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { week } = req.query;

    let reviews;
    if (week) {
      reviews = await sql`
        SELECT * FROM weekly_reviews
        WHERE user_id = ${req.userId}
          AND week = ${week}
        ORDER BY created_at DESC
        LIMIT 1
      `;
    } else {
      reviews = await sql`
        SELECT * FROM weekly_reviews
        WHERE user_id = ${req.userId}
        ORDER BY created_at DESC
        LIMIT 10
      `;
    }

    res.json(reviews);
  })
);

// Create or update weekly review
router.post(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    const { week, reflection } = req.body;

    // Check if review exists for this week
    const existing = await sql`
      SELECT id FROM weekly_reviews
      WHERE user_id = ${req.userId} AND week = ${week}
    `;

    let result;
    if (existing.length > 0) {
      // Update existing
      result = await sql`
        UPDATE weekly_reviews
        SET reflection = ${JSON.stringify(reflection)}
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
    } else {
      // Create new
      result = await sql`
        INSERT INTO weekly_reviews (user_id, week, reflection)
        VALUES (${req.userId}, ${week}, ${JSON.stringify(reflection)})
        RETURNING *
      `;
    }

    res.json(result[0]);
  })
);

export default router;
