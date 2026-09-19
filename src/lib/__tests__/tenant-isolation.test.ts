import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { sql } from '../db';

// Elke route importeert getAuthContext(), die bij een ontbrekend/ongeldig JWT terugvalt op
// Auth.js' auth() — een importketen die next-auth/next-server niet oplost onder Vitest's
// Vite-resolver (los van deze test, een omgevingsincompatibiliteit). Alle requests hieronder
// hebben een geldig JWT, dus de JWT-tak in getAuthContext() retourneert altijd eerder en auth()
// wordt in de praktijk nooit aangeroepen — dit mockt alleen de tak die deze test niet raakt.
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }));
import { generateToken } from '../auth';
import { GET as getGoals } from '@/app/api/goals/route';
import { GET as getHabits } from '@/app/api/habits/route';
import { GET as getLogs } from '@/app/api/logs/route';
import { GET as getWeeklyGoals } from '@/app/api/weekly-goals/route';
import { GET as getWeeklyReviews } from '@/app/api/weekly-reviews/route';
import { GET as getFocus } from '@/app/api/focus/route';
import { GET as getWins } from '@/app/api/wins/route';

// Integratietest tegen de ECHTE database (zie package.json "test:integration" — vereist
// `--env-file=.env.local` zodat src/test/setup.ts zijn placeholder-DATABASE_URL niet gebruikt).
//
// Runtime-vangnet ontbreekt bewust (RLS is uitgesteld, zie STATUS.md — Neon's HTTP-driver
// behoudt geen sessie-state tussen tagged-template calls) en handmatige code review ("filtert
// deze route wel op organization_id?") schaalt niet over 32 routes. Deze test bewijst voor de
// zeven meest voorkomende, copy-paste-gevoelige lijst-routes dat organisatie A nooit organisatie
// B's rijen terugkrijgt, met twee complete, wegwerpbare organisaties + gebruikers — nooit het
// gedeelde demo-account, dus geen opruim-risico daar.

function fakeRequest(token: string, url: string): NextRequest {
  return { headers: new Headers({ authorization: `Bearer ${token}` }), url } as unknown as NextRequest;
}

interface Tenant {
  orgId: number;
  userId: number;
  token: string;
}

async function createTenant(label: string): Promise<Tenant> {
  const [org] = await sql`INSERT INTO organizations (slug, name) VALUES (${`e2e-isolation-${label}-${Date.now()}`}, ${`E2E Isolation ${label}`}) RETURNING id`;
  const [user] = await sql`INSERT INTO users (organization_id, email) VALUES (${org.id}, ${`e2e-isolation-${label}-${Date.now()}@example.com`}) RETURNING id`;
  return { orgId: org.id, userId: user.id, token: generateToken(user.id, `e2e-isolation-${label}@example.com`) };
}

async function deleteTenant(tenant: Tenant) {
  await sql`DELETE FROM habits WHERE organization_id = ${tenant.orgId}`;
  await sql`DELETE FROM goals WHERE organization_id = ${tenant.orgId}`;
  await sql`DELETE FROM daily_logs WHERE organization_id = ${tenant.orgId}`;
  await sql`DELETE FROM weekly_goals WHERE organization_id = ${tenant.orgId}`;
  await sql`DELETE FROM weekly_reviews WHERE organization_id = ${tenant.orgId}`;
  await sql`DELETE FROM focus_sessions WHERE organization_id = ${tenant.orgId}`;
  await sql`DELETE FROM wins WHERE organization_id = ${tenant.orgId}`;
  await sql`DELETE FROM users WHERE id = ${tenant.userId}`;
  await sql`DELETE FROM organizations WHERE id = ${tenant.orgId}`;
}

async function seedRow(tenant: Tenant, marker: string) {
  await sql`INSERT INTO habits (user_id, organization_id, name) VALUES (${tenant.userId}, ${tenant.orgId}, ${marker})`;
  await sql`INSERT INTO goals (id, user_id, organization_id, data) VALUES (${`${marker}-goal`}, ${tenant.userId}, ${tenant.orgId}, ${JSON.stringify({ title: marker })})`;
  await sql`INSERT INTO daily_logs (user_id, organization_id, type, date_string, data) VALUES (${tenant.userId}, ${tenant.orgId}, 'morning', '2026-01-01', ${JSON.stringify({ marker })})`;
  await sql`INSERT INTO weekly_goals (user_id, organization_id, week_number, goals) VALUES (${tenant.userId}, ${tenant.orgId}, '2026-W01', ${JSON.stringify([marker])})`;
  await sql`INSERT INTO weekly_reviews (user_id, organization_id, week_number, data) VALUES (${tenant.userId}, ${tenant.orgId}, '2026-W01', ${JSON.stringify({ marker })})`;
  await sql`INSERT INTO focus_sessions (user_id, organization_id, date, start_time, goal) VALUES (${tenant.userId}, ${tenant.orgId}, '2026-01-01', '09:00', ${marker})`;
  await sql`INSERT INTO wins (user_id, organization_id, title, category, date) VALUES (${tenant.userId}, ${tenant.orgId}, ${marker}, 'business', '2026-01-01')`;
}

describe('Tenant-isolatie op de zeven meest voorkomende lijst-routes', () => {
  let tenantA: Tenant;
  let tenantB: Tenant;

  beforeAll(async () => {
    tenantA = await createTenant('a');
    tenantB = await createTenant('b');
    await seedRow(tenantA, `marker-a-${tenantA.orgId}`);
    await seedRow(tenantB, `marker-b-${tenantB.orgId}`);
  });

  afterAll(async () => {
    await deleteTenant(tenantA);
    await deleteTenant(tenantB);
  });

  it('GET /api/habits toont nooit een andere organisatie se rijen', async () => {
    const res = await getHabits(fakeRequest(tenantA.token, 'http://localhost/api/habits'));
    const body = await res.json();
    const names = body.map((h: { name: string }) => h.name);
    expect(names).toContain(`marker-a-${tenantA.orgId}`);
    expect(names).not.toContain(`marker-b-${tenantB.orgId}`);
  });

  it('GET /api/goals toont nooit een andere organisatie se rijen', async () => {
    const res = await getGoals(fakeRequest(tenantA.token, 'http://localhost/api/goals'));
    const body = await res.json();
    const ids = body.map((g: { id: string }) => g.id);
    expect(ids).toContain(`marker-a-${tenantA.orgId}-goal`);
    expect(ids).not.toContain(`marker-b-${tenantB.orgId}-goal`);
  });

  it('GET /api/logs toont nooit een andere organisatie se rijen', async () => {
    const res = await getLogs(fakeRequest(tenantA.token, 'http://localhost/api/logs'));
    const body = await res.json();
    const markers = body.map((l: { data: unknown }) => (typeof l.data === 'string' ? JSON.parse(l.data).marker : (l.data as { marker?: string } | null)?.marker));
    expect(markers).toContain(`marker-a-${tenantA.orgId}`);
    expect(markers).not.toContain(`marker-b-${tenantB.orgId}`);
  });

  it('GET /api/weekly-goals toont nooit een andere organisatie se rijen', async () => {
    const res = await getWeeklyGoals(fakeRequest(tenantA.token, 'http://localhost/api/weekly-goals'));
    const body = await res.json();
    const serialized = JSON.stringify(body);
    expect(serialized).toContain(`marker-a-${tenantA.orgId}`);
    expect(serialized).not.toContain(`marker-b-${tenantB.orgId}`);
  });

  it('GET /api/weekly-reviews toont nooit een andere organisatie se rijen', async () => {
    const res = await getWeeklyReviews(fakeRequest(tenantA.token, 'http://localhost/api/weekly-reviews'));
    const body = await res.json();
    const serialized = JSON.stringify(body);
    expect(serialized).toContain(`marker-a-${tenantA.orgId}`);
    expect(serialized).not.toContain(`marker-b-${tenantB.orgId}`);
  });

  it('GET /api/focus toont nooit een andere organisatie se rijen', async () => {
    const res = await getFocus(fakeRequest(tenantA.token, 'http://localhost/api/focus'));
    const body = await res.json();
    const goals = body.map((s: { goal: string }) => s.goal);
    expect(goals).toContain(`marker-a-${tenantA.orgId}`);
    expect(goals).not.toContain(`marker-b-${tenantB.orgId}`);
  });

  it('GET /api/wins toont nooit een andere organisatie se rijen', async () => {
    const res = await getWins(fakeRequest(tenantA.token, 'http://localhost/api/wins'));
    const body = await res.json();
    const titles = body.map((w: { title: string }) => w.title);
    expect(titles).toContain(`marker-a-${tenantA.orgId}`);
    expect(titles).not.toContain(`marker-b-${tenantB.orgId}`);
  });
});
