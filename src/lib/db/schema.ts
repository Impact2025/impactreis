// Drizzle-schema — spiegelt schema.sql, plus de multi-tenant laag (organizations + organization_id).
//
// Bestaande tabellen migreren additief: organization_id is nullable totdat de backfill-migratie
// (migrations/0001_multi_tenant_foundation.sql) draait en alle rijen een organisatie hebben.
// Pas daarna wordt de kolom NOT NULL gezet en RLS aangezet — zie MULTI_TENANT_MIGRATION.md.
import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  date,
  time,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('starter'), // starter | pro | incubator
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // nullable: Auth.js magic-link users hebben geen wachtwoord
  role: text('role').notNull().default('member'), // member | owner | program_manager
  createdAt: timestamp('created_at').defaultNow(),
});

export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  streak: integer('streak').default(0),
  lastCompleted: date('last_completed'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  userIdx: index('idx_habits_user_id').on(t.userId),
}));

export const dailyLogs = pgTable('daily_logs', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  type: text('type').notNull(), // 'morning' | 'evening'
  dateString: text('date_string').notNull(),
  data: jsonb('data'),
  timestamp: timestamp('timestamp').defaultNow(),
}, (t) => ({
  userIdx: index('idx_daily_logs_user_id').on(t.userId),
  tsIdx: index('idx_daily_logs_timestamp').on(t.timestamp),
}));

// LET OP: dit spiegelt de ECHTE productiekolommen, niet schema.sql — die twee zijn uiteengelopen
// (schema.sql beschrijft bhag/yearly_goals/monthly_goals, wat nooit is toegepast). Bovendien
// verwacht src/app/api/goals/route.ts weer een DERDE vorm (type/title/period/completed), die
// evenmin bestaat in de live tabel — die route lijkt al kapot, los van dit werk. Zie
// MULTI_TENANT_MIGRATION.md voor een aantekening; niet in deze migratie opgelost.
export const goals = pgTable('goals', {
  userId: text('user_id').notNull(),
  id: text('id').notNull(),
  organizationId: integer('organization_id').references(() => organizations.id),
  data: jsonb('data'),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  pk: uniqueIndex('goals_pk').on(t.userId, t.id),
}));

export const weeklyGoals = pgTable('weekly_goals', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  weekNumber: text('week_number').notNull(),
  goals: jsonb('goals'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const weeklyReviews = pgTable('weekly_reviews', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  weekNumber: text('week_number').notNull(),
  data: jsonb('data'),
  timestamp: timestamp('timestamp').defaultNow(),
}, (t) => ({
  userIdx: index('idx_weekly_reviews_user_id').on(t.userId),
}));

export const focusSessions = pgTable('focus_sessions', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  goal: text('goal'),
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const wins = pgTable('wins', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  impactLevel: integer('impact_level').default(1),
  date: date('date').notNull(),
  tags: jsonb('tags'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  userIdx: index('idx_wins_user_id').on(t.userId),
  dateIdx: index('idx_wins_date').on(t.date),
}));

export const userContext = pgTable('user_context', {
  userId: text('user_id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  currentEnergyLevel: integer('current_energy_level').default(5),
  currentStressLevel: integer('current_stress_level').default(5),
  recentMood: text('recent_mood').default('neutral'),
  lastMajorWinDate: date('last_major_win_date'),
  currentFocusArea: text('current_focus_area'),
  coachingStyle: text('coaching_style').default('balanced'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// --- Sparringpartner (coach) ---

export const coachLessons = pgTable('coach_lessons', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  patternKey: text('pattern_key').notNull(),
  technique: text('technique').notNull(),
  insight: text('insight').notNull(),
  confidence: real('confidence').default(0.5),
  timesConfirmed: integer('times_confirmed').default(0),
  timesDisproven: integer('times_disproven').default(0),
  active: boolean('active').default(true),
  source: text('source'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  userPattern: uniqueIndex('coach_lessons_user_pattern').on(t.userId, t.patternKey),
  userActiveIdx: index('idx_coach_lessons_user').on(t.userId, t.active),
}));

export const energyLog = pgTable('energy_log', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  dateString: text('date_string').notNull(),
  activity: text('activity').notNull(),
  category: text('category'),
  direction: text('direction').notNull(), // 'gain' | 'cost'
  source: text('source').default('ritueel'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  userDateIdx: index('idx_energy_log_user_date').on(t.userId, t.dateString),
}));

export const coachPredictions = pgTable('coach_predictions', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  lessonId: integer('lesson_id').references(() => coachLessons.id, { onDelete: 'set null' }),
  statement: text('statement').notNull(),
  metric: text('metric').notNull(),
  baseline: real('baseline').notNull(),
  direction: text('direction').notNull(), // 'up' | 'down' | 'stable'
  horizonDays: integer('horizon_days').notNull().default(7),
  dueDate: date('due_date').notNull(),
  outcome: text('outcome'), // null | 'correct' | 'incorrect' | 'unclear'
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  dueIdx: index('idx_coach_predictions_due').on(t.userId, t.dueDate),
}));

// --- Auth.js adaptertabellen ---
//
// Bewust GESCHEIDEN van de bestaande `users`-tabel (die heeft een integer id en geen
// emailVerified/name/image — precies wat DrizzleAdapter's standaardschema vereist als
// string/UUID id). Gekoppeld via e-mailadres, niet via een gedeelde primary key.
// Zie MULTI_TENANT_MIGRATION.md stap 2.

export const authUsers = pgTable('auth_users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
});

export const authAccounts = pgTable('auth_accounts', {
  userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (t) => ({
  pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
}));

export const authSessions = pgTable('auth_sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const authVerificationTokens = pgTable('auth_verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.identifier, t.token] }),
}));
