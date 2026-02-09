import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function createPushTables() {
  console.log('Creating push notification tables...');

  try {
    // Create push_subscriptions table
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Created push_subscriptions table');

    // Create index on user_id
    await sql`
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
      ON push_subscriptions(user_id)
    `;
    console.log('✅ Created user_id index');

    // Create notification_preferences table
    await sql`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        morning_ritual BOOLEAN DEFAULT true,
        evening_ritual BOOLEAN DEFAULT true,
        weekly_review BOOLEAN DEFAULT true,
        streak_reminders BOOLEAN DEFAULT true,
        morning_time TIME DEFAULT '07:00',
        evening_time TIME DEFAULT '21:00',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Created notification_preferences table');

    // Create scheduled_notifications table for tracking sent notifications
    await sql`
      CREATE TABLE IF NOT EXISTS scheduled_notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Created scheduled_notifications table');

    // Create index on scheduled_for
    await sql`
      CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for
      ON scheduled_notifications(scheduled_for, status)
    `;
    console.log('✅ Created scheduled_for index');

    console.log('\n🎉 All push notification tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createPushTables();
