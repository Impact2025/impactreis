import { neon } from '@neondatabase/serverless';
import { test, expect } from './fixtures';

// De 8-staps intake-wizard (src/app/onboarding/page.tsx) is de eerste indruk van elke nieuwe
// gebruiker en de enige plek die /api/onboarding/complete aanroept — tot nu toe volledig
// onbewaakt door e2e (zie STATUS.md). src/lib/__tests__/onboarding.test.ts dekt al of het
// payload-schema en de wizard-opties synchroon lopen; deze test dekt het andere risico: of de
// klik-flow zelf (canProceed()-gating, stap-navigatie, submit) daadwerkelijk tot een geslaagde
// aanroep en redirect leidt.
//
// Draait tegen het gedeelde demo-account (zie playwright.config.ts) — dat heeft normaal al een
// voltooid onboarding-profiel, dus de bestaande rij wordt hier tijdelijk opzij gezet en na afloop
// altijd teruggezet, ook als de test faalt.

const sql = neon(process.env.DATABASE_URL!);

test.describe('Onboarding-wizard', () => {
  test('doorloopt alle 8 stappen en komt met een opgeslagen profiel op het dashboard uit', async ({ page, demoSession }) => {
    const userId = demoSession.user.id;
    const [existing] = await sql`SELECT * FROM onboarding_profiles WHERE user_id = ${userId}`;
    const [existingUser] = await sql`SELECT name FROM users WHERE id = ${userId}`;

    try {
      await sql`UPDATE onboarding_profiles SET completed = false WHERE user_id = ${userId}`;

      await page.goto('/onboarding');
      await expect(page.getByText('Stap 1 van 8')).toBeVisible({ timeout: 10000 });

      // Stap 1 — naam + challenger
      await page.getByPlaceholder('Voornaam').fill('E2E Test');
      await page.getByRole('button', { name: /Marcus — Mannelijk/ }).click();
      await page.getByRole('button', { name: 'Volgende' }).click();

      // Stap 2 — naam van de challenger (default staat al klaar als placeholder, niet als waarde)
      await expect(page.getByText('Stap 2 van 8')).toBeVisible();
      await page.getByPlaceholder('Marcus').fill('Marcus');
      await page.getByRole('button', { name: 'Volgende' }).click();

      // Stap 3 — bedrijfsmodel & omvang (eerste chip van elke groep)
      await expect(page.getByText('Stap 3 van 8')).toBeVisible();
      await page.getByRole('button', { name: 'Zakelijke Dienstverlening' }).click();
      await page.getByRole('button', { name: '1 (Solo)' }).click();
      await page.getByRole('button', { name: 'Uurtarief / Declarabel' }).click();
      await page.getByRole('button', { name: 'Volgende' }).click();

      // Stap 4 — tijdvreters (minstens 1)
      await expect(page.getByText('Stap 4 van 8')).toBeVisible();
      await page.getByRole('button', { name: /Overlopende inbox/ }).click();
      await page.getByRole('button', { name: 'Volgende' }).click();

      // Stap 5 — vluchtgedrag
      await expect(page.getByText('Stap 5 van 8')).toBeVisible();
      await page.getByRole('button', { name: /Te lang pielen aan website/ }).click();
      await page.getByRole('button', { name: 'Volgende' }).click();

      // Stap 6 — kwartaalhefboom
      await expect(page.getByText('Stap 6 van 8')).toBeVisible();
      await page.getByRole('button', { name: 'Capaciteit' }).click();
      await page.getByRole('button', { name: 'Volgende' }).click();

      // Stap 7 — pijnlijke consequentie (preset-chip, deepening overslaan)
      await expect(page.getByText('Stap 7 van 8')).toBeVisible();
      await page.getByRole('button', { name: /Mijn grootste concurrent/ }).click();
      await page.getByRole('button', { name: 'Volgende' }).click();

      // Stap 8 — ritme (defaults zijn prima) — indienen
      await expect(page.getByText('Stap 8 van 8')).toBeVisible();
      await page.getByRole('button', { name: 'Start met dit ritme' }).click();

      await page.waitForURL('**/dashboard', { timeout: 15000 });

      const [saved] = await sql`SELECT completed, profile FROM onboarding_profiles WHERE user_id = ${userId}`;
      expect(saved.completed).toBe(true);
      expect(saved.profile.businessDna.industry).toBe('zakelijke_dienstverlening');
      expect(saved.profile.consequenceModule.description).toContain('grootste concurrent');
    } finally {
      await sql`UPDATE users SET name = ${existingUser?.name ?? null} WHERE id = ${userId}`;
      if (existing) {
        await sql`
          UPDATE onboarding_profiles
          SET completed = ${existing.completed}, profile = ${JSON.stringify(existing.profile)}, conversation = ${JSON.stringify(existing.conversation)}
          WHERE user_id = ${userId}
        `;
      } else {
        await sql`DELETE FROM onboarding_profiles WHERE user_id = ${userId}`;
      }
    }
  });
});
