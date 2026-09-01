import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const s = neon(process.env.DATABASE_URL!);

async function main() {
  const user = await s`SELECT id, email, organization_id FROM users WHERE email = 'demo@impactreis.nl'`;
  console.log('USER:', JSON.stringify(user, null, 2));

  const wins = await s`SELECT user_id, title, organization_id FROM wins LIMIT 3`;
  console.log('WINS sample:', JSON.stringify(wins, null, 2));

  const dag = await s`SELECT user_id, type, date_string FROM daily_logs LIMIT 3`;
  console.log('DAGBOEK sample:', JSON.stringify(dag, null, 2));

  const hab = await s`SELECT user_id, name FROM habits LIMIT 3`;
  console.log('HABITS sample:', JSON.stringify(hab, null, 2));

  await s.end();
}

main().catch(e => { console.error(e); process.exit(1); });
