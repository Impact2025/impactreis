-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0013_ritual_settings_meditations_enabled.sql.
--
-- Effect: 100% additief op ritual_settings. Geen bestaande kolom wijzigt, dus
-- /api/ritual-settings blijft werken zoals nu, ook zonder deze migratie te draaien (de code
-- valt dan terug op DEFAULT_RITUAL_SETTINGS.focusBlock*).
-- Nodig voor: focusblok-tijden (start + duur) instelbaar maken in Instellingen, i.p.v. de
-- vaste 08:30-10:00 / 12:30-14:00 uit focus-blocks.ts.
--
-- Uitvoeren: node scripts/run-ritual-settings-focus-blocks-migration.mjs
-- Alleen uitvoeren na expliciete bevestiging — dit raakt de live database.

BEGIN;

ALTER TABLE ritual_settings ADD COLUMN IF NOT EXISTS focus_block_1_start TEXT NOT NULL DEFAULT '08:30';
ALTER TABLE ritual_settings ADD COLUMN IF NOT EXISTS focus_block_1_duration_min INTEGER NOT NULL DEFAULT 90;
ALTER TABLE ritual_settings ADD COLUMN IF NOT EXISTS focus_block_2_start TEXT NOT NULL DEFAULT '12:30';
ALTER TABLE ritual_settings ADD COLUMN IF NOT EXISTS focus_block_2_duration_min INTEGER NOT NULL DEFAULT 90;

COMMIT;
