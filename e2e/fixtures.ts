import { test as base, expect } from '@playwright/test';

interface DemoSession {
  token: string;
  user: { id: number; email: string };
}

// Sessies zijn client-side JWT in localStorage (geen cookies) — zie src/lib/auth.ts. Deze fixture
// logt één keer in via /api/auth/demo-login (net als de "Demo"-knop op de loginpagina) en
// injecteert het resultaat vóór elke paginanavigatie, zodat specs nooit door de login-UI heen
// hoeven te klikken.
export const test = base.extend<{ demoSession: DemoSession }>({
  demoSession: async ({ request }, use) => {
    const res = await request.post('/api/auth/demo-login', {
      data: { password: process.env.DEMO_PASSWORD },
    });
    if (!res.ok()) {
      throw new Error(
        `Demo-login mislukt (${res.status()}) — controleer DEMO_PASSWORD in .env/.env.local. Body: ${await res.text()}`
      );
    }
    const body = await res.json();
    await use({ token: body.token, user: body.user });
  },

  context: async ({ context, demoSession }, use) => {
    await context.addInitScript(
      ([token, userJson]) => {
        localStorage.setItem('token', token as string);
        localStorage.setItem('user', userJson as string);
      },
      [demoSession.token, JSON.stringify(demoSession.user)]
    );

    await use(context);
  },
});

export { expect };
