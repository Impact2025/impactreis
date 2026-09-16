import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { checkRateLimit, rateLimitResponse, clientIp } from '../rate-limit';

// Enige plek die bepaalt of een AI/auth/lead-gen-aanvraag doorgaat of een 429 krijgt -- een
// regressie hier zet in één klap alle rate limiting uit (fail-open) of blokkeert alles (fail-closed
// op elke aanvraag), dus dit verdient een echte test i.p.v. alleen handmatig proberen.

const { sql } = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock('../db', () => ({ sql }));

function fakeRequest(headers: Record<string, string> = {}): NextRequest {
  return { headers: new Headers(headers) } as NextRequest;
}

describe('checkRateLimit', () => {
  beforeEach(() => sql.mockReset());

  it('staat de aanvraag toe zolang de teller onder de limiet blijft', async () => {
    sql.mockResolvedValue([{ count: 3 }]);

    const result = await checkRateLimit('coach-chat:1', 20, 60);

    expect(result).toEqual({ allowed: true, remaining: 17, limit: 20 });
  });

  it('staat de aanvraag nog toe als de teller precies op de limiet uitkomt', async () => {
    sql.mockResolvedValue([{ count: 20 }]);

    const result = await checkRateLimit('coach-chat:1', 20, 60);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('blokkeert zodra de teller de limiet overschrijdt', async () => {
    sql.mockResolvedValue([{ count: 21 }]);

    const result = await checkRateLimit('coach-chat:1', 20, 60);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('houdt gebruikers/routes gescheiden via de bucket-key', async () => {
    sql.mockResolvedValueOnce([{ count: 1 }]).mockResolvedValueOnce([{ count: 1 }]);

    await checkRateLimit('login:1.2.3.4', 10, 60);
    await checkRateLimit('login:5.6.7.8', 10, 60);

    expect(sql).toHaveBeenCalledTimes(2);
  });
});

describe('rateLimitResponse', () => {
  beforeEach(() => sql.mockReset());

  it('geeft null terug (geen blokkade) als de limiet niet overschreden is', async () => {
    sql.mockResolvedValue([{ count: 1 }]);

    const response = await rateLimitResponse('coach-chat:1', 20, 60);

    expect(response).toBeNull();
  });

  it('geeft een 429 met Retry-After terug zodra de limiet overschreden is', async () => {
    sql.mockResolvedValue([{ count: 21 }]);

    const response = await rateLimitResponse('coach-chat:1', 20, 60);

    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
    expect(response!.headers.get('Retry-After')).toBe('60');
  });
});

describe('clientIp', () => {
  it('gebruikt het eerste adres uit x-forwarded-for', () => {
    const ip = clientIp(fakeRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }));
    expect(ip).toBe('1.2.3.4');
  });

  it('valt terug op x-real-ip als x-forwarded-for ontbreekt', () => {
    const ip = clientIp(fakeRequest({ 'x-real-ip': '9.9.9.9' }));
    expect(ip).toBe('9.9.9.9');
  });

  it('geeft "unknown" terug als geen van beide headers aanwezig is', () => {
    const ip = clientIp(fakeRequest());
    expect(ip).toBe('unknown');
  });
});
