const pg = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || '';

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();

    // Check users table structure
    const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`);
    console.log('=== users table columns ===');
    cols.rows.forEach((c) => console.log(c.column_name, c.data_type));

    // Check daily_logs table structure
    const dlCols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'daily_logs' ORDER BY ordinal_position`);
    console.log('=== daily_logs table columns ===');
    dlCols.rows.forEach((c) => console.log(c.column_name, c.data_type));

    // Check weekly_reviews
    const wr = await client.query(`SELECT to_regclass('weekly_reviews') as exists`);
    console.log('weekly_reviews exists:', wr.rows[0]?.exists);

    // Check goals
    const gl = await client.query(`SELECT to_regclass('goals') as exists`);
    console.log('goals exists:', gl.rows[0]?.exists);

    // Check onboarding_profiles
    const op = await client.query(`SELECT to_regclass('onboarding_profiles') as exists`);
    console.log('onboarding_profiles exists:', op.rows[0]?.exists);

    // Check coach_lessons
    const cl = await client.query(`SELECT to_regclass('coach_lessons') as exists`);
    console.log('coach_lessons exists:', cl.rows[0]?.exists);

    // Check user_context
    const uc = await client.query(`SELECT to_regclass('user_context') as exists`);
    console.log('user_context exists:', uc.rows[0]?.exists);

    // Check energy_log
    const el = await client.query(`SELECT to_regclass('energy_log') as exists`);
    console.log('energy_log exists:', el.rows[0]?.exists);

    // Try getting current user
    const users = await client.query(`SELECT id, email, organization_id FROM users LIMIT 5`);
    console.log('=== users in DB ===');
    users.rows.forEach((u) => console.log(JSON.stringify(u)));

    // Check goals table columns
    const goalCols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'goals' ORDER BY ordinal_position`);
    console.log('=== goals table columns ===');
    goalCols.rows.forEach((c) => console.log(c.column_name, c.data_type));

    // Check for morning logs today
    const today = new Date().toISOString().split('T')[0];
    const morningLogs = await client.query(`SELECT date_string, type, data FROM daily_logs WHERE type = 'morning' AND date_string = $1`, [today]);
    console.log('=== morning logs for today ===', today);
    console.log(JSON.stringify(morningLogs.rows));

    // Check weekly_reviews data
    const weeklyReviews = await client.query(`SELECT week_number, data FROM weekly_reviews ORDER BY timestamp DESC LIMIT 5`);
    console.log('=== weekly_reviews ===');
    weeklyReviews.rows.forEach((r) => console.log(JSON.stringify({ week_number: r.week_number, data: typeof r.data === 'string' ? r.data : r.data })));

    // Check onboarding profile
    const profile = await client.query(`SELECT user_id, completed, profile FROM onboarding_profiles LIMIT 5`);
    console.log('=== onboarding profiles ===');
    profile.rows.forEach((p) => console.log(JSON.stringify({ user_id: p.user_id, completed: p.completed, profile_keys: typeof p.profile === 'string' ? 'string-len-' + p.profile.length : Object.keys(p.profile || {}) })));

  } catch (err) {
    console.error('DB ERROR:', err.message);
  } finally {
    await client.end();
  }
  process.exit(0);
}

main();
