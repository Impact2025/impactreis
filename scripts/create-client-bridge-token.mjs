import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import { Client } from '@neondatabase/serverless';

// Maakt een nieuw bridge-token voor een klant (organisatie), zodat ImpactOS (of een ander
// extern systeem) diens ochtend/avond/week-data kan lezen zonder Vincents eigen token te delen.
// Gebruik: node scripts/create-client-bridge-token.mjs <organization-slug> "<label>"
// Print het onversleutelde token ÉÉN keer — alleen de hash wordt opgeslagen, dus dit is de
// enige kans om het te kopiëren.

const [, , orgSlug, label] = process.argv;
if (!orgSlug || !label) {
  console.error('Gebruik: node scripts/create-client-bridge-token.mjs <organization-slug> "<label>"');
  process.exit(1);
}

const sql = new Client(process.env.DATABASE_URL);
await sql.connect();

const { rows: orgRows } = await sql.query(`SELECT id, name FROM organizations WHERE slug = $1`, [orgSlug]);
if (orgRows.length === 0) {
  console.error(`Geen organisatie gevonden met slug "${orgSlug}".`);
  await sql.end();
  process.exit(1);
}
const { id: organizationId, name } = orgRows[0];

const token = randomBytes(32).toString('hex');
const tokenHash = createHash('sha256').update(token).digest('hex');

await sql.query(
  `INSERT INTO client_bridge_tokens (organization_id, token_hash, label) VALUES ($1, $2, $3)`,
  [organizationId, tokenHash, label]
);

console.log(`Nieuw bridge-token voor "${name}" (organisatie #${organizationId}):`);
console.log(token);
console.log('\nBewaar dit token nu — het wordt niet opnieuw getoond.');

await sql.end();
