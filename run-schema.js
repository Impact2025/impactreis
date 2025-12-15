import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);
const schema = fs.readFileSync('schema.sql', 'utf8');

async function runSchema() {
  try {
    // Execute the entire schema
    // Note: Neon requires tagged template literals, so we'll execute statement by statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        // Use the query method for raw SQL
        await sql.query(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (error) {
        // Skip if table already exists
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1}/${statements.length}: Already exists (skipped)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Schema executed successfully');
    console.log('✅ New tables: wins, user_context');
  } catch (error) {
    console.error('\n❌ Error executing schema:', error.message);
    process.exit(1);
  }
}

runSchema();