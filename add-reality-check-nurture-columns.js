import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  try {
    console.log('📝 Adding nurture-sequence columns to reality_check_leads...');

    await sql`ALTER TABLE reality_check_leads ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT`;
    await sql`ALTER TABLE reality_check_leads ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN NOT NULL DEFAULT FALSE`;
    await sql`ALTER TABLE reality_check_leads ADD COLUMN IF NOT EXISTS email1_sent_at TIMESTAMP`;
    await sql`ALTER TABLE reality_check_leads ADD COLUMN IF NOT EXISTS email2_sent_at TIMESTAMP`;
    await sql`ALTER TABLE reality_check_leads ADD COLUMN IF NOT EXISTS email3_sent_at TIMESTAMP`;
    await sql`ALTER TABLE reality_check_leads ADD COLUMN IF NOT EXISTS email4_sent_at TIMESTAMP`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_reality_check_leads_unsub_token ON reality_check_leads(unsubscribe_token)`;

    console.log('✅ Done.');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
