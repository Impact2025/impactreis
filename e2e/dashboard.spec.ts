import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
  test('laadt zonder console-errors met Golden Egg en Mijn Routines', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/dashboard');

    // Ruimere timeout: fetchData() doet 8 parallelle calls (incl. Google Calendar en het
    // proactieve coach-signaal) — in dev-mode met een koude Turbopack-compilatie kan dat de
    // standaard 5s overschrijden zonder dat er iets mis is.
    await expect(page.getByText('GOLDEN EGG')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Mijn Routines')).toBeVisible();

    expect(pageErrors, `Onverwachte client-side exceptions: ${pageErrors.join('; ')}`).toEqual([]);
  });
});
