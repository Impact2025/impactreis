import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { getAuthContext } from '../auth-context';

// getAuthContext() is the single choke point every one of the 32 tenant-aware API routes calls
// to resolve { userId, organizationId } — a regression here silently breaks tenant isolation
// everywhere at once, so this is the highest-leverage place to guard with a real test rather
// than relying only on the manual smoketests done during the multi-tenant migration.

const { authenticateToken } = vi.hoisted(() => ({ authenticateToken: vi.fn() }));
vi.mock('../auth', () => ({ authenticateToken }));

const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth }));

const { sql } = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock('../db', () => ({ sql }));

function fakeRequest(): NextRequest {
  return {} as NextRequest;
}

describe('getAuthContext', () => {
  beforeEach(() => {
    authenticateToken.mockReset();
    auth.mockReset();
    sql.mockReset();
  });

  it('herleidt organizationId via het bestaande JWT-token, zonder Auth.js aan te roepen', async () => {
    authenticateToken.mockResolvedValue(1);
    sql.mockResolvedValue([{ organization_id: 1 }]);

    const result = await getAuthContext(fakeRequest());

    expect(result).toEqual({ userId: 1, organizationId: 1 });
    expect(auth).not.toHaveBeenCalled();
  });

  it('valt terug op een Auth.js-sessie (magic link) als er geen geldig JWT is', async () => {
    authenticateToken.mockResolvedValue(null);
    auth.mockResolvedValue({ user: { email: 'nieuwe-klant@example.com' } });
    sql.mockResolvedValue([{ id: 7, organization_id: 2 }]);

    const result = await getAuthContext(fakeRequest());

    expect(result).toEqual({ userId: 7, organizationId: 2 });
  });

  it('geeft null terug als geen van beide een geldige gebruiker oplevert', async () => {
    authenticateToken.mockResolvedValue(null);
    auth.mockResolvedValue(null);

    const result = await getAuthContext(fakeRequest());

    expect(result).toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });

  it('geeft null terug als de Auth.js-sessie een e-mail heeft die niet in users staat', async () => {
    authenticateToken.mockResolvedValue(null);
    auth.mockResolvedValue({ user: { email: 'onbekend@example.com' } });
    sql.mockResolvedValue([]);

    const result = await getAuthContext(fakeRequest());

    expect(result).toBeNull();
  });

  it('geeft organizationId: null door als een gebruiker (nog) geen organisatie heeft', async () => {
    authenticateToken.mockResolvedValue(3);
    sql.mockResolvedValue([{ organization_id: null }]);

    const result = await getAuthContext(fakeRequest());

    expect(result).toEqual({ userId: 3, organizationId: null });
  });

  it('twee verschillende tenants krijgen elk hun eigen organizationId terug', async () => {
    authenticateToken.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    sql
      .mockResolvedValueOnce([{ organization_id: 1 }])
      .mockResolvedValueOnce([{ organization_id: 5 }]);

    const first = await getAuthContext(fakeRequest());
    const second = await getAuthContext(fakeRequest());

    expect(first?.organizationId).toBe(1);
    expect(second?.organizationId).toBe(5);
    expect(first?.organizationId).not.toBe(second?.organizationId);
  });
});
