-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0016_ritual_settings_focus_blocks.sql.
--
-- Effect: 100% additief op users. Geen bestaande kolom wijzigt.
-- Nodig voor: het admin-gebruikersoverzicht (wie is actief, hoe vaak ingelogd) — zie
-- /api/admin/users en /admin/gebruikers.
--
-- Uitvoeren: node scripts/run-user-login-tracking-migration.mjs
-- Alleen uitvoeren na expliciete bevestiging — dit raakt de live database.

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0;

COMMIT;
