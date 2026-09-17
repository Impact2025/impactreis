-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0017_user_login_tracking.sql.
--
-- Effect: nieuwe tabel invited_emails, raakt geen bestaande tabellen.
-- Nodig voor: invite-only toegang — auth.ts staat alleen magic-link verzending toe aan
-- e-mailadressen die al een users-rij hebben (bestaande klanten) of hier ingevouven staan.
-- Zie /admin/uitnodigingen en /api/admin/invites.
--
-- Uitvoeren: node scripts/run-invited-emails-migration.mjs
-- Alleen uitvoeren na expliciete bevestiging — dit raakt de live database.

BEGIN;

CREATE TABLE IF NOT EXISTS invited_emails (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  invited_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;
