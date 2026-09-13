-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0004_calendar_proposals.sql.
--
-- 1) organizations.profile_type: schakelt een organisatie tussen ImpactOS Scale (sociaal
--    ondernemer) en ImpactOS Institutional (Wmo/Jeugdzorg) — bepaalt agent-promptketens en
--    compliance-filters, niet de UI-shell of het datamodel. Start op 'scale'.
--
-- 2) approval_queue: generieke tabel voor elk agent-voorstel (mail, subsidieverantwoording,
--    social post, CRM-follow-up, ...), i.p.v. een aparte approve/reject-tabel per domein.
--    calendar_proposals blijft vooralsnog los bestaan (bevat al productiedata); nieuwe
--    domeinen landen direct in approval_queue met een passende `kind`.
--
-- Uitvoeren: psql "$DATABASE_URL" -f migrations/manual/0011_profile_type_and_approval_queue.sql

BEGIN;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS profile_type TEXT NOT NULL DEFAULT 'scale'; -- 'scale' | 'institutional'

CREATE TABLE IF NOT EXISTS approval_queue (
  id              SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  user_id         TEXT NOT NULL,
  agent_key       TEXT NOT NULL,   -- 'iris' | 'mara' | 'bram' | 'noor' | 'toby' | 'coach'
  kind            TEXT NOT NULL,   -- 'calendar' | 'mail' | 'subsidie_verantwoording' | 'social_post' | ...
  payload         JSONB NOT NULL,
  diff            JSONB,
  confidence      REAL,
  status          TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'edited'
  reason          TEXT,
  decided_by      TEXT,
  decided_at      TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_queue_org_status
  ON approval_queue(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_approval_queue_user_status
  ON approval_queue(user_id, status);

COMMIT;
