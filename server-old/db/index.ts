import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const sql = neon(process.env.DATABASE_URL);

// Database helper types
export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface Habit {
  id: number;
  user_id: number;
  name: string;
  streak: number;
  last_completed: string | null;
  created_at: Date;
}

export interface DailyLog {
  id: number;
  user_id: number;
  date: string;
  log_type: string;
  content: any;
  timestamp: Date;
}

export interface Goal {
  id: number;
  user_id: number;
  type: 'bhag' | 'yearly' | 'monthly' | 'weekly';
  title: string;
  period: string | null;
  completed: boolean;
  created_at: Date;
}

export interface WeeklyReview {
  id: number;
  user_id: number;
  week: string;
  reflection: any;
  created_at: Date;
}

export interface FocusSession {
  id: number;
  user_id: number;
  date: string;
  goal: string;
  completed: boolean;
  created_at: Date;
}
