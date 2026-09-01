import { config as loadEnv } from 'dotenv';
// .env draagt de werkende DATABASE_URL (productie); .env.local heeft COACH_BRIDGE_TOKEN maar
// een andere, hier niet-werkende DATABASE_URL — dotenv overschrijft nooit al gezette vars,
// dus .env eerst laden en .env.local zonder override vult alleen aan wat nog ontbreekt.
loadEnv({ path: '.env' });
loadEnv({ path: '.env.local' });
import { createHash, randomUUID } from 'node:crypto';
import { Client } from '@neondatabase/serverless';

// Eenmalig: zet Vincents bestaande COACH_BRIDGE_TOKEN (uit .env, ongewijzigd — ImpactOS' kant
// hoeft niet aangepast) als eerste rij in client_bridge_tokens, gekoppeld aan zijn organisatie.
// Idempotent op token_hash UNIQUE — nogmaals draaien doet niets.
const token = process.env.COACH_BRIDGE_TOKEN;
if (!token) {
  console.error('COACH_BRIDGE_TOKEN staat niet in .env — niets te backfillen.');
  process.exit(1);
}

const sql = new Client(process.env.DATABASE_URL);
await sql.connect();

const { rows: userRows } = await sql.query(
  `SELECT id, organization_id, email FROM users WHERE email = $1`,
  ['v.munster@weareimpact.nl']
);
if (userRows.length === 0) {
  console.error('Gebruiker v.munster@weareimpact.nl niet gevonden.');
  await sql.end();
  process.exit(1);
}
const { organization_id: organizationId, email } = userRows[0];

const tokenHash = createHash('sha256').update(token).digest('hex');
const { rows } = await sql.query(
  `INSERT INTO client_bridge_tokens (organization_id, token_hash, label)
   VALUES ($1, $2, $3)
   ON CONFLICT (token_hash) DO NOTHING
   RETURNING id`,
  [organizationId, tokenHash, `Vincent (${email}) — bestaand COACH_BRIDGE_TOKEN`]
);

if (rows.length > 0) {
  console.log(`Bridge-token gekoppeld aan organisatie ${organizationId} (rij #${rows[0].id}).`);
} else {
  console.log('Token stond al in client_bridge_tokens — niets gewijzigd.');
}

await sql.end();
