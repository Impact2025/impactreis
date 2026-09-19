import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isEmailInvited } from '../invites';

// Enige poort tussen "willekeurig e-mailadres" en "krijgt een magic-link + account" (zie
// auth.ts sendVerificationRequest). Een regressie hier zet de invite-only-belofte in één klap
// uit — dit verdient een echte test i.p.v. alleen handmatig proberen met één bekend adres.

const { sql } = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock('../db', () => ({ sql }));

describe('isEmailInvited', () => {
  beforeEach(() => sql.mockReset());

  it('staat een bestaande gebruiker altijd toe, ongeacht de invited_emails-tabel', async () => {
    sql.mockResolvedValueOnce([{ id: 1 }]);

    const result = await isEmailInvited('bestaande@example.com');

    expect(result).toBe(true);
    expect(sql).toHaveBeenCalledTimes(1);
  });

  it('staat een nieuw e-mailadres toe als het op de invite-lijst staat', async () => {
    sql.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 5 }]);

    const result = await isEmailInvited('uitgenodigd@example.com');

    expect(result).toBe(true);
  });

  it('weigert een nieuw, niet-uitgenodigd e-mailadres', async () => {
    sql.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await isEmailInvited('onbekend@example.com');

    expect(result).toBe(false);
  });

  it('normaliseert hoofdletters en spaties vóór de lookup', async () => {
    sql.mockResolvedValueOnce([{ id: 1 }]);

    await isEmailInvited('  Test@Example.com  ');

    const [strings, ...values] = sql.mock.calls[0];
    expect(values[0]).toBe('test@example.com');
  });
});
