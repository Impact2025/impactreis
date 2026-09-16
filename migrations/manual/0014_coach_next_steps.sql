-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0013_ritual_settings_meditations_enabled.sql.
--
-- Nodig voor: de "Beste Volgende Stap"-kaart op het dashboard (/api/coach/next-step).
-- Cachet de dagelijkse aanbeveling per gebruiker zodat een pagina-refresh niet elke keer
-- opnieuw een LLM-call kost — zie determineNextStepCandidate/runNextStepAnalysis in
-- src/lib/coach.ts.
--
-- Uitvoeren: psql "$DATABASE_URL" -f migrations/manual/0014_coach_next_steps.sql
-- Alleen uitvoeren na expliciete bevestiging — dit raakt de live database.

BEGIN;

CREATE TABLE IF NOT EXISTS coach_next_steps (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_id INTEGER,
  date DATE NOT NULL,
  pattern_key TEXT NOT NULL,
  headline TEXT NOT NULL,
  message TEXT NOT NULL,
  cta_label TEXT NOT NULL,
  cta_href TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

COMMIT;
