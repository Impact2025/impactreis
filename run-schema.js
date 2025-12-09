import 'dotenv/config';
import { sql } from './server/db/index.js';
import fs from 'fs';

const schema = fs.readFileSync('schema.sql', 'utf8');

try {
  await sql.unsafe(schema);
  console.log('Schema executed successfully');
} catch (error) {
  console.error('Error executing schema:', error);
}