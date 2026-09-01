const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

// Load env manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const lines = envContent.split('\n');
const env = {};
for (const line of lines) {
  if (line.startsWith('#') || !line.includes('=')) continue;
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
}

const sql = neon(env.DATABASE_URL);

async function main() {
  try {
    // Check users table structure
    const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`;
    console.log('=== users table columns ===');
    cols.forEach((c) => console.log(c.column_name, c.data_type));

    // Check daily_logs table structure
    const dlCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'daily_logs' ORDER BY ordinal_position`;
    console.log('=== daily_logs table columns ===');
    dlCols.forEach((c) => console.log(c.column_name, c.data_type));

    // Check table existence
    const tables = await sql`
      SELECT table_name, 
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as col_count
      FROM information_schema.tables t 
      WHERE table_name IN ('weekly_reviews', 'goals', 'onboarding_profiles', 'coach_lessons', 'user_context', 'energy_log', 'coach_predictions', 'organizations')
      ORDER BY table_name
    `;
    console.log('=== table existence ===');
    tables.forEach((t) => console.log(t.table_name, 'exists, cols:', t.col_count));

    // Try getting current user
    const users = await sql`SELECT id, email, organization_id FROM users LIMIT 5`;
    console.log('=== users in DB ===');
    users.forEach((u) => console.log(JSON.stringify(u)));

    // Check goals table columns
    const goalCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'goals' ORDER BY ordinal_position`;
    console.log('=== goals table columns ===');
    goalCols.forEach((c) => console.log(c.column_name, c.data_type));

    // Check for morning logs today
    const today = new Date().toISOString().split('T')[0];
    const morningLogs = await sql`SELECT date_string, type, data FROM daily_logs WHERE type = 'morning' AND date_string = ${today}`;
    console.log('=== morning logs for today ===', today);
    console.log(JSON.stringify(morningLogs));

    // Check weekly_reviews data
    const weeklyReviews = await sql`SELECT week_number, data FROM weekly_reviews ORDER BY timestamp DESC LIMIT 5`;
    console.log('=== weekly_reviews ===');
    weeklyReviews.forEach((r) => console.log(JSON.stringify({ week_number: r.week_number, data: r.data })));

    // Check onboarding profile
    const profile = await sql`SELECT user_id, completed, profile FROM onboarding_profiles LIMIT 5`;
    console.log('=== onboarding profiles ===');
    profile.forEach((p) => {
      let keys;
      try { keys = Object.keys(JSON.parse(p.profile)); } catch { keys = 'string'; }
      console.log(JSON.stringify({ user_id: p.user_id, completed: p.completed, profile_keys: keys }));
    });

  } catch (err) {
    console.error('DB ERROR:', err);
  }
  process.exit(0);
}

main();
