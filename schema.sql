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

-- =====================================================
-- COURSES & WORKBOOKS (Tony Robbins Unleashed)
-- =====================================================

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  total_modules INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  estimated_weeks INTEGER DEFAULT 12,
  difficulty TEXT DEFAULT 'intermediate', -- beginner, intermediate, advanced
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Modules within a course
CREATE TABLE IF NOT EXISTS course_modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  week_start INTEGER DEFAULT 1,
  week_end INTEGER DEFAULT 2,
  order_index INTEGER NOT NULL,
  icon TEXT, -- lucide icon name
  color TEXT DEFAULT 'blue', -- tailwind color
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, slug)
);

-- Lessons within a module
CREATE TABLE IF NOT EXISTS course_lessons (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES course_modules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  lesson_type TEXT DEFAULT 'theory', -- theory, exercise, reflection, assessment
  content JSONB NOT NULL, -- flexible content structure
  video_url TEXT,
  audio_url TEXT,
  estimated_minutes INTEGER DEFAULT 15,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module_id, slug)
);

-- Exercises and daily practices
CREATE TABLE IF NOT EXISTS course_exercises (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  exercise_type TEXT NOT NULL, -- breathing, visualization, journaling, assessment, timer, checklist
  config JSONB, -- exercise-specific configuration
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User course enrollment and progress
CREATE TABLE IF NOT EXISTS course_enrollments (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  current_module_id INTEGER REFERENCES course_modules(id),
  current_lesson_id INTEGER REFERENCES course_lessons(id),
  status TEXT DEFAULT 'active', -- active, paused, completed
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Lesson completions
CREATE TABLE IF NOT EXISTS lesson_completions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  lesson_id INTEGER REFERENCES course_lessons(id) ON DELETE CASCADE,
  time_spent_minutes INTEGER DEFAULT 0,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- User answers to reflection questions
CREATE TABLE IF NOT EXISTS course_answers (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  lesson_id INTEGER REFERENCES course_lessons(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL, -- identifies the question within the lesson
  answer TEXT,
  answered_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, lesson_id, question_key)
);

-- Exercise completions (for tracking daily exercises, priming, etc.)
CREATE TABLE IF NOT EXISTS exercise_completions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  exercise_id INTEGER REFERENCES course_exercises(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL,
  data JSONB, -- exercise results/notes
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Daily exercise streaks (for priming, gratitude, etc.)
CREATE TABLE IF NOT EXISTS daily_practice_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  practice_type TEXT NOT NULL, -- priming, gratitude, state_check, incantation
  date DATE NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, practice_type, date)
);

-- User assessments (Six Needs, Wheel of Life, etc.)
CREATE TABLE IF NOT EXISTS user_assessments (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  assessment_type TEXT NOT NULL, -- six_needs, wheel_of_life, values, beliefs
  results JSONB NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Course achievements/badges
CREATE TABLE IF NOT EXISTS course_achievements (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_key TEXT NOT NULL,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_timestamp ON daily_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_user_id ON weekly_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_wins_user_id ON wins(user_id);
CREATE INDEX IF NOT EXISTS idx_wins_date ON wins(date DESC);

-- Course indexes
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user ON lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_answers_user ON course_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_practice_user ON daily_practice_log(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_assessments_user ON user_assessments(user_id);