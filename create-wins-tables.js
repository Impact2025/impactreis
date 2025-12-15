import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function createTables() {
  try {
    console.log('📝 Creating wins table...');

    // Create wins table
    await sql`
      CREATE TABLE IF NOT EXISTS wins (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        impact_level INTEGER DEFAULT 1,
        date DATE NOT NULL,
        tags JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('✅ Wins table created');

    // Create indexes for wins
    await sql`CREATE INDEX IF NOT EXISTS idx_wins_user_id ON wins(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_wins_date ON wins(date DESC)`;

    console.log('✅ Wins indexes created');

    console.log('\n📝 Creating user_context table...');

    // Create user_context table
    await sql`
      CREATE TABLE IF NOT EXISTS user_context (
        user_id TEXT PRIMARY KEY,
        current_energy_level INTEGER DEFAULT 5,
        current_stress_level INTEGER DEFAULT 5,
        recent_mood TEXT DEFAULT 'neutral',
        last_major_win_date DATE,
        current_focus_area TEXT,
        coaching_style TEXT DEFAULT 'balanced',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('✅ User_context table created');

    console.log('\n🎉 All tables created successfully!');
    console.log('\n📊 Summary:');
    console.log('  - wins table (for Wall of Wins)');
    console.log('  - user_context table (for Quantum Leap Coach)');

  } catch (error) {
    console.error('\n❌ Error creating tables:', error.message);
    process.exit(1);
  }
}

createTables();
