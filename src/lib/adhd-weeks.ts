// Gedeelde week-indeling voor de ADHD klachtenmeting (nulmeting vóór Ritalin).
// Kalenderweken (ma–zo), maar de meetperiode start op wo 3 jun en eindigt op
// di 17 jun (Ritalin-start). Daardoor zijn de eerste en laatste week korter.

export interface AdhdWeek {
  nr: number;
  start: string; // YYYY-MM-DD (inclusief)
  end: string; // YYYY-MM-DD (inclusief)
  label: string; // compacte tab-/koplabel, bv. "3–7 jun"
}

export const ADHD_WEEKS: AdhdWeek[] = [
  { nr: 1, start: '2026-06-03', end: '2026-06-07', label: '3–7 jun' },
  { nr: 2, start: '2026-06-08', end: '2026-06-14', label: '8–14 jun' },
  { nr: 3, start: '2026-06-15', end: '2026-06-17', label: '15–17 jun' },
];

export const ADHD_PERIOD_START = ADHD_WEEKS[0].start;
export const ADHD_PERIOD_END = ADHD_WEEKS[ADHD_WEEKS.length - 1].end;

/** Alle datums (YYYY-MM-DD) tussen start en end, inclusief. */
export function enumerateDates(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (d <= last) {
    out.push(d.toISOString().split('T')[0]);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/** Datums van een meetweek. */
export function weekDates(week: AdhdWeek): string[] {
  return enumerateDates(week.start, week.end);
}

/** Aantal dagen in een meetweek (5, 7 of 3). */
export function weekDayCount(week: AdhdWeek): number {
  return weekDates(week).length;
}

/** Het weeknummer waarin `today` valt; na de periode de laatste week. */
export function currentWeekNr(today = new Date().toISOString().split('T')[0]): number {
  const w = ADHD_WEEKS.find((x) => today <= x.end);
  return w ? w.nr : ADHD_WEEKS[ADHD_WEEKS.length - 1].nr;
}

export function weekByNr(nr: number): AdhdWeek {
  return ADHD_WEEKS.find((w) => w.nr === nr) ?? ADHD_WEEKS[0];
}
