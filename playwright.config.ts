import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

// De Playwright-testrunner is een los Node-proces van de Next.js dev-server — .env.local wordt
// hier niet automatisch geladen (dat doet alleen Next.js zelf), dus expliciet inladen zodat
// DATABASE_URL/DEMO_PASSWORD beschikbaar zijn in e2e/fixtures.ts.
config({ path: '.env.local' });
config({ path: '.env' });

// Draait tegen het gedeelde demo-account (demo@impactreis.nl, organization_id "demo-impactreis")
// in dezelfde Neon-database als productie — er bestaat geen apart test/staging-endpoint. Nooit
// tegen de eigen organisatie draaien. Vereist DATABASE_URL + DEMO_PASSWORD in .env/.env.local.
// Zie e2e/fixtures.ts voor hoe de demo-sessie wordt opgezet.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // specs delen hetzelfde demo-account — parallel draaien geeft race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
