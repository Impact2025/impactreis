-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0001_add_multi_tenant_columns.sql.
--
-- De courses- (schema.sql/run-schema.js) en push-tabellen (create-push-tables.js) zijn ooit
-- buiten het canonieke Drizzle-schema en zonder organization_id aangemaakt. Deze migratie is
-- 100% additief: organization_id is nullable, geen NOT NULL/RLS (consistent met de rest van de
-- codebase, die dat bewust uitstelt tot een latere fase).
--
-- Bewuste keuze: de cursuscatalogus (courses, course_modules, course_lessons, course_exercises)
-- is gedeelde content, geen organisatie-eigendom — die tabellen krijgen GEEN organization_id.
-- Alleen de 7 gebruikersvoortgang-tabellen + de 3 push-tabellen worden multi-tenant gemaakt.
--
-- Uitvoeren: node scripts/run-courses-push-multitenant-migration.mjs
-- Alleen uitvoeren na expliciete bevestiging — dit raakt de live database.

BEGIN;

ALTER TABLE course_enrollments      ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE lesson_completions      ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE course_answers          ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE exercise_completions    ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE daily_practice_log      ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE user_assessments        ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE course_achievements     ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE push_subscriptions      ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
ALTER TABLE scheduled_notifications ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);

-- Backfill: alle bestaande rijen hangen aan de founder-organisatie (zelfde patroon als 0001).
UPDATE course_enrollments       SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE lesson_completions       SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE course_answers           SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE exercise_completions     SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE daily_practice_log       SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE user_assessments         SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE course_achievements      SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE push_subscriptions       SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE notification_preferences SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;
UPDATE scheduled_notifications  SET organization_id = (SELECT id FROM organizations WHERE slug = 'impact-reis') WHERE organization_id IS NULL;

COMMIT;

-- Bekende, bewust ongewijzigde beperking (geen onderdeel van deze migratie):
-- GET /api/notifications/send (de cron-trigger voor ochtend/avond/week-herinneringen) query't
-- push_subscriptions zonder organization_id-filter en stuurt dus naar ALLE subscriptions in de
-- database. Bij één organisatie onschadelijk; bij een tweede klant een cross-tenant lek. Vereist
-- een productbeslissing over per-user verzendlogica, niet slechts een kolom-toevoeging — zie
-- src/app/api/notifications/send/route.ts.
