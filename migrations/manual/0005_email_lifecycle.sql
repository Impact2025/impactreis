-- Multi-tenant e-mail-levenscyclus: voorkeuren per gebruiker + verzendlog.
-- Puur additief: raakt geen bestaande tabel of rij. De backfill (elke bestaande user een
-- email_preferences-rij met uniek unsubscribe-token geven) gebeurt in
-- scripts/run-email-lifecycle-migration.mjs met Node's crypto.randomBytes, niet hier met
-- gen_random_bytes() — dat vereist de pgcrypto-extension, die we niet als vanzelfsprekend
-- aanwezig willen aannemen op Neon.

CREATE TABLE IF NOT EXISTS email_preferences (
  user_id             INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  unsubscribe_token   TEXT NOT NULL UNIQUE,
  morning_motivation  BOOLEAN NOT NULL DEFAULT TRUE,
  morning_reminder    BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_report       BOOLEAN NOT NULL DEFAULT TRUE,
  streak_celebration  BOOLEAN NOT NULL DEFAULT TRUE,
  onboarding_nudge    BOOLEAN NOT NULL DEFAULT TRUE,
  winback             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_sends (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_type  TEXT NOT NULL,
  sent_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  meta        JSONB
);

CREATE INDEX IF NOT EXISTS idx_email_sends_user_type ON email_sends (user_id, email_type, sent_at);
