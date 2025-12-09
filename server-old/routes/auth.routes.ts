import express from 'express';
import bcrypt from 'bcrypt';
import { sql } from '../db';
import { validate } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../middleware/error.middleware';
import { generateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Register
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check if user exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUsers.length > 0) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hashedPassword})
      RETURNING id, email, created_at
    `;

    const user = result[0];

    // Generate JWT
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      token,
    });
  })
);

// Login
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const users = await sql`
      SELECT id, email, password_hash, created_at
      FROM users
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT
    const token = generateToken(user.id, user.email);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      token,
    });
  })
);

export default router;
