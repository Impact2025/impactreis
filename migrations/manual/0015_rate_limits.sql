-- Handmatige, idempotente migratie voor de BESTAANDE productie-database.
-- Zelfde patroon als migrations/manual/0014_coach_next_steps.sql.
--
-- Nodig voor: src/lib/rate-limit.ts. Vaste-window rate limiting op AI-endpoints,
-- auth-endpoints (brute force) en publieke lead-gen forms, zonder nieuwe infra
-- (Redis/Upstash) aan te schaffen -- de app draait al op Postgres/Neon.
--
-- Uitvoeren: psql "$DATABASE_URL" -f migrations/manual/0015_rate_limits.sql
-- Alleen uitvoeren na expliciete bevestiging -- dit raakt de live database.

BEGIN;

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key, window_start)
);

-- Oude windows opruimen kan met een periodieke DELETE WHERE window_start < NOW() - INTERVAL '1 day',
-- desgewenst via de bestaande cron-infra. Niet kritisch: rijen zijn klein en de primary key
-- voorkomt onbegrensde groei binnen één window.

COMMIT;
