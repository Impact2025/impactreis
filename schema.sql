-- Database schema for Mijn Ondernemers OS

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  streak INTEGER DEFAULT 0,
  last_completed DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily logs table
CREATE TABLE IF NOT EXISTS daily_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'morning' or 'evening'
  date_string TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  user_id TEXT NOT NULL,
  id TEXT NOT NULL, -- 'current'
  bhag TEXT,
  yearly_goals JSONB, -- array of yearly goals
  monthly_goals JSONB, -- array of monthly goals
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- Weekly goals table
CREATE TABLE IF NOT EXISTS weekly_goals (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  week_number TEXT NOT NULL,
  goals JSONB, -- array of weekly goals with status
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Weekly reviews table
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  week_number TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Focus sessions table
CREATE TABLE IF NOT EXISTS focus_sessions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  goal TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Wins/Achievements table (Wall of Wins / Cookie Jar)
CREATE TABLE IF NOT EXISTS wins (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'business', 'personal', 'health', 'learning'
  impact_level INTEGER DEFAULT 1, -- 1-5 (hoe belangrijk was deze win)
  date DATE NOT NULL,
  tags JSONB, -- array of tags
  created_at TIMESTAMP DEFAULT NOW()
);

-- User context table (voor Quantum Leap Coach)
CREATE TABLE IF NOT EXISTS user_context (
  user_id TEXT PRIMARY KEY,
  current_energy_level INTEGER DEFAULT 5, -- 1-10
  current_stress_level INTEGER DEFAULT 5, -- 1-10
  recent_mood TEXT DEFAULT 'neutral', -- 'energized', 'stressed', 'focused', 'overwhelmed', 'neutral'
  last_major_win_date DATE,
  current_focus_area TEXT, -- 'growth', 'consolidation', 'recovery'
  coaching_style TEXT DEFAULT 'balanced', -- 'tough_love', 'supportive', 'balanced'
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_timestamp ON daily_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_id ON weekly_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_wins_user_id ON wins(user_id);
CREATE INDEX IF NOT EXISTS idx_wins_date ON wins(date DESC);