import { test, expect } from './fixtures';

// Regressietest voor de stap-volgorde-bug van 2026-09-02: de wizard startte op 'intentie' (2/6)
// i.p.v. de nieuwe eerste stap 'dagtype' (1/6), omdat de initiële React-state niet was bijgewerkt
// toen de stap werd toegevoegd. Dit test alleen de wizard-navigatie, niet het opslaan (dat zou
// een echt daily_logs-record voor vandaag in het demo-account overschrijven).
test.describe('Ochtend Ritueel — dagtype-stap', () => {
  test('start op de Dagtype-stap (1/6), niet op Intentie', async ({ page }) => {
    await page.goto('/morning');

    // Als het ritueel van vandaag al is ingevuld toont de pagina een samenvatting i.p.v. de
    // wizard — dan is deze test niet van toepassing voor vandaag.
    const alreadyDone = page.getByText('Vandaag al voltooid');
    if (await alreadyDone.isVisible().catch(() => false)) {
      test.skip(true, 'Ochtendritueel van vandaag is al ingevuld in het demo-account');
    }

    await expect(page.getByText('1/6')).toBeVisible();
    await expect(page.getByText('Wat voor dag wordt het?')).toBeVisible();
  });

  test('pre-work-checklist verschijnt bij Focus/Buffer Day, niet bij Free Day', async ({ page }) => {
    await page.goto('/morning');
    if (await page.getByText('Vandaag al voltooid').isVisible().catch(() => false)) {
      test.skip(true, 'Ochtendritueel van vandaag is al ingevuld in het demo-account');
    }

    await page.getByText('Focus Day').click();
    await expect(page.getByText('Pre-work rituelen')).toBeVisible();
    await expect(page.getByText('Daglicht gehad')).toBeVisible();

    await page.getByText('Free Day').click();
    await expect(page.getByText('Pre-work rituelen')).toHaveCount(0);
  });
});
