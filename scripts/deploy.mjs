#!/usr/bin/env node
/**
 * Enige geautoriseerde weg naar productie: draait predeploy-checks (type-check, tests, build),
 * deployt pas daarna via `vercel --prod`, en verifieert met een health-check dat productie
 * daadwerkelijk werkt. Voorkomt dat een kapotte build of een niet-startende app onopgemerkt
 * live gaat, zoals eerder gebeurde met `vercel --prod` los van enige check.
 */
import { execSync, spawnSync } from 'node:child_process';

const PROD_HEALTH_URL = 'https://sparren.app/api/health';

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

console.log('=== Predeploy checks ===');
try {
  run('npm run predeploy');
} catch {
  fail('Predeploy checks (type-check/test/build) faalden — deploy geannuleerd.');
}

console.log('\n=== Deploying to production ===');
const deployResult = spawnSync('vercel', ['--prod'], { stdio: 'inherit', shell: true });
if (deployResult.status !== 0) {
  fail('vercel --prod gaf een non-zero exit code — controleer de output hierboven.');
}

console.log('\n=== Post-deploy smoke check ===');
const maxAttempts = 5;
let healthy = false;
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    const res = await fetch(PROD_HEALTH_URL, { cache: 'no-store' });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.status === 'ok') {
      console.log(`✓ ${PROD_HEALTH_URL} → ${res.status} ${JSON.stringify(body)}`);
      healthy = true;
      break;
    }
    console.log(`Poging ${attempt}/${maxAttempts}: ${res.status} ${JSON.stringify(body)}`);
  } catch (err) {
    console.log(`Poging ${attempt}/${maxAttempts}: fetch faalde — ${err.message}`);
  }
  if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 3000));
}

if (!healthy) {
  fail(
    `Deploy is gepusht, maar ${PROD_HEALTH_URL} rapporteert niet gezond na ${maxAttempts} pogingen. ` +
    'Controleer de Vercel-logs en overweeg een rollback ("vercel rollback") voordat je verder gaat.'
  );
}

console.log('\n✓ Deploy succesvol en gezond.');
