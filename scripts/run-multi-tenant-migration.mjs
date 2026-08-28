import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { Client } from '@neondatabase/serverless';

const sql = new Client(process.env.DATABASE_URL);
await sql.connect();
const file = readFileSync(new URL('../migrations/manual/0001_add_multi_tenant_columns.sql', import.meta.url), 'utf8');

// Strip full-line comments BEFORE splitting into statements — a naive split-then-filter
// drops any statement whose chunk happens to start with a preceding comment line, which bit
// us on the first run (INSERT INTO organizations, the password_hash ALTER, and the users
// backfill were all silently skipped). Filtering comments out first avoids that class of bug.
const withoutComments = file
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n');

const statements = withoutComments
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s && s !== 'BEGIN' && s !== 'COMMIT');

await sql.query('BEGIN');
try {
  for (const stmt of statements) {
    const label = stmt.split('\n')[0].slice(0, 70);
    process.stdout.write(`→ ${label}\n`);
    await sql.query(stmt);
  }
  await sql.query('COMMIT');
  console.log('\nMigratie gecommit.');
} catch (err) {
  await sql.query('ROLLBACK');
  console.error('\nMigratie teruggedraaid door fout:', err.message);
  process.exitCode = 1;
}

console.log('\nBackfill-verificatie:');
const tables = [
  'users', 'habits', 'daily_logs', 'goals', 'weekly_goals', 'weekly_reviews',
  'focus_sessions', 'wins', 'user_context', 'coach_lessons', 'energy_log', 'coach_predictions',
];
for (const t of tables) {
  const { rows } = await sql.query(`SELECT count(*)::int AS count FROM ${t} WHERE organization_id IS NULL`);
  console.log(`  ${t}: ${rows[0].count} rijen zonder organization_id`);
}

await sql.end();
