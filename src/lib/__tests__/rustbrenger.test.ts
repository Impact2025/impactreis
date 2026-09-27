import { describe, it, expect } from 'vitest';
import { maxCorePoints, playingField, needsReferral, parseBattery, BATTERY_ENERGY, type BatteryReading } from '../rustbrenger';

const r = (date: string, battery: BatteryReading['battery']): BatteryReading => ({ date, battery });

describe('needsReferral', () => {
  it('verwijst door na 3 opeenvolgende rode dagen tot en met vandaag', () => {
    expect(needsReferral([r('2026-09-19', 'red'), r('2026-09-20', 'red'), r('2026-09-21', 'red')], '2026-09-21')).toBe(true);
  });

  it('verwijst niet door bij een onderbreking, te weinig metingen of oranje ertussen', () => {
    expect(needsReferral([r('2026-09-20', 'red'), r('2026-09-21', 'red')], '2026-09-21')).toBe(false);
    expect(needsReferral([r('2026-09-19', 'red'), r('2026-09-20', 'orange'), r('2026-09-21', 'red')], '2026-09-21')).toBe(false);
    expect(needsReferral([r('2026-09-17', 'red'), r('2026-09-19', 'red'), r('2026-09-21', 'red')], '2026-09-21')).toBe(false);
  });

  it('negeert een streak die al langer dan gisteren geleden is geeindigd', () => {
    expect(needsReferral([r('2026-09-16', 'red'), r('2026-09-17', 'red'), r('2026-09-18', 'red')], '2026-09-21')).toBe(false);
  });
});

describe('batterij', () => {
  it('parseert alleen geldige waarden en mapt naar energie', () => {
    expect(parseBattery('red')).toBe('red');
    expect(parseBattery('blauw')).toBeNull();
    expect(BATTERY_ENERGY.red).toBeLessThan(BATTERY_ENERGY.orange);
    expect(BATTERY_ENERGY.orange).toBeLessThan(BATTERY_ENERGY.green);
  });
});

describe('weekplanning', () => {
  it('rekent de speelruimte nooit negatief uit', () => {
    expect(playingField(30, 8, 6)).toBe(16);
    expect(playingField(10, 8, 6)).toBe(0);
  });

  it('laat maar 1 kernpunt toe na een lage energiescore', () => {
    expect(maxCorePoints(2)).toBe(1);
    expect(maxCorePoints(3)).toBe(1);
    expect(maxCorePoints(6)).toBe(2);
    expect(maxCorePoints(null)).toBe(2);
  });
});
