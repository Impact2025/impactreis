-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0001_add_multi_tenant_columns.sql en 0003_client_bridge_tokens.sql.
--
-- Agenda-voorstellen: de coach mag een tijdblok voorstellen (bv. hersteltijd na een drukke dag),
-- maar dat wordt pas als echte Google Calendar-afspraak geschreven ná expliciete goedkeuring
-- door de gebruiker (zie src/app/api/calendar/proposals/*). Multi-tenant vanaf dag 1:
-- organization_id is hier meteen NOT NULL, in tegenstelling tot de kerntabellen die additief
-- zijn gemigreerd (zie 0001) — deze tabel is nieuw, dus er is geen backfill-stap nodig.
--
-- Uitvoeren: psql "$DATABASE_URL" -f migrations/manual/0004_calendar_proposals.sql

BEGIN;

CREATE TABLE IF NOT EXISTS calendar_proposals (
  id              SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id         TEXT NOT NULL,
  summary         TEXT NOT NULL,
  start_time      TIMESTAMP NOT NULL,
  end_time        TIMESTAMP NOT NULL,
  reason          TEXT,
  source          TEXT NOT NULL DEFAULT 'coach',   -- 'coach' | 'manual'
  status          TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  created_at      TIMESTAMP DEFAULT NOW(),
  resolved_at     TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calendar_proposals_user_status
  ON calendar_proposals(user_id, status);

COMMIT;
