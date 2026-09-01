import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const s = neon(process.env.DATABASE_URL!);

async function main() {
  const winsDemo = await s`SELECT count(*)::int AS cnt FROM wins WHERE user_id = '19'`;
  console.log('wins user_id=19:', winsDemo[0].cnt);
  const dagDemo = await s`SELECT count(*)::int AS cnt FROM daily_logs WHERE user_id = '19'`;
  console.log('daily_logs user_id=19:', dagDemo[0].cnt);
  const habDemo = await s`SELECT count(*)::int AS cnt FROM habits WHERE user_id = '19'`;
  console.log('habits user_id=19:', habDemo[0].cnt);
  const focusDemo = await s`SELECT count(*)::int AS cnt FROM focus_sessions WHERE user_id = '19'`;
  console.log('focus_sessions user_id=19:', focusDemo[0].cnt);
  const energyDemo = await s`SELECT count(*)::int AS cnt FROM energy_log WHERE user_id = '19'`;
  console.log('energy_log user_id=19:', energyDemo[0].cnt);
  const goalsDemo = await s`SELECT count(*)::int AS cnt FROM goals WHERE user_id = '19'`;
  console.log('goals user_id=19:', goalsDemo[0].cnt);
  await s.end();
}

(async () => {
  try {
    await main();
    console.log('✓ Check done');
  } catch (e) {
    console.error('Fout:', e.message);
    process.exit(1);
  }
})();
