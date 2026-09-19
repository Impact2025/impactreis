#!/usr/bin/env node
/**
 * Vergelijkt het canonieke Drizzle-schema (src/lib/db/schema.ts) met de daadwerkelijke productie-
 * database en rapporteert verschillen. STATUS.md noemt schema-fragmentatie als bekende technische
 * schuld — drie bronnen (schema.sql, schema.ts, de echte DB) die uit elkaar lopen zonder dat iets
 * dat zichtbaar maakt. Dit script maakt drift zichtbaar in plaats van dat het pas opvalt bij een
 * kapotte migratie.
 *
 * Puur informatief (exit 0 altijd) — geen CI-gate, want een deel van de gerapporteerde verschillen
 * is bewust (zie ALLOWLIST hieronder). Draai handmatig: `npm run db:drift`.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { getTableConfig } from 'drizzle-orm/pg-core';
import * as schema from '../src/lib/db/schema.ts';

// Tabellen die bewust buiten dit schema vallen — niet opnieuw rapporteren als "drift" totdat de
// reden hieronder niet meer klopt.
const KNOWN_DB_ONLY_TABLES = new Set([
  // Admin-only CRM/financiën: single-tenant-by-design (interne bedrijfsvoering van de app-eigenaar,
  // geen klantfunctionaliteit) - zie src/app/api/admin/crm/* en src/app/api/admin/facturen/*.
  'crm_companies', 'crm_contacts', 'crm_deals', 'crm_tasks', 'invoices', 'expenses', 'blog_posts',
  // Nog nooit via Drizzle aangesproken (aparte, oudere infrastructuur):
  'password_reset_tokens', 'rate_limits',
]);

// Tabellen die WEL in schema.ts staan maar bewust nog niet in productie zijn aangemaakt - zie de
// toelichting bij de tabel-definitie zelf in schema.ts voor waarom.
const KNOWN_SCHEMA_ONLY_TABLES = new Set([
  'approval_queue', // ontworpen opvolger van calendar_proposals, additief te migreren wanneer die kant op gebouwd wordt
]);

// Kolommen die WEL in schema.ts staan maar bewust nog niet gemigreerd zijn - zie de toelichting
// bij de kolom zelf in schema.ts.
const KNOWN_SCHEMA_ONLY_COLUMNS = new Set([
  'organizations.profile_type', // ImpactOS scale/institutional-modus, nog niet gebouwd - blijft op default 'scale'
]);

function loadLiveTables(sql) {
  return sql`
    SELECT c.table_name, c.column_name, c.data_type, c.is_nullable
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position
  `;
}

function drizzleColumnsFor(table) {
  const config = getTableConfig(table);
  return new Map(config.columns.map((c) => [c.name, c]));
}

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  const rows = await loadLiveTables(sql);

  const liveTables = new Map();
  for (const row of rows) {
    if (!liveTables.has(row.table_name)) liveTables.set(row.table_name, new Map());
    liveTables.get(row.table_name).set(row.column_name, row);
  }

  const schemaTables = new Map();
  for (const value of Object.values(schema)) {
    if (value && typeof value === 'object' && value[Symbol.for('drizzle:Name')]) {
      const config = getTableConfig(value);
      schemaTables.set(config.name, value);
    }
  }

  let issues = 0;

  for (const tableName of liveTables.keys()) {
    if (!schemaTables.has(tableName) && !KNOWN_DB_ONLY_TABLES.has(tableName)) {
      console.log(`? Tabel "${tableName}" bestaat in productie maar niet in schema.ts`);
      issues++;
    }
  }

  for (const tableName of schemaTables.keys()) {
    if (!liveTables.has(tableName)) {
      if (!KNOWN_SCHEMA_ONLY_TABLES.has(tableName)) {
        console.log(`? Tabel "${tableName}" staat in schema.ts maar bestaat niet in productie`);
        issues++;
      }
      continue;
    }

    const liveCols = liveTables.get(tableName);
    const schemaCols = drizzleColumnsFor(schemaTables.get(tableName));

    for (const colName of liveCols.keys()) {
      if (!schemaCols.has(colName)) {
        console.log(`? ${tableName}.${colName} bestaat in productie maar niet in schema.ts`);
        issues++;
      }
    }
    for (const colName of schemaCols.keys()) {
      if (!liveCols.has(colName) && !KNOWN_SCHEMA_ONLY_COLUMNS.has(`${tableName}.${colName}`)) {
        console.log(`? ${tableName}.${colName} staat in schema.ts maar bestaat niet in productie`);
        issues++;
      }
    }
  }

  console.log(issues === 0
    ? '\n✓ Geen onverwachte drift tussen schema.ts en productie.'
    : `\n${issues} punt(en) drift gevonden (zie hierboven). Niet per se fout — controleer of ze aan KNOWN_*_TABLES in dit script toegevoegd moeten worden, of dat schema.ts/de migratie moet worden bijgewerkt.`);
}

main().catch((err) => {
  console.error('Schema-drift-check faalde:', err);
  process.exit(1);
});
