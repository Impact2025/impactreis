import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);
const schema = fs.readFileSync('schema.sql', 'utf8');

async function runSchema() {
  try {
    // Remove comments and split by semicolon
    const cleanSchema = schema
      .replace(/--.*$/gm, '') // Remove single line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

    const statements = cleanSchema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute...`);
    console.log('');

    let success = 0;
    let skipped = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Extract table/index name for logging
      const match = statement.match(/(?:TABLE|INDEX)\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/i);
      const objectName = match ? match[1] : `statement ${i + 1}`;

      try {
        await sql([statement]);
        console.log(`✅ Created: ${objectName}`);
        success++;
      } catch (error) {
        if (error.message && (
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        )) {
          console.log(`⏭️  Exists:  ${objectName}`);
          skipped++;
        } else {
          console.error(`❌ Failed:  ${objectName}`);
          console.error(`   Error: ${error.message}`);
          throw error;
        }
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Schema migration complete!`);
    console.log(`   Created: ${success} | Skipped: ${skipped} | Total: ${statements.length}`);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('📊 New tables for Tony Robbins Courses:');
    console.log('   • courses');
    console.log('   • course_modules');
    console.log('   • course_lessons');
    console.log('   • course_exercises');
    console.log('   • course_enrollments');
    console.log('   • lesson_completions');
    console.log('   • course_answers');
    console.log('   • exercise_completions');
    console.log('   • daily_practice_log');
    console.log('   • user_assessments');
    console.log('   • course_achievements');
    console.log('');
    console.log('🚀 Next step: Run the app and POST to /api/courses/seed');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runSchema();
