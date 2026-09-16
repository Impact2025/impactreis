import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function createTables() {
  try {
    console.log('📝 Creating reality_check_leads table...');

    await sql`
      CREATE TABLE IF NOT EXISTS reality_check_leads (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT,
        level TEXT NOT NULL,
        answers JSONB NOT NULL,
        score INTEGER NOT NULL,
        profile_key TEXT NOT NULL,
        weekly_hours_lost REAL NOT NULL,
        monthly_hours_lost REAL NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log('✅ reality_check_leads table created');

    await sql`CREATE INDEX IF NOT EXISTS idx_reality_check_leads_email ON reality_check_leads(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reality_check_leads_created_at ON reality_check_leads(created_at DESC)`;

    console.log('✅ reality_check_leads indexes created');
    console.log('\n🎉 Done.');
  } catch (error) {
    console.error('\n❌ Error creating tables:', error.message);
    process.exit(1);
  }
}

createTables();
