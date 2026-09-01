import 'dotenv/config';
import { Client } from '@neondatabase/serverless';

// Bug: morning/page.tsx en evening/page.tsx riepen api.logs.create({type, date, data: formData,
// createdAt}) aan i.p.v. de velden te spreaden. api.ts stuurt het hele object door, en
// /api/logs' POST-route destructureert alleen `type`/`date` weg — de rest (inclusief een
// property die toevallig ook "data" heet) belandt dus als {data: {...echte velden...},
// createdAt} in de jsonb-kolom, i.p.v. plat. Ontdekt tijdens het testen van de ImpactOS-bridge
// (D:/apps/agentos), die precies deze platte vorm verwacht. De schrijfkant is al gefixt
// (spread i.p.v. nested); dit repareert de al opgeslagen rijen.
const sql = new Client(process.env.DATABASE_URL);
await sql.connect();

const { rows: before } = await sql.query(`
  SELECT id, type, date_string, data FROM daily_logs
  WHERE type IN ('morning', 'evening') AND data ? 'data'
  ORDER BY id ASC
`);
console.log(`${before.length} rij(en) met de dubbele nesting gevonden.`);
for (const r of before) {
  console.log(`  #${r.id} ${r.type} ${r.date_string} — velden nu: ${Object.keys(r.data).join(', ')}`);
}

if (before.length === 0) {
  console.log('Niets te doen.');
  await sql.end();
  process.exit(0);
}

await sql.query('BEGIN');
try {
  const { rowCount } = await sql.query(`
    UPDATE daily_logs
    SET data = data->'data'
    WHERE type IN ('morning', 'evening') AND data ? 'data'
  `);
  console.log(`${rowCount} rij(en) platgeslagen.`);
  await sql.query('COMMIT');
} catch (err) {
  await sql.query('ROLLBACK');
  console.error('Teruggedraaid door fout:', err.message);
  process.exitCode = 1;
}

const { rows: after } = await sql.query(`
  SELECT id, type, date_string, data FROM daily_logs
  WHERE type IN ('morning', 'evening') AND data ? 'data'
`);
console.log(`Verificatie: ${after.length} rij(en) hebben nog steeds een "data"-sleutel (zou 0 moeten zijn, tenzij een veld toevallig "data" heet).`);

await sql.end();
