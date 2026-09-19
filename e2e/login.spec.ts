import { test, expect } from '@playwright/test';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// De echte, dagelijkse login is uitsluitend magic-link (zie src/app/auth/login/page.tsx) — er is
// geen wachtwoordveld meer in de UI. Dit was tot nu toe de grootste onbewaakte flow in de app
// (zie STATUS.md): elke andere e2e-spec logt in via de demo-login-fixture en slaat dit scherm
// dus over. Turnstile staat in deze omgeving uit (geen NEXT_PUBLIC_TURNSTILE_SITE_KEY), dus de
// knop is hier niet geblokkeerd door een captcha-token.

test.describe('Login (magic link)', () => {
  test('een niet-uitgenodigd e-mailadres krijgt geen inloglink', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByPlaceholder('E-mailadres').fill(`niet-uitgenodigd-${Date.now()}@example.com`);
    await page.getByRole('button', { name: /Stuur inloglink/ }).click();

    await expect(page.getByText('Versturen van de inloglink is mislukt')).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('een bestaand account (demo) doorstaat de invite-gate: er wordt een verification-token aangemaakt', async ({ page }) => {
    // Verifieert via de database i.p.v. de UI-redirect, omdat de daadwerkelijke e-mailbezorging
    // afhangt van Resend-accountconfiguratie (sandbox-restricties op het "from"-domein) die geen
    // onderdeel is van de invite-gate-logica die deze test dekt. Een verification-token in de DB
    // bewijst dat isEmailInvited() de demo-user doorliet EN dat de DrizzleAdapter het token
    // daadwerkelijk persisteerde — de twee stappen die vóór de eigenlijke send gebeuren.
    const demoEmail = process.env.DEMO_EMAIL || 'demo@impactreis.nl';
    const before = await sql`SELECT COUNT(*) FROM auth_verification_tokens WHERE identifier = ${demoEmail}`;
    const countBefore = Number(before[0].count);

    await page.goto('/auth/login');
    await page.getByPlaceholder('E-mailadres').fill(demoEmail);
    await page.getByRole('button', { name: /Stuur inloglink/ }).click();

    await expect(async () => {
      const after = await sql`SELECT COUNT(*) FROM auth_verification_tokens WHERE identifier = ${demoEmail}`;
      expect(Number(after[0].count)).toBeGreaterThan(countBefore);
    }).toPass({ timeout: 10000 });
  });
});
