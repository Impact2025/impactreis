// Rustbrenger-editie (zie PLAN_RUSTBRENGER.md, fase 3): pure helpers voor de batterij-meting en de
// harde doorverwijsregel. Bewust zonder UI of DB zodat de regel testbaar is; de coach behandelt
// nooit zelf, bij aanhoudend rood volgt altijd een doorverwijzing.
export type Battery = 'green' | 'orange' | 'red';

export const BATTERY_OPTIONS: { value: Battery; label: string; description: string }[] = [
  { value: 'green', label: 'Groen', description: 'Ik heb ruimte. Het mag gewoon een goede dag worden.' },
  { value: 'orange', label: 'Oranje', description: 'Het gaat, maar ik moet zuinig zijn met mijn energie.' },
  { value: 'red', label: 'Rood', description: 'Ik ben leeg. Vandaag draait om overleven, niet om presteren.' },
];

/** Vertaling naar de 1-10 `energyLevel` die coach en e-mails al lezen, zodat niets anders hoeft te veranderen. */
export const BATTERY_ENERGY: Record<Battery, number> = { green: 8, orange: 5, red: 2 };

export const RED_STREAK_THRESHOLD = 3;

export function parseBattery(value: unknown): Battery | null {
  return value === 'green' || value === 'orange' || value === 'red' ? value : null;
}

export interface BatteryReading {
  date: string; // YYYY-MM-DD
  battery: Battery | null;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

/** True als de laatste `threshold` metingen allemaal rood zijn op opeenvolgende dagen en de
 *  nieuwste van vandaag of gisteren is. Metingen zonder batterij tellen niet mee. */
export function needsReferral(readings: BatteryReading[], today: string, threshold = RED_STREAK_THRESHOLD): boolean {
  const byDate = new Map<string, Battery>();
  for (const r of readings) if (r.battery) byDate.set(r.date, r.battery);
  const dates = [...byDate.keys()].sort().reverse();
  if (dates.length < threshold) return false;
  if (daysBetween(today, dates[0]) > 1) return false;
  for (let i = 0; i < threshold; i++) {
    if (byDate.get(dates[i]) !== 'red') return false;
    if (i > 0 && daysBetween(dates[i - 1], dates[i]) !== 1) return false;
  }
  return true;
}

export const REFERRAL_MESSAGE =
  'Je batterij is meerdere dagen achter elkaar rood. Dat is een signaal om niet zelf op te lossen. ' +
  'Bespreek het met je huisarts of bedrijfsarts. Bij acute nood: bel 113 (of 0800-0113, dag en nacht bereikbaar).';

export const EMERGENCY_MESSAGE =
  'Als je hoofd vol zit: stop met wat je doet. Adem rustig uit, drink wat water en leg alles neer wat vandaag niet hoeft. ' +
  'Blijft het benauwend, praat dan met iemand die je vertrouwt of met je huisarts. Bij acute nood: bel 113.';

/** Reele speelruimte van de week: beschikbare uren min vaste overleggen en ruis (nooit negatief). */
export function playingField(availableHours: number, meetingHours: number, noiseHours: number): number {
  return Math.max(0, availableHours - meetingHours - noiseHours);
}

export const MAX_CORE_POINTS = 2;
export const LOW_ENERGY_SCORE = 3;

/** Weekplan stuurt bij: rood (laag) op persoonlijke energie vorige week laat maar 1 kernpunt toe. */
export function maxCorePoints(previousEnergyScore: number | null | undefined): number {
  return typeof previousEnergyScore === 'number' && previousEnergyScore <= LOW_ENERGY_SCORE ? 1 : MAX_CORE_POINTS;
}
