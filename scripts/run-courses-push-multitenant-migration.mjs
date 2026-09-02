import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { Client } from '@neondatabase/serverless';

const sql = new Client(process.env.DATABASE_URL);
await sql.connect();
const file = readFileSync(new URL('../migrations/manual/0008_courses_and_push_multitenant.sql', import.meta.url), 'utf8');

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

const tables = [
  'course_enrollments', 'lesson_completions', 'course_answers', 'exercise_completions',
  'daily_practice_log', 'user_assessments', 'course_achievements',
  'push_subscriptions', 'notification_preferences', 'scheduled_notifications',
];

console.log('\nVerificatie — rijen zonder organization_id per tabel:');
for (const table of tables) {
  const { rows } = await sql.query(`SELECT COUNT(*) AS n FROM ${table} WHERE organization_id IS NULL`);
  console.log(`  ${table}: ${rows[0].n}`);
}

await sql.end();
