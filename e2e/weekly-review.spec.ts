import { test, expect } from './fixtures';

function currentQuarter(): string {
  const now = new Date();
  return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
}

test.describe('Weekly Review — Rocks-sectie', () => {
  test('toont een actieve Rock met de drie statusknoppen', async ({ page, demoSession }) => {
    const title = `E2E rock ${Date.now()}`;
    const headers = { Authorization: `Bearer ${demoSession.token}` };

    const created = await page.request
      .post('/api/goals', { headers, data: { title, category: 'business' } })
      .then((r) => r.json());
    await page.request.put(`/api/goals/${created.id}`, {
      headers,
      data: { isRock: true, quarter: currentQuarter() },
    });

    try {
      await page.goto('/weekly-review');
      const rockSection = page.getByTestId('rocks-section');
      await expect(rockSection).toBeVisible();
      await expect(rockSection.getByText(title)).toBeVisible();
      await expect(rockSection.getByRole('button', { name: 'Op koers' })).toBeVisible();
      await expect(rockSection.getByRole('button', { name: 'Loopt risico' })).toBeVisible();
      await expect(rockSection.getByRole('button', { name: 'Klaar' })).toBeVisible();
    } finally {
      await page.request.delete(`/api/goals/${created.id}`, { headers });
    }
  });
});
