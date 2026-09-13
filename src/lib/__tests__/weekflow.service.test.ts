import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getDayType,
  isAfter5PM,
  getCurrentHour,
  getToday,
  getWeekdayOf,
  getDateDaysAgo,
} from '../weekflow.service';

// Deze helpers bepalen "vandaag"/"na 17:00" voor zowel de server (ritual-status.service.ts,
// draait op Vercel — vaak UTC) als de browser (NL-lokaal). Ze moeten daarom altijd
// Europe/Amsterdam gebruiken, nooit de tijdzone van het proces dat ze uitvoert — anders lopen
// server en client rond middernacht/17:00 uit elkaar. Deze tests zetten de systeemtijd expliciet
// op UTC-instanten waarvoor "UTC-naief" en "Amsterdam-bewust" een ander antwoord geven, zodat een
// regressie naar `new Date().getHours()`/`new Date().getDay()` hier meteen faalt.
describe('weekflow.service — Amsterdam-tijdzone', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('rekent middernacht in Amsterdam correct door, ook als UTC nog de vorige dag is (zomertijd, UTC+2)', () => {
    // 2026-09-08 22:30 UTC = 2026-09-09 00:30 Amsterdam (CEST, UTC+2)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-08T22:30:00Z'));

    expect(getToday()).toBe('2026-09-09');
  });

  it('beschouwt 17:00 Amsterdamse tijd als grens, niet 17:00 UTC (zomertijd, UTC+2)', () => {
    // 2026-09-08 15:30 UTC = 2026-09-08 17:30 Amsterdam
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-08T15:30:00Z'));

    expect(getCurrentHour()).toBe(17);
    expect(isAfter5PM()).toBe(true);
  });

  it('is nog niet "na 17:00" zolang het in Amsterdam nog geen 17:00 is, ook al is het UTC al later', () => {
    // 2026-09-08 14:30 UTC = 2026-09-08 16:30 Amsterdam
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-08T14:30:00Z'));

    expect(isAfter5PM()).toBe(false);
  });

  it('herkent een winterse dag (CET, UTC+1) ook correct', () => {
    // 2026-01-08 16:30 UTC = 2026-01-08 17:30 Amsterdam
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-08T16:30:00Z'));

    expect(isAfter5PM()).toBe(true);
  });

  it('classificeert dagtype op basis van de Amsterdamse kalenderdag', () => {
    vi.useFakeTimers();
    // 2026-09-08 22:30 UTC = dinsdag 2026-09-09 00:30 Amsterdam
    vi.setSystemTime(new Date('2026-09-08T22:30:00Z'));
    expect(getDayType()).toBe('weekday');
  });

  it('getWeekdayOf leest een YYYY-MM-DD datumstring tijdzone-onafhankelijk (geen new Date(str).getDay())', () => {
    expect(getWeekdayOf('2024-01-01')).toBe(1); // maandag (algemeen bekend: Nieuwjaarsdag 2024 was een maandag)
    expect(getWeekdayOf('2000-01-01')).toBe(6); // zaterdag (Y2K)
  });

  it('getDateDaysAgo telt kalenderdagen terug vanaf de Amsterdamse "vandaag", niet vanaf UTC-middernacht', () => {
    // 2026-09-08 22:30 UTC = 2026-09-09 00:30 Amsterdam -> "vandaag" is 09-09, "gisteren" dus 09-08
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-08T22:30:00Z'));

    expect(getToday()).toBe('2026-09-09');
    expect(getDateDaysAgo(1)).toBe('2026-09-08');
  });
});
