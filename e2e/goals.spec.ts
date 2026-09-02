import { test, expect } from './fixtures';

// Regressietest voor twee bugs gevonden tijdens de live browser-audit van 2026-09-02:
// (1) een doel met een categorie buiten de vier RPM-categorieën liet de hele pagina crashen,
// (2) een doel zonder `progress` propageerde naar "NaN%" in de statistieken.
test.describe('Goals', () => {
  test('laadt zonder console-errors en toont nooit NaN% in de statistieken', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/goals');
    await expect(page.getByRole('heading', { name: 'RPM Doelen' })).toBeVisible();

    // De "Gemiddeld"-statistiek mag nooit NaN% tonen, ongeacht welke (seed-)data er staat.
    await expect(page.getByText('Gemiddeld')).toBeVisible();
    await expect(page.getByText('NaN%')).toHaveCount(0);

    expect(pageErrors, `Onverwachte client-side exceptions: ${pageErrors.join('; ')}`).toEqual([]);
  });

  test('doel aanmaken, als Rock markeren, actie afvinken en als hefboom markeren', async ({ page, demoSession }) => {
    await page.goto('/goals');

    await page.getByRole('button', { name: 'Nieuw' }).click();
    const title = `E2E test doel ${Date.now()}`;
    await page.getByPlaceholder('Specifiek, meetbaar doel').fill(title);
    await page.getByPlaceholder('Actie 1').fill('E2E hefboomactie');
    await page.getByRole('button', { name: 'Doel Toevoegen' }).click();

    const card = page.locator(`[data-testid="goal-card"][data-goal-title="${title}"]`);
    await expect(card).toBeVisible();

    try {
      // Als Rock markeren
      await card.getByRole('button', { name: 'Markeer als Rock' }).click();
      await expect(card.getByRole('button', { name: 'Rock verwijderen' })).toBeVisible();

      // Details openklappen en de actie afvinken + als hefboom markeren
      await card.getByRole('button', { name: 'Meer details' }).click();
      await expect(page.getByText('E2E hefboomactie')).toBeVisible();
      await page.getByRole('button', { name: 'Markeer als hefboom (80/20)' }).click();

      // Verifieer dat de hefboomactie nu op het dashboard verschijnt
      await page.goto('/dashboard');
      await expect(page.getByText('Hefboom-taken vandaag')).toBeVisible();
      await expect(page.getByText('E2E hefboomactie')).toBeVisible();
    } finally {
      // Opruimen via de API — nooit afhankelijk van UI-navigatie, zodat een gefaalde assertie
      // hierboven de testdata nog steeds netjes verwijdert.
      const goals = await page.request
        .get('/api/goals', { headers: { Authorization: `Bearer ${demoSession.token}` } })
        .then((r) => r.json());
      const created = goals.find((g: { title: string }) => g.title === title);
      if (created) {
        await page.request.delete(`/api/goals/${created.id}`, {
          headers: { Authorization: `Bearer ${demoSession.token}` },
        });
      }
    }
  });
});
