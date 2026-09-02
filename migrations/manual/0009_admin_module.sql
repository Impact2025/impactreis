-- Handmatige, idempotente migratie voor de admin-sectie (/admin): blog, CRM en administratie.
-- Zelfde patroon als migrations/manual/0006_identity_profiles.sql.
--
-- Geen organization_id: /admin heeft een eigen, enkelvoudig account (los van de
-- multi-tenant user-auth) en is bedoeld voor de site-eigenaar, niet per klant-organisatie.
--
-- Uitvoeren: node scripts/run-admin-module-migration.mjs

BEGIN;

CREATE TABLE IF NOT EXISTS blog_posts (
  id               SERIAL PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  excerpt          TEXT,
  content          TEXT NOT NULL DEFAULT '',
  cover_image      TEXT,
  status           TEXT NOT NULL DEFAULT 'draft', -- draft | published
  seo_title        TEXT,
  seo_description  TEXT,
  published_at     TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);

CREATE TABLE IF NOT EXISTS crm_companies (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  website     TEXT,
  industry    TEXT,
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id          SERIAL PRIMARY KEY,
  company_id  INTEGER REFERENCES crm_companies(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  role        TEXT,
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON crm_contacts(company_id);

CREATE TABLE IF NOT EXISTS crm_deals (
  id          SERIAL PRIMARY KEY,
  company_id  INTEGER REFERENCES crm_companies(id) ON DELETE SET NULL,
  contact_id  INTEGER REFERENCES crm_contacts(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  value       NUMERIC(12, 2) DEFAULT 0,
  stage       TEXT NOT NULL DEFAULT 'lead', -- lead | qualified | voorstel | onderhandeling | gewonnen | verloren
  notes       TEXT,
  closed_at   TIMESTAMP,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);

CREATE TABLE IF NOT EXISTS crm_tasks (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  due_date      DATE,
  done          BOOLEAN NOT NULL DEFAULT FALSE,
  related_type  TEXT, -- company | contact | deal
  related_id    INTEGER,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_done ON crm_tasks(done);

CREATE TABLE IF NOT EXISTS invoices (
  id           SERIAL PRIMARY KEY,
  number       TEXT NOT NULL UNIQUE,
  client_name  TEXT NOT NULL,
  company_id   INTEGER REFERENCES crm_companies(id) ON DELETE SET NULL,
  amount       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'open', -- open | betaald | te_laat | geannuleerd
  issue_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date     DATE,
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

CREATE TABLE IF NOT EXISTS expenses (
  id          SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  category    TEXT,
  amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

COMMIT;
