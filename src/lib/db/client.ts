import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const client = neon(process.env.DATABASE_URL!);

// Drizzle-laag naast de bestaande `sql` tagged-template in ../db.ts.
// Nieuwe queries schrijven tegen `db`; bestaande routes migreren geleidelijk —
// zie MULTI_TENANT_MIGRATION.md voor de volgorde.
export const db = drizzle(client, { schema });
