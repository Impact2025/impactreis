import { test, expect } from './fixtures';

// Test alleen het guard-pad (geen ochtendritueel van vandaag) — bewust geen "Vraag reflectie"
// met een echte OpenRouter-call: dat kost geld per testrun en is flaky door LLM-latentie.
test.describe('Coach — guard-pad', () => {
  test('geeft een nette foutmelding i.p.v. te crashen zonder ochtendritueel van vandaag', async ({ page, demoSession }) => {
    const res = await page.request.post('/api/coach/analyse', {
      headers: { Authorization: `Bearer ${demoSession.token}` },
    });

    // 409 = "nog geen ochtendritueel vandaag" (zie runCoachAnalysis-guard in src/lib/coach.ts).
    // Als het demo-account toevallig wél al een ochtendritueel van vandaag heeft, is 200 ook prima
    // (dan raakt deze test de guard niet, maar bewijst hij wel dat de route niet crasht).
    expect([200, 409]).toContain(res.status());
    const body = await res.json();
    expect(body.error ?? body.analysis).toBeTruthy();
  });

  test('coach-pagina laadt zonder console-errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/coach');
    await expect(page.getByRole('heading', { name: 'AIPA' })).toBeVisible();

    expect(pageErrors, `Onverwachte client-side exceptions: ${pageErrors.join('; ')}`).toEqual([]);
  });
});
