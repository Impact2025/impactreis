import 'dotenv/config';
import { readFileSync } from 'node:fs';
import crypto from 'node:crypto';
import { Client } from '@neondatabase/serverless';

const sql = new Client(process.env.DATABASE_URL);
await sql.connect();
const file = readFileSync(new URL('../migrations/manual/0005_email_lifecycle.sql', import.meta.url), 'utf8');

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
  await sql.end();
  process.exit(1);
}

console.log('\nBackfill: email_preferences voor bestaande users zonder rij...');
const { rows: missing } = await sql.query(
  `SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM email_preferences)`
);
for (const { id } of missing) {
  const token = crypto.randomBytes(24).toString('hex');
  await sql.query(
    `INSERT INTO email_preferences (user_id, unsubscribe_token) VALUES ($1, $2)`,
    [id, token]
  );
  console.log(`  user ${id}: preferences-rij aangemaakt`);
}
console.log(`  ${missing.length} rij(en) aangemaakt.`);

console.log('\nVerificatie — kolommen op email_preferences:');
const { rows } = await sql.query(`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'email_preferences'
  ORDER BY ordinal_position
`);
for (const r of rows) {
  console.log(`  ${r.column_name}: ${r.data_type}`);
}

await sql.end();
