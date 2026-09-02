-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0004_calendar_proposals.sql.
--
-- Identiteits-oefening ("Ik ben iemand die..."): singleton per user, twee jsonb-arrays
-- (statements + proofs) die altijd in hun geheel gelezen/geschreven worden. Vervangt de
-- eerdere localStorage-only opslag in identity/page.tsx. Multi-tenant vanaf dag 1:
-- organization_id is hier meteen NOT NULL, want de organisatie bestaat al.
--
-- Uitvoeren: node scripts/run-identity-profiles-migration.mjs

BEGIN;

CREATE TABLE IF NOT EXISTS identity_profiles (
  user_id         TEXT PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  statements      JSONB NOT NULL DEFAULT '[]',
  proofs          JSONB NOT NULL DEFAULT '[]',
  updated_at      TIMESTAMP DEFAULT NOW()
);

COMMIT;
