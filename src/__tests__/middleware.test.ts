import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import { TURNSTILE_GATE_COOKIE } from '../lib/verified-gate';

// Regressietest voor twee bugs (code review 2026-09-19) in dezelfde captcha-gate voor
// /api/auth/signin/resend (het echte magic-link-verstuur-endpoint):
// 1. De gate-cookie was niet single-use — één opgeloste Turnstile-captcha bleef de volle 2
//    minuten geldig, genoeg om er met een los script meerdere sends mee te doen.
// 2. Er was geen eigen rate limit op deze route, terwijl login/register dat allebei wel hebben.

const { isValidVerifiedGateToken } = vi.hoisted(() => ({ isValidVerifiedGateToken: vi.fn() }));
vi.mock('../lib/verified-gate', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/verified-gate')>()),
  isValidVerifiedGateToken,
}));

const { rateLimitResponse } = vi.hoisted(() => ({ rateLimitResponse: vi.fn() }));
vi.mock('../lib/rate-limit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/rate-limit')>()),
  rateLimitResponse,
}));

function magicLinkRequest(cookieValue?: string): NextRequest {
  return new NextRequest('http://localhost/api/auth/signin/resend', {
    method: 'POST',
    headers: {
      ...(cookieValue ? { cookie: `${TURNSTILE_GATE_COOKIE}=${cookieValue}` } : {}),
      'x-forwarded-for': '203.0.113.1',
    },
  });
}

describe('middleware — magic-link-send gate', () => {
  const originalSecret = process.env.TURNSTILE_SECRET_KEY;

  beforeEach(() => {
    isValidVerifiedGateToken.mockReset();
    rateLimitResponse.mockReset();
    rateLimitResponse.mockResolvedValue(null);
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
  });

  afterEach(() => {
    process.env.TURNSTILE_SECRET_KEY = originalSecret;
  });

  it('laat een geldige, ongebruikte gate-cookie door en verwijdert deze daarna (single-use)', async () => {
    isValidVerifiedGateToken.mockResolvedValue(true);

    const res = await middleware(magicLinkRequest('geldig-token'));

    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(429);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain(`${TURNSTILE_GATE_COOKIE}=`);
    expect(setCookie.toLowerCase()).toMatch(/expires=thu, 01 jan 1970|max-age=0/);
  });

  it('weigert een ontbrekende of ongeldige gate-cookie met 403', async () => {
    isValidVerifiedGateToken.mockResolvedValue(false);

    const res = await middleware(magicLinkRequest());

    expect(res.status).toBe(403);
  });

  it('weigert met 429 zodra de rate limit voor dit IP is bereikt, ongeacht een geldige cookie', async () => {
    isValidVerifiedGateToken.mockResolvedValue(true);
    rateLimitResponse.mockResolvedValue(
      new (await import('next/server')).NextResponse(JSON.stringify({ error: 'Te veel aanvragen.' }), { status: 429 })
    );

    const res = await middleware(magicLinkRequest('geldig-token'));

    expect(res.status).toBe(429);
  });

  it('slaat de Turnstile-check over als TURNSTILE_SECRET_KEY niet geconfigureerd is (bv. lokale dev)', async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    isValidVerifiedGateToken.mockResolvedValue(false);

    const res = await middleware(magicLinkRequest());

    expect(res.status).not.toBe(403);
  });
});
