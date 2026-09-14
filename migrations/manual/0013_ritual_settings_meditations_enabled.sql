-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0002_add_focus_session_details.sql.
--
-- Effect: 100% additief op ritual_settings. Geen bestaande kolom wijzigt, dus
-- /api/ritual-settings en ritual-status.service.ts blijven werken zoals nu, ook zonder deze
-- migratie te draaien (de code valt dan terug op DEFAULT_RITUAL_SETTINGS.meditationsEnabled).
-- Nodig voor: meditaties optioneel maken — aan/uit te zetten in onboarding en instellingen.
--
-- Uitvoeren: psql "$DATABASE_URL" -f migrations/manual/0013_ritual_settings_meditations_enabled.sql
-- Alleen uitvoeren na expliciete bevestiging — dit raakt de live database.

BEGIN;

ALTER TABLE ritual_settings ADD COLUMN IF NOT EXISTS meditations_enabled BOOLEAN NOT NULL DEFAULT true;

COMMIT;
