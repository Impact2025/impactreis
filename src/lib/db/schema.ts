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
  varchar,
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
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // nullable: Auth.js magic-link users hebben geen wachtwoord
  role: text('role').notNull().default('member'), // member | owner | program_manager
  createdAt: timestamp('created_at').defaultNow(),
});

// Machine-to-machine auth voor externe systemen (vandaag: ImpactOS' coach-bridge) — één token
// per organisatie, i.p.v. het vroegere enkele gedeelde COACH_BRIDGE_TOKEN dat altijd naar de
// eerste gebruiker in de hele tabel resolvede (loadSingleUserId, nu vervangen). Zie
// src/lib/coach.ts:resolveBridgeOrganization().
export const clientBridgeTokens = pgTable('client_bridge_tokens', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  label: text('label').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
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
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
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
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  data: jsonb('data'),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  pk: uniqueIndex('goals_pk').on(t.userId, t.id),
}));

// Identiteits-oefening ("Ik ben iemand die...") — singleton per user, zelfde vorm als
// userContext: twee jsonb-arrays die altijd in hun geheel gelezen/geschreven worden, dus geen
// aparte item-tabel nodig. Vervangt de vroegere localStorage-only opslag in identity/page.tsx.
export const identityProfiles = pgTable('identity_profiles', {
  userId: text('user_id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  statements: jsonb('statements').notNull().default('[]'),
  proofs: jsonb('proofs').notNull().default('[]'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const weeklyGoals = pgTable('weekly_goals', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  userId: text('user_id').notNull(),
  weekNumber: text('week_number').notNull(),
  goals: jsonb('goals'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const weeklyReviews = pgTable('weekly_reviews', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  userId: text('user_id').notNull(),
  weekNumber: text('week_number').notNull(),
  data: jsonb('data'),
  timestamp: timestamp('timestamp').defaultNow(),
}, (t) => ({
  userIdx: index('idx_weekly_reviews_user_id').on(t.userId),
}));

export const focusSessions = pgTable('focus_sessions', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  userId: text('user_id').notNull(),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  goal: text('goal'),
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  // Additief toegevoegd zodat de focus-pagina (Pomodoro-timer) echte sessies opslaat i.p.v.
  // alleen localStorage — zie de ochtend/avond/week-integratie-doc.
  durationMinutes: integer('duration_minutes'),
  completedAt: timestamp('completed_at'),
  energyBefore: integer('energy_before'),
  energyAfter: integer('energy_after'),
  sessionType: text('session_type').default('work'), // 'work' | 'break'
});

export const wins = pgTable('wins', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
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
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
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
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
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
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
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
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
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

// Voorstellen voor agenda-tijdblokken (bv. hersteltijd na een drukke dag) die de coach aanmaakt,
// maar die pas als echte Google Calendar-afspraak worden geschreven ná expliciete goedkeuring
// door de gebruiker — zie src/lib/google-calendar.ts:createEvent(). Bewust géén auto-write:
// dit is de human-review-gate die het zusterproject ImpactOS al kent (calendar_proposals).
export const calendarProposals = pgTable('calendar_proposals', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  userId: text('user_id').notNull(),
  summary: text('summary').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  reason: text('reason'),
  source: text('source').notNull().default('coach'), // 'coach' | 'manual'
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp('created_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
}, (t) => ({
  userStatusIdx: index('idx_calendar_proposals_user_status').on(t.userId, t.status),
}));

// De AIPA-intake: één gesprek i.p.v. een statisch registratieformulier, dat het hele
// UserOnboardingProfile als JSONB opslaat (zelfde stijl als goals/daily_logs — één blob i.p.v.
// alle geneste velden normaliseren). RAG-embeddings (pgvector) zijn hier bewust NIET
// meegenomen — dat is losstaande infrastructuur, geen onderdeel van deze intake-opslag.
export const onboardingProfiles = pgTable('onboarding_profiles', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  completed: boolean('completed').notNull().default(false),
  profile: jsonb('profile'), // UserOnboardingProfile, zie src/lib/onboarding.ts — pas gevuld na fase 5
  conversation: jsonb('conversation'), // ruwe messages-array, tussentijds bewaard zodat een refresh kan hervatten
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// --- E-mail-levenscyclus ---
//
// Eén rij per user (lazy aangemaakt bij registratie, backfilled voor bestaande users door de
// migratie). unsubscribeToken is één token per user voor alle categorieën — one-click
// afmelden hoeft niet ingelogd te zijn, vandaar een ongokbaar random token i.p.v. de user id.
export const emailPreferences = pgTable('email_preferences', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  unsubscribeToken: text('unsubscribe_token').notNull().unique(),
  morningMotivation: boolean('morning_motivation').notNull().default(true),
  morningReminder: boolean('morning_reminder').notNull().default(true),
  weeklyReport: boolean('weekly_report').notNull().default(true),
  streakCelebration: boolean('streak_celebration').notNull().default(true),
  onboardingNudge: boolean('onboarding_nudge').notNull().default(true),
  winback: boolean('winback').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Verzendlog: dedup ("al vandaag verstuurd?"), winback-stadia ("stadium 10 al ooit verstuurd?")
// en toekomstige analytics — zie src/lib/email-recipients.ts.
export const emailSends = pgTable('email_sends', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  emailType: text('email_type').notNull(),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  meta: jsonb('meta'),
}, (t) => ({
  userTypeIdx: index('idx_email_sends_user_type').on(t.userId, t.emailType, t.sentAt),
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

// --- Courses & Workbooks (Tony Robbins Unleashed) ---
//
// Ooit aangemaakt via het losse schema.sql/run-schema.js, buiten dit canonieke Drizzle-schema en
// zonder organization_id — zie migrations/manual/0008_courses_and_push_multitenant.sql. Bewuste
// scheiding: de cursuscatalogus (courses/modules/lessons/exercises) is gedeelde content, geen
// organisatie-eigendom; alleen de gebruikersvoortgang daaronder is organization-scoped.

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  imageUrl: text('image_url'),
  totalModules: integer('total_modules').default(0),
  totalLessons: integer('total_lessons').default(0),
  estimatedWeeks: integer('estimated_weeks').default(12),
  difficulty: text('difficulty').default('intermediate'),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const courseModules = pgTable('course_modules', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  weekStart: integer('week_start').default(1),
  weekEnd: integer('week_end').default(2),
  orderIndex: integer('order_index').notNull(),
  icon: text('icon'),
  color: text('color').default('blue'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  courseSlug: uniqueIndex('course_modules_course_slug').on(t.courseId, t.slug),
  courseIdx: index('idx_course_modules_course').on(t.courseId),
}));

export const courseLessons = pgTable('course_lessons', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => courseModules.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  lessonType: text('lesson_type').default('theory'),
  content: jsonb('content').notNull(),
  videoUrl: text('video_url'),
  audioUrl: text('audio_url'),
  estimatedMinutes: integer('estimated_minutes').default(15),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  moduleSlug: uniqueIndex('course_lessons_module_slug').on(t.moduleId, t.slug),
  moduleIdx: index('idx_course_lessons_module').on(t.moduleId),
}));

export const courseExercises = pgTable('course_exercises', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => courseLessons.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  exerciseType: text('exercise_type').notNull(),
  config: jsonb('config'),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const courseEnrollments = pgTable('course_enrollments', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  currentModuleId: integer('current_module_id').references(() => courseModules.id),
  currentLessonId: integer('current_lesson_id').references(() => courseLessons.id),
  status: text('status').default('active'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  lastActivityAt: timestamp('last_activity_at').defaultNow(),
}, (t) => ({
  userCourse: uniqueIndex('course_enrollments_user_course').on(t.userId, t.courseId),
  userIdx: index('idx_course_enrollments_user').on(t.userId),
}));

export const lessonCompletions = pgTable('lesson_completions', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  lessonId: integer('lesson_id').references(() => courseLessons.id, { onDelete: 'cascade' }),
  timeSpentMinutes: integer('time_spent_minutes').default(0),
  completedAt: timestamp('completed_at').defaultNow(),
}, (t) => ({
  userLesson: uniqueIndex('lesson_completions_user_lesson').on(t.userId, t.lessonId),
  userIdx: index('idx_lesson_completions_user').on(t.userId),
}));

export const courseAnswers = pgTable('course_answers', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  lessonId: integer('lesson_id').references(() => courseLessons.id, { onDelete: 'cascade' }),
  questionKey: text('question_key').notNull(),
  answer: text('answer'),
  answeredAt: timestamp('answered_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  userLessonQuestion: uniqueIndex('course_answers_user_lesson_question').on(t.userId, t.lessonId, t.questionKey),
  userIdx: index('idx_course_answers_user').on(t.userId),
}));

export const exerciseCompletions = pgTable('exercise_completions', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  exerciseId: integer('exercise_id').references(() => courseExercises.id, { onDelete: 'cascade' }),
  exerciseType: text('exercise_type').notNull(),
  data: jsonb('data'),
  completedAt: timestamp('completed_at').defaultNow(),
});

export const dailyPracticeLog = pgTable('daily_practice_log', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  practiceType: text('practice_type').notNull(),
  date: date('date').notNull(),
  durationMinutes: integer('duration_minutes'),
  notes: text('notes'),
  completedAt: timestamp('completed_at').defaultNow(),
}, (t) => ({
  userTypeDate: uniqueIndex('daily_practice_log_user_type_date').on(t.userId, t.practiceType, t.date),
  userDateIdx: index('idx_daily_practice_user').on(t.userId, t.date),
}));

export const userAssessments = pgTable('user_assessments', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  assessmentType: text('assessment_type').notNull(),
  results: jsonb('results').notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
}, (t) => ({
  userIdx: index('idx_user_assessments_user').on(t.userId),
}));

export const courseAchievements = pgTable('course_achievements', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: text('user_id').notNull(),
  achievementKey: text('achievement_key').notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  unlockedAt: timestamp('unlocked_at').defaultNow(),
}, (t) => ({
  userAchievement: uniqueIndex('course_achievements_user_achievement').on(t.userId, t.achievementKey),
}));

// --- Push-notificaties ---
//
// Ooit aangemaakt via het losse create-push-tables.js, buiten dit canonieke Drizzle-schema en
// zonder organization_id — zie migrations/manual/0008_courses_and_push_multitenant.sql.
// notificationPreferences en scheduledNotifications zijn bevestigd ongebruikt (geen route leest/
// schrijft ze) — voor consistentie wél in het schema opgenomen, niet verwijderd.

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  userIdx: index('idx_push_subscriptions_user_id').on(t.userId),
}));

export const notificationPreferences = pgTable('notification_preferences', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  morningRitual: boolean('morning_ritual').default(true),
  eveningRitual: boolean('evening_ritual').default(true),
  weeklyReview: boolean('weekly_review').default(true),
  streakReminders: boolean('streak_reminders').default(true),
  morningTime: time('morning_time').default('07:00'),
  eveningTime: time('evening_time').default('21:00'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const scheduledNotifications = pgTable('scheduled_notifications', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id').references(() => organizations.id),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  scheduledForIdx: index('idx_scheduled_notifications_scheduled_for').on(t.scheduledFor, t.status),
}));
