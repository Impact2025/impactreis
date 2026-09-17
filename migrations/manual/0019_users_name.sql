-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0018_invited_emails.sql.
--
-- Effect: nieuwe nullable kolom users.name, raakt geen bestaande rijen.
-- Nodig voor: dashboard-begroeting toont nu het e-mailadres-prefix i.p.v. de echte naam
-- (zie /coach dashboard "Goedemiddag, Info" voor iemand met info@... als e-mailadres).
-- Onboarding-stap 1 vraagt dit voortaan uit en slaat het hier op.
--
-- Uitvoeren: node scripts/run-users-name-migration.mjs
-- Alleen uitvoeren na expliciete bevestiging — dit raakt de live database.

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

COMMIT;
