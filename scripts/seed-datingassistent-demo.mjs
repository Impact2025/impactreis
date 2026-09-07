import 'dotenv/config';
import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { Client } from '@neondatabase/serverless';

// Voegt een demo-organisatie + gebruiker toe voor DatingAssistent (info@datingassistent.nl) —
// insert-only, wist geen bestaande data. Maakt ook meteen een bridge-token aan zodat ImpactOS
// de coach-signalen van deze organisatie kan uitlezen (zie src/lib/coach.ts:resolveBridgeOrganization).
//
// Uitvoeren: node scripts/seed-datingassistent-demo.mjs

const ORG_SLUG = 'datingassistent';
const ORG_NAME = 'DatingAssistent';
const DEMO_EMAIL = 'info@datingassistent.nl';
const DEMO_PASSWORD = 'Demo1234!';

const sql = new Client(process.env.DATABASE_URL);
await sql.connect();

try {
  const existingOrg = await sql.query(`SELECT id FROM organizations WHERE slug = $1`, [ORG_SLUG]);
  if (existingOrg.rows.length > 0) {
    console.log(`⚠️  Organisatie '${ORG_SLUG}' bestaat al (id: ${existingOrg.rows[0].id}). Script stopt zonder wijzigingen.`);
    await sql.end();
    process.exit(0);
  }

  const org = await sql.query(
    `INSERT INTO organizations (slug, name, plan) VALUES ($1, $2, 'starter') RETURNING id`,
    [ORG_SLUG, ORG_NAME]
  );
  const organizationId = org.rows[0].id;
  console.log(`✓ Organisatie aangemaakt: ${ORG_NAME} (${ORG_SLUG}, id ${organizationId})`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await sql.query(
    `INSERT INTO users (email, password_hash, organization_id, role) VALUES ($1, $2, $3, 'owner') RETURNING id`,
    [DEMO_EMAIL, passwordHash, organizationId]
  );
  const userId = String(user.rows[0].id);
  console.log(`✓ Demo-inlogaccount aangemaakt (${DEMO_EMAIL} / ${DEMO_PASSWORD})`);

  // --- Ochtendrituelen: 3 opeenvolgende dagen lage energie, zodat detectProactiveSignal()
  // een echt signaal teruggeeft aan de bridge-route /api/coach/signal (zie coach.ts). ---
  const today = new Date();
  const morningEntries = [
    { offset: 0, energyLevel: 3, sleepQuality: 4, wakeTime: '06:40', intentie: 'Rustig door de dag, veel intakegesprekken vandaag.' },
    { offset: 1, energyLevel: 4, sleepQuality: 5, wakeTime: '07:10', intentie: 'Twee coachingsessies voorbereiden.' },
    { offset: 2, energyLevel: 3, sleepQuality: 3, wakeTime: '06:55', intentie: 'Achterstand wegwerken in de wachtrij.' },
  ];
  for (const entry of morningEntries) {
    const d = new Date(today.getTime() - entry.offset * 86400000);
    const dateString = d.toISOString().split('T')[0];
    const data = {
      energyLevel: entry.energyLevel,
      sleepQuality: entry.sleepQuality,
      wakeTime: entry.wakeTime,
      intentie: entry.intentie,
      dayType: 'focus',
    };
    await sql.query(
      `INSERT INTO daily_logs (user_id, type, date_string, data, timestamp, organization_id)
       VALUES ($1, 'morning', $2, $3, NOW(), $4)`,
      [userId, dateString, JSON.stringify(data), organizationId]
    );
  }
  console.log('✓ 3 ochtendrituelen aangemaakt (aanhoudend lage energie — triggert het coach-signaal)');

  // --- Energie-attributie: meer "kost" dan "geeft" deze periode, tweede mogelijke signaal. ---
  const energyEntries = [
    { offset: 0, activity: 'Intakegesprek met klant die veel begeleiding nodig had', category: 'coaching', direction: 'cost' },
    { offset: 1, activity: 'Wachtrij content goedkeuren', category: 'admin', direction: 'cost' },
    { offset: 1, activity: 'Succesvolle coachingsessie afgerond', category: 'coaching', direction: 'gain' },
    { offset: 2, activity: 'Nieuwe CRM-lead opvolgen', category: 'sales', direction: 'cost' },
    { offset: 3, activity: 'Instagram-content voorbereiden', category: 'marketing', direction: 'cost' },
  ];
  for (const entry of energyEntries) {
    const d = new Date(today.getTime() - entry.offset * 86400000);
    const dateString = d.toISOString().split('T')[0];
    await sql.query(
      `INSERT INTO energy_log (user_id, organization_id, date_string, activity, category, direction, source)
       VALUES ($1, $2, $3, $4, $5, $6, 'ritueel')`,
      [userId, organizationId, dateString, entry.activity, entry.category, entry.direction]
    );
  }
  console.log('✓ 5 energie-attributies aangemaakt');

  // --- Bridge-token: ImpactOS gebruikt dit om /api/coach/signal namens deze organisatie op te vragen. ---
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await sql.query(
    `INSERT INTO client_bridge_tokens (organization_id, token_hash, label) VALUES ($1, $2, $3)`,
    [organizationId, tokenHash, 'ImpactOS bridge — DatingAssistent demo']
  );

  console.log('\n✅ MyAiPA demo-profiel DatingAssistent succesvol aangemaakt!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Demo account:');
  console.log(`   E-mail:     ${DEMO_EMAIL}`);
  console.log(`   Wachtwoord: ${DEMO_PASSWORD}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏢 Organisatie: ${ORG_NAME} (${ORG_SLUG}, id ${organizationId})`);
  console.log('🔑 Bridge-token voor ImpactOS (bewaar dit nu — wordt niet opnieuw getoond):');
  console.log(`   ${token}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
} finally {
  await sql.end();
}
