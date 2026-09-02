import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { Client } from '@neondatabase/serverless';

const sql = new Client(process.env.DATABASE_URL);
await sql.connect();
const file = readFileSync(new URL('../migrations/manual/0009_admin_module.sql', import.meta.url), 'utf8');

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
} finally {
  await sql.end();
}
