import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { neon } from '@neondatabase/serverless';

const app = express();
const port = process.env.PORT || 3001;

// Neon database connection
const sql = neon(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());

// --- AUTH ENDPOINTS ---

// Register
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await sql`INSERT INTO users (email, password_hash) VALUES (${email}, ${hashedPassword}) RETURNING id, email`;
    res.json({ user: result[0] });
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- API Routes ---

// Habits
app.get('/api/habits/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const habits = await sql`SELECT * FROM habits WHERE user_id = ${userId}`;
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/habits/:userId', async (req, res) => {
  const { userId } = req.params;
  const { name, streak } = req.body;
  try {
    const result = await sql`INSERT INTO habits (user_id, name, streak) VALUES (${userId}, ${name}, ${streak}) RETURNING *`;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/habits/:habitId', async (req, res) => {
  const { habitId } = req.params;
  const { streak, lastCompleted } = req.body;
  try {
    const result = await sql`UPDATE habits SET streak = ${streak}, last_completed = ${lastCompleted} WHERE id = ${habitId} RETURNING *`;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Daily Logs
app.get('/api/logs/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const logs = await sql`SELECT * FROM daily_logs WHERE user_id = ${userId} ORDER BY timestamp DESC LIMIT 50`;
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logs/:userId', async (req, res) => {
  const { userId } = req.params;
  const { type, dateString, ...data } = req.body;
  try {
    const result = await sql`INSERT INTO daily_logs (user_id, type, date_string, data, timestamp) VALUES (${userId}, ${type}, ${dateString}, ${JSON.stringify(data)}, NOW()) RETURNING *`;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Goals
app.get('/api/goals/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const goals = await sql`SELECT bhag, yearly_goals, monthly_goals FROM goals WHERE user_id = ${userId} AND id = 'current'`;
    res.json(goals[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/goals/:userId', async (req, res) => {
  const { userId } = req.params;
  const { bhag, yearlyGoals, monthlyGoals } = req.body;
  try {
    await sql`INSERT INTO goals (user_id, id, bhag, yearly_goals, monthly_goals, updated_at) VALUES (${userId}, 'current', ${bhag}, ${JSON.stringify(yearlyGoals)}, ${JSON.stringify(monthlyGoals)}, NOW()) ON CONFLICT (user_id, id) DO UPDATE SET bhag = EXCLUDED.bhag, yearly_goals = EXCLUDED.yearly_goals, monthly_goals = EXCLUDED.monthly_goals, updated_at = NOW()`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Weekly Goals
app.get('/api/weekly-goals/:userId/:weekNumber', async (req, res) => {
  const { userId, weekNumber } = req.params;
  try {
    const weeklyGoals = await sql`SELECT * FROM weekly_goals WHERE user_id = ${userId} AND week_number = ${weekNumber}`;
    res.json(weeklyGoals[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/weekly-goals/:userId', async (req, res) => {
  const { userId } = req.params;
  const { weekNumber, goals } = req.body;
  try {
    const result = await sql`INSERT INTO weekly_goals (user_id, week_number, goals) VALUES (${userId}, ${weekNumber}, ${JSON.stringify(goals)}) RETURNING *`;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/weekly-goals/:weeklyGoalId', async (req, res) => {
  const { weeklyGoalId } = req.params;
  const { goals, status } = req.body;
  try {
    const result = await sql`UPDATE weekly_goals SET goals = ${JSON.stringify(goals)}, status = ${status}, updated_at = NOW() WHERE id = ${weeklyGoalId} RETURNING *`;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Focus Sessions
app.get('/api/focus-sessions/:userId/:date', async (req, res) => {
  const { userId, date } = req.params;
  try {
    const sessions = await sql`SELECT * FROM focus_sessions WHERE user_id = ${userId} AND date = ${date}`;
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/focus-sessions/:userId', async (req, res) => {
  const { userId } = req.params;
  const { date, startTime, goal } = req.body;
  try {
    const result = await sql`INSERT INTO focus_sessions (user_id, date, start_time, goal) VALUES (${userId}, ${date}, ${startTime}, ${goal}) RETURNING *`;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/focus-sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { completed } = req.body;
  try {
    const result = await sql`UPDATE focus_sessions SET completed = ${completed} WHERE id = ${sessionId} RETURNING *`;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Weekly Reviews
app.post('/api/weekly-reviews/:userId', async (req, res) => {
  const { userId } = req.params;
  const { weekNumber, ...data } = req.body;
  try {
    const result = await sql`INSERT INTO weekly_reviews (user_id, week_number, data, timestamp) VALUES (${userId}, ${weekNumber}, ${JSON.stringify(data)}, NOW()) RETURNING *`;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});