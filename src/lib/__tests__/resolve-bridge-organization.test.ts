import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveBridgeOrganization } from '../coach';

// Regressietest voor een bug (code review 2026-09-19): client_bridge_tokens is per organisatie,
// niet per gebruiker, en resolveBridgeOrganization koos altijd de gebruiker met het laagste id in
// die organisatie ("ORDER BY id ASC LIMIT 1") zonder te checken of er meer dan één was. In een
// organisatie met meerdere gebruikers werd bridge-data (logs/wins/focus/weekly-reviews vanuit
// ImpactOS) dus altijd op naam van de eerst-aangemaakte gebruiker geschreven, ongeacht voor wie
// het request eigenlijk bedoeld was — stil fout, geen enkele foutmelding.

const { sql } = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock('../db', () => ({ sql }));

const { notifyAdminCronFailure } = vi.hoisted(() => ({ notifyAdminCronFailure: vi.fn() }));
vi.mock('../admin-notify', () => ({ notifyAdminCronFailure }));

describe('resolveBridgeOrganization', () => {
  beforeEach(() => {
    sql.mockReset();
    notifyAdminCronFailure.mockReset();
    notifyAdminCronFailure.mockResolvedValue(undefined);
  });

  it('geeft de enige gebruiker van de organisatie terug bij een geldig token', async () => {
    sql
      .mockResolvedValueOnce([{ organization_id: 4 }]) // token lookup
      .mockResolvedValueOnce([{ id: 7 }]); // users lookup

    const result = await resolveBridgeOrganization('Bearer geldig-token');

    expect(result).toEqual({ userId: '7', organizationId: 4 });
    expect(notifyAdminCronFailure).not.toHaveBeenCalled();
  });

  it('faalt closed (null) en waarschuwt de admin als de organisatie meer dan één gebruiker heeft, i.p.v. de eerste te gokken', async () => {
    sql
      .mockResolvedValueOnce([{ organization_id: 4 }])
      .mockResolvedValueOnce([{ id: 7 }, { id: 12 }]);

    const result = await resolveBridgeOrganization('Bearer geldig-token');

    expect(result).toBeNull();
    expect(notifyAdminCronFailure).toHaveBeenCalledWith('resolveBridgeOrganization', expect.any(Error));
  });

  it('geeft null terug voor een onbekend token, zonder een gok', async () => {
    sql.mockResolvedValueOnce([]);

    const result = await resolveBridgeOrganization('Bearer onbekend-token');

    expect(result).toBeNull();
  });

  it('geeft null terug zonder Authorization-header', async () => {
    const result = await resolveBridgeOrganization(null);

    expect(result).toBeNull();
    expect(sql).not.toHaveBeenCalled();
  });

  it('geeft null terug als de organisatie (nog) geen gebruikers heeft', async () => {
    sql
      .mockResolvedValueOnce([{ organization_id: 4 }])
      .mockResolvedValueOnce([]);

    const result = await resolveBridgeOrganization('Bearer geldig-token');

    expect(result).toBeNull();
  });
});
