import { sql } from '@neondatabase/serverless';

async function main() {
  try {
    // Check users table structure
    const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`;
    console.log('=== users table columns ===');
    cols.forEach((c: any) => console.log(c.column_name, c.data_type));

    // Check if daily_logs table exists and has right columns
    const dlCols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'daily_logs' ORDER BY ordinal_position`;
    console.log('=== daily_logs table columns ===');
    dlCols.forEach((c: any) => console.log(c.column_name, c.data_type));

    // Check if weekly_reviews table exists
    const wr = await sql`SELECT to_regclass('weekly_reviews') as exists`;
    console.log('weekly_reviews exists:', wr[0]?.exists);

    // Check goals
    const gl = await sql`SELECT to_regclass('goals') as exists`;
    console.log('goals exists:', gl[0]?.exists);

    // Check onboarding_profiles
    const op = await sql`SELECT to_regclass('onboarding_profiles') as exists`;
    console.log('onboarding_profiles exists:', op[0]?.exists);

    // Check coach_lessons
    const cl = await sql`SELECT to_regclass('coach_lessons') as exists`;
    console.log('coach_lessons exists:', cl[0]?.exists);

    // Check user_context
    const uc = await sql`SELECT to_regclass('user_context') as exists`;
    console.log('user_context exists:', uc[0]?.exists);

    // Check energy_log
    const el = await sql`SELECT to_regclass('energy_log') as exists`;
    console.log('energy_log exists:', el[0]?.exists);

    // Try getting current user
    const users = await sql`SELECT id, email, organization_id FROM users LIMIT 5`;
    console.log('=== users in DB ===');
    users.forEach((u: any) => console.log(JSON.stringify(u)));

    // Check onboarding_profiles data
    try {
      const profiles = await sql`SELECT user_id, completed, profile FROM onboarding_profiles LIMIT 5`;
      console.log('=== onboarding_profiles ===');
      profiles.forEach((p: any) => console.log(JSON.stringify({ user_id: p.user_id, completed: p.completed, profile: typeof p.profile === 'string' ? 'string' : Object.keys(p.profile || {}) })));
    } catch (e: any) {
      console.log('onboarding_profiles query error:', e.message);
    }

  } catch (err: any) {
    console.error('DB ERROR:', err.message);
  }
  process.exit(0);
}

main();
