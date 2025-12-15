export interface User {
  id: number;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Habit {
  id: number;
  user_id: number;
  name: string;
  streak: number;
  last_completed: string | null;
  created_at: string;
}

export interface DailyLog {
  id: number;
  user_id: number;
  date: string;
  log_type: string;
  content: any;
  timestamp: string;
}

export interface Goal {
  id: number;
  user_id: number;
  type: 'bhag' | 'yearly' | 'monthly' | 'weekly';
  title: string;
  period: string | null;
  completed: boolean;
  created_at: string;
}

export interface WeeklyReview {
  id: number;
  user_id: number;
  week: string;
  reflection: any;
  created_at: string;
}

export interface FocusSession {
  id: number;
  user_id: number;
  date: string;
  goal: string;
  completed: boolean;
  created_at: string;
}

export interface MorningWizardState {
  step: number;
  wakeTime: string;
  sleepQuality: number;
  energy: number;
  stress: number;
  activation: {
    exercise: boolean;
    meditation: boolean;
    reading: boolean;
    coldShower: boolean;
  };
  deepDive: string;
  mit: string;
  mitSuccess: string;
}

export interface EveningWizardState {
  step: number;
  dayRating: number;
  brainDump: string;
  gratitude: string[];
  tomorrowFocus: string;
}

export type ViewType =
  | 'home'
  | 'goals'
  | 'weekly'
  | 'insights'
  | 'library'
  | 'settings';

export interface Book {
  title: string;
  author: string;
  tagline?: string;
  category: string;
  coachTip: string;
}

export interface Win {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  category: 'business' | 'personal' | 'health' | 'learning';
  impact_level: 1 | 2 | 3 | 4 | 5;
  date: string;
  tags?: string[];
  created_at: string;
}

export interface CreateWinData {
  title: string;
  description?: string;
  category: 'business' | 'personal' | 'health' | 'learning';
  impactLevel: 1 | 2 | 3 | 4 | 5;
  date: string;
  tags?: string[];
}
