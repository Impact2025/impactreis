import 'dotenv/config';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

void (async () => {
  // 1. Demo-organization (idempotent)
  let orgRows = await sql`SELECT id FROM organizations WHERE slug = 'demo-impactreis'`;
  let orgId;
  if (orgRows.length > 0) {
    orgId = orgRows[0].id;
    console.log('✓ Bestaande organization demo-impactreis, id=' + orgId);
  } else {
    const r = await sql`INSERT INTO organizations (slug, name, plan) VALUES ('demo-impactreis', 'Demo ImpactReis', 'starter') RETURNING id`;
    orgId = r[0].id;
    console.log('✓ Nieuwe organization demo-impactreis, id=' + orgId);
  }

  // 2. Demo-user upsert
  const demoEmail = process.env.DEMO_EMAIL || 'demo@impactreis.nl';
  const demoPassword = process.env.DEMO_PASSWORD || 'demo123';

  const hash = await bcrypt.hash(demoPassword, 12);

  let userRows = await sql`SELECT id, email, organization_id FROM users WHERE email = ${demoEmail}`;
  let userId;
  if (userRows.length === 0) {
    const r = await sql`
      INSERT INTO users (email, password_hash, organization_id, role)
      VALUES (${demoEmail}, ${hash}, ${orgId}, 'member')
      RETURNING id, email
    `;
    userId = r[0].id;
    console.log('✓ Nieuwe demo-user aangemaakt: id=' + userId + ' (' + demoEmail + ')');
  } else {
    userId = userRows[0].id;
    await sql`UPDATE users SET password_hash = ${hash}, organization_id = ${orgId}, role = 'member' WHERE id = ${userId}`;
    console.log('✓ Demo-user geüpdatet: id=' + userId + ' (' + demoEmail + ') met password_hash voor demo123');
  }

  // 3. Verify bcrypt.compare werkt
  const verifyHash = await sql`SELECT password_hash FROM users WHERE id = ${userId}`;
  const ok = await bcrypt.compare(demoPassword, verifyHash[0].password_hash);
  console.log('✓ bcrypt.compare(demo123, hash) = ' + ok);

  // 4. Token genereren (same alg as AuthService.generateToken)
  const token = jwt.sign({ userId, email: demoEmail }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  console.log('✓ Test JWT voor demo-login: ' + token.substring(0, 40) + '...');

  console.log('\n===== DEMO KLAAR =====');
  console.log('Demo user id: ' + userId);
  console.log('Demo org id: ' + orgId);
  console.log('Demo email: ' + demoEmail);
  console.log('Demo password: ' + demoPassword + ' → hash OK=' + ok);
})();
