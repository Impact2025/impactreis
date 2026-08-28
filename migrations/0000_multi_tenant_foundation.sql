CREATE TABLE "coach_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"user_id" text NOT NULL,
	"pattern_key" text NOT NULL,
	"technique" text NOT NULL,
	"insight" text NOT NULL,
	"confidence" real DEFAULT 0.5,
	"times_confirmed" integer DEFAULT 0,
	"times_disproven" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"source" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coach_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"user_id" text NOT NULL,
	"lesson_id" integer,
	"statement" text NOT NULL,
	"metric" text NOT NULL,
	"baseline" real NOT NULL,
	"direction" text NOT NULL,
	"horizon_days" integer DEFAULT 7 NOT NULL,
	"due_date" date NOT NULL,
	"outcome" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"date_string" text NOT NULL,
	"data" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "energy_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"user_id" text NOT NULL,
	"date_string" text NOT NULL,
	"activity" text NOT NULL,
	"category" text,
	"direction" text NOT NULL,
	"source" text DEFAULT 'ritueel',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "focus_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"goal" text,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"organization_id" integer,
	"bhag" text,
	"yearly_goals" jsonb,
	"monthly_goals" jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"streak" integer DEFAULT 0,
	"last_completed" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"plan" text DEFAULT 'starter' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_context" (
	"user_id" text PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"current_energy_level" integer DEFAULT 5,
	"current_stress_level" integer DEFAULT 5,
	"recent_mood" text DEFAULT 'neutral',
	"last_major_win_date" date,
	"current_focus_area" text,
	"coaching_style" text DEFAULT 'balanced',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"email" text NOT NULL,
	"password_hash" text,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weekly_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"user_id" text NOT NULL,
	"week_number" text NOT NULL,
	"goals" jsonb,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weekly_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"user_id" text NOT NULL,
	"week_number" text NOT NULL,
	"data" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wins" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"impact_level" integer DEFAULT 1,
	"date" date NOT NULL,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "coach_lessons" ADD CONSTRAINT "coach_lessons_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_predictions" ADD CONSTRAINT "coach_predictions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_predictions" ADD CONSTRAINT "coach_predictions_lesson_id_coach_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."coach_lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_logs" ADD CONSTRAINT "daily_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "energy_log" ADD CONSTRAINT "energy_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_context" ADD CONSTRAINT "user_context_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_goals" ADD CONSTRAINT "weekly_goals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wins" ADD CONSTRAINT "wins_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coach_lessons_user_pattern" ON "coach_lessons" USING btree ("user_id","pattern_key");--> statement-breakpoint
CREATE INDEX "idx_coach_lessons_user" ON "coach_lessons" USING btree ("user_id","active");--> statement-breakpoint
CREATE INDEX "idx_coach_predictions_due" ON "coach_predictions" USING btree ("user_id","due_date");--> statement-breakpoint
CREATE INDEX "idx_daily_logs_user_id" ON "daily_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_daily_logs_timestamp" ON "daily_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_energy_log_user_date" ON "energy_log" USING btree ("user_id","date_string");--> statement-breakpoint
CREATE UNIQUE INDEX "goals_pk" ON "goals" USING btree ("user_id","id");--> statement-breakpoint
CREATE INDEX "idx_habits_user_id" ON "habits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_weekly_reviews_user_id" ON "weekly_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_wins_user_id" ON "wins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_wins_date" ON "wins" USING btree ("date");