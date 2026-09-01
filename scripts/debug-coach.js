const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Load env manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const lines = envContent.split('\n');
const env = {};
for (const line of lines) {
  if (line.startsWith('#') || !line.includes('=')) continue;
  const [key, ...rest] = line.split('=');
  env[key.trim()] = rest.join('=').trim();
}

// Generate token for user 1
const token = jwt.sign({ userId: 1, email: 'v.munster@weareimpact.nl' }, env.JWT_SECRET, { expiresIn: '7d' });
console.log('TOKEN:', token);

// Now test the coach analyseren
const sql = neon(env.DATABASE_URL);

async function main() {
  try {
    // Check what the coach context loads
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    console.log('Today:', today, 'Yesterday:', yesterday);

    // Check morning logs for today and yesterday
    const morningRows = await sql`SELECT date_string, type, data FROM daily_logs WHERE user_id = ${'1'} AND date_string IN (${today}, ${yesterday})`;
    console.log('=== morning logs for coach context ===');
    console.log(JSON.stringify(morningRows));

    // Check user_context
    const context = await sql`SELECT current_energy_level, current_stress_level, recent_mood, current_focus_area, coaching_style FROM user_context WHERE user_id = ${'1'}`;
    console.log('=== user_context ===');
    console.log(JSON.stringify(context));

    // Check energy_log
    const energy = await sql`SELECT date_string, activity, category, direction FROM energy_log WHERE user_id = ${'1'} ORDER BY date_string DESC LIMIT 10`;
    console.log('=== energy_log ===');
    console.log(JSON.stringify(energy));

    // Check coach_lessons
    const lessons = await sql`SELECT id, pattern_key, technique, insight, confidence, times_confirmed, times_disproven, active FROM coach_lessons WHERE user_id = ${'1'} AND active = TRUE ORDER BY confidence DESC LIMIT 10`;
    console.log('=== coach_lessons ===');
    console.log(JSON.stringify(lessons));

    // Check OPENROUTER_API_KEY
    console.log('=== env check ===');
    console.log('OPENROUTER_API_KEY set:', !!env.OPENROUTER_API_KEY);
    console.log('IMPACTOS_BASE_URL:', env.IMPACTOS_BASE_URL);

  } catch (err) {
    console.error('DB ERROR:', err);
  }
  process.exit(0);
}

main();
