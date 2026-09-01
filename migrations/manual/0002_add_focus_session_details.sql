-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0001_add_multi_tenant_columns.sql.
--
-- Effect: 100% additief op focus_sessions. Geen enkele bestaande kolom wordt gewijzigd of
-- verwijderd, dus /api/focus blijft werken zoals nu, ook zonder deze migratie te draaien.
-- Nodig voor: de focus-pagina (Pomodoro-timer) die nu voor het eerst echte sessies naar
-- focus_sessions schrijft i.p.v. alleen localStorage, en het bijbehorende avond/week-overzicht.
--
-- Uitvoeren: psql "$DATABASE_URL" -f migrations/manual/0002_add_focus_session_details.sql
-- Alleen uitvoeren na expliciete bevestiging — dit raakt de live database.

BEGIN;

ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS energy_before INTEGER;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS energy_after INTEGER;
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'work';

COMMIT;
