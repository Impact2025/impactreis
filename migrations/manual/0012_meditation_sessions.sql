-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0002_add_focus_session_details.sql.
--
-- Effect: nieuwe, losstaande tabel. Raakt geen bestaande tabellen of routes.
-- Nodig voor: de nieuwe /meditations bibliotheek en het dashboard-widget, die voltooide
-- meditatiesessies vastleggen zodat streaks en inzichten kunnen worden getoond.
--
-- Uitvoeren: psql "$DATABASE_URL" -f migrations/manual/0012_meditation_sessions.sql
-- Alleen uitvoeren na expliciete bevestiging — dit raakt de live database.

BEGIN;

CREATE TABLE IF NOT EXISTS meditation_sessions (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL,
  meditation_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_seconds INTEGER,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON meditation_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_date ON meditation_sessions (date);

COMMIT;
