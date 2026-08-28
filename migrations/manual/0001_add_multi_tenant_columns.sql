-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- (De Drizzle-gegenereerde migratie in migrations/0000_multi_tenant_foundation.sql gaat uit van
-- een lege database — nuttig voor een nieuwe/test-omgeving, NIET om tegen productie te draaien,
-- want de tabellen bestaan al met schema.sql als bron.)
--
-- Effect: 100% additief. Geen enkele bestaande kolom wordt gewijzigd of verwijderd.
-- Na deze migratie werkt de app exact zoals nu — organization_id is overal nullable
-- totdat de backfill hieronder draait en je Fase 1b uitvoert (NOT NULL + RLS).
--
-- Uitvoeren: psql "$DATABASE_URL" -f migrations/manual/0001_add_multi_tenant_columns.sql
-- Alleen uitvoeren na expliciete bevestiging — dit raakt de live database.

BEGIN;

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Eén organisatie voor de bestaande gebruiker(s), zodat backfill hieronder een doel heeft.
INSERT INTO organizations (slug, name, plan)
VALUES ('impact-reis', 'Impact Reis (founder account)', 'pro')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE users              ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE users               ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE habits             ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE daily_logs         ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE goals              ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE weekly_goals       ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE weekly_reviews     ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE focus_sessions     ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE wins               ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE user_context       ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE coach_lessons      ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE energy_log         ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE coach_predictions  ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);

-- users.password_hash mag straks NULL zijn voor Auth.js magic-link-accounts.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Backfill: alle bestaande data hangt aan de founder-organisatie hierboven.
UPDATE users             SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE habits            SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE daily_logs        SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE goals             SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE weekly_goals      SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE weekly_reviews    SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE focus_sessions    SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE wins              SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE user_context      SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE coach_lessons     SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE energy_log        SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE coach_predictions SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;

COMMIT;

-- NIET in deze migratie (bewust, uit te voeren als aparte Fase 1b nadat je hebt geverifieerd
-- dat elke rij een organization_id heeft):
--   ALTER TABLE ... ALTER COLUMN organization_id SET NOT NULL;
--   ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY ... USING (organization_id = current_setting('app.current_org_id')::int);
-- Zie MULTI_TENANT_MIGRATION.md stap 3.
