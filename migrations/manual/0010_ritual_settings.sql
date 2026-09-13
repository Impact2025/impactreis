-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0006_identity_profiles.sql.
--
-- Ritueel-instellingen per gebruiker: timezone, werkdagen, avond-openingstijd en de laatste
-- ISO-weekdag om de week nog te starten. Maakt de ritueel-gating (ritual-status.service.ts /
-- weekflow.service.ts) los van de hardcoded Europe/Amsterdam + ma-vr + 17:00 + t/m wo
-- aannames, zodat andere tijdzones/werkweken/werktijden hetzelfde systeem kunnen gebruiken.
-- Singleton per user, multi-tenant vanaf dag 1 (organization_id NOT NULL).
--
-- Uitvoeren: node scripts/run-ritual-settings-migration.mjs

BEGIN;

CREATE TABLE IF NOT EXISTS ritual_settings (
  user_id                      TEXT PRIMARY KEY,
  organization_id              INTEGER NOT NULL REFERENCES organizations(id),
  timezone                     TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
  work_days                    JSONB NOT NULL DEFAULT '[1,2,3,4,5]', -- ISO-weekdag, 1=maandag..7=zondag
  evening_ritual_opens_hour    INTEGER NOT NULL DEFAULT 17,
  week_start_deadline_weekday  INTEGER NOT NULL DEFAULT 3, -- laatste ISO-weekdag om de week nog te starten
  created_at                   TIMESTAMP DEFAULT NOW(),
  updated_at                   TIMESTAMP DEFAULT NOW()
);

COMMIT;
