-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0006_identity_profiles.sql.
--
-- Onboarding-gesprek tussentijds bewaren: tot nu toe leefde het intakegesprek alleen in de
-- React-state van de client, dus een refresh of afgebroken sessie betekende opnieuw beginnen.
-- Voegt een nullable "conversation"-kolom toe (ruwe messages-array) die na elke voltooide
-- beurt wordt weggeschreven, los van "profile" (dat pas gevuld wordt zodra fase 5 een geldig
-- UserOnboardingProfile oplevert). "profile" wordt daarom nullable.
--
-- Uitvoeren: node scripts/run-onboarding-conversation-migration.mjs

BEGIN;

ALTER TABLE onboarding_profiles ADD COLUMN IF NOT EXISTS conversation JSONB;
ALTER TABLE onboarding_profiles ALTER COLUMN profile DROP NOT NULL;

COMMIT;
