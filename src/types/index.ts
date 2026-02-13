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

// =====================================================
// COURSES & WORKBOOKS TYPES
// =====================================================

export interface Course {
  id: number;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  total_modules: number;
  total_lessons: number;
  estimated_weeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_published: boolean;
  created_at: string;
  // Computed fields
  modules?: CourseModule[];
  progress?: CourseProgress;
}

export interface CourseModule {
  id: number;
  course_id: number;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  week_start: number;
  week_end: number;
  order_index: number;
  icon?: string;
  color: string;
  created_at: string;
  // Computed fields
  lessons?: CourseLesson[];
  completed_lessons?: number;
  total_lessons?: number;
  is_locked?: boolean;
  is_current?: boolean;
}

export interface CourseLesson {
  id: number;
  module_id: number;
  slug: string;
  title: string;
  subtitle?: string;
  lesson_type: 'theory' | 'exercise' | 'reflection' | 'assessment';
  content: LessonContent;
  video_url?: string;
  audio_url?: string;
  estimated_minutes: number;
  order_index: number;
  created_at: string;
  // Computed fields
  is_completed?: boolean;
  is_current?: boolean;
  exercises?: CourseExercise[];
}

export interface LessonContent {
  intro?: {
    quote?: string;
    quote_author?: string;
    text?: string;
  };
  sections?: LessonSection[];
  reflection_questions?: ReflectionQuestion[];
  exercises?: ExerciseConfig[];
  commitments?: string[];
  closing?: {
    quote?: string;
    quote_author?: string;
    next_steps?: string;
  };
}

export interface LessonSection {
  title?: string;
  type: 'text' | 'list' | 'quote' | 'callout' | 'image' | 'video';
  content: string;
  items?: string[];
  style?: 'info' | 'warning' | 'success' | 'tip';
}

export interface ReflectionQuestion {
  key: string;
  question: string;
  description?: string;
  type: 'text' | 'textarea' | 'scale' | 'multiple_choice' | 'checklist';
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface ExerciseConfig {
  type: 'breathing' | 'visualization' | 'journaling' | 'assessment' | 'timer' | 'checklist' | 'priming' | 'dickens' | 'wheel_of_life' | 'six_needs';
  title: string;
  description?: string;
  duration_minutes?: number;
  steps?: ExerciseStep[];
  config?: Record<string, unknown>;
}

export interface ExerciseStep {
  title: string;
  description?: string;
  duration_seconds?: number;
  audio_url?: string;
  type?: 'instruction' | 'breathing' | 'visualization' | 'action';
}

export interface CourseExercise {
  id: number;
  lesson_id: number;
  title: string;
  description?: string;
  exercise_type: string;
  config?: Record<string, unknown>;
  order_index: number;
  created_at: string;
}

export interface CourseProgress {
  enrollment_id: number;
  course_id: number;
  status: 'active' | 'paused' | 'completed';
  current_module_id?: number;
  current_lesson_id?: number;
  started_at: string;
  completed_at?: string;
  last_activity_at: string;
  // Computed
  completed_lessons: number;
  total_lessons: number;
  progress_percentage: number;
  current_streak: number;
}

export interface CourseEnrollment {
  id: number;
  user_id: string;
  course_id: number;
  current_module_id?: number;
  current_lesson_id?: number;
  status: 'active' | 'paused' | 'completed';
  started_at: string;
  completed_at?: string;
  last_activity_at: string;
}

export interface LessonCompletion {
  id: number;
  user_id: string;
  lesson_id: number;
  time_spent_minutes: number;
  completed_at: string;
}

export interface CourseAnswer {
  id: number;
  user_id: string;
  lesson_id: number;
  question_key: string;
  answer: string;
  answered_at: string;
  updated_at: string;
}

export interface DailyPractice {
  id: number;
  user_id: string;
  practice_type: 'priming' | 'gratitude' | 'state_check' | 'incantation';
  date: string;
  duration_minutes?: number;
  notes?: string;
  completed_at: string;
}

export interface UserAssessment {
  id: number;
  user_id: string;
  assessment_type: 'six_needs' | 'wheel_of_life' | 'values' | 'beliefs';
  results: Record<string, unknown>;
  completed_at: string;
}

export interface SixNeedsResults {
  certainty: number;
  variety: number;
  significance: number;
  connection: number;
  growth: number;
  contribution: number;
}

export interface WheelOfLifeResults {
  physical: number;
  emotional: number;
  relationships: number;
  financial: number;
  career: number;
  time: number;
  spiritual: number;
  contribution: number;
}

export interface CourseAchievement {
  id: number;
  user_id: string;
  achievement_key: string;
  course_id: number;
  unlocked_at: string;
}

export type AchievementKey =
  | 'first_lesson'
  | 'first_module'
  | 'state_master'
  | 'belief_breaker'
  | 'needs_navigator'
  | 'vision_architect'
  | 'fear_crusher'
  | 'priming_streak_7'
  | 'priming_streak_30'
  | 'course_complete'
  | 'unleashed';
