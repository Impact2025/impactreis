-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0001_add_multi_tenant_columns.sql.
--
-- Vervangt het enkele gedeelde COACH_BRIDGE_TOKEN (dat altijd naar de eerste gebruiker in de
-- hele `users`-tabel resolvede — src/lib/coach.ts:loadSingleUserId, nu vervangen) door een
-- token-per-organisatie. Vincents eigen bestaande token wordt hier de eerste rij, zodat er nog
-- maar één mechanisme is voor zowel zijn eigen bridge als toekomstige klant-bridges.
--
-- Uitvoeren: psql "$DATABASE_URL" -f migrations/manual/0003_client_bridge_tokens.sql
-- Daarna: scripts/backfill-vincent-bridge-token.mjs draaien om Vincents eigen token in te
-- vullen (het token zelf staat alleen in .env, niet in deze SQL-migratie).

BEGIN;

CREATE TABLE IF NOT EXISTS client_bridge_tokens (
  id              SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  token_hash      TEXT NOT NULL UNIQUE,
  label           TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

COMMIT;
