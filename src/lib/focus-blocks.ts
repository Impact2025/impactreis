// Gedeeld tussen het Ochtend Ritueel (waar de blokken gepland worden) en de Focus-pagina
// (waar ze uitgevoerd worden) — zie FOCUS_CATEGORY_OPTIONS-gebruik in morning/page.tsx en focus/page.tsx.
export const FOCUS_CATEGORY_OPTIONS = [
  { value: 'commercie', label: 'Commercie / Sales' },
  { value: 'proces', label: 'Proces & Automatisering' },
  { value: 'klantwerk', label: 'Klantwerk / Uitvoering' },
] as const;

export type FocusCategoryValue = typeof FOCUS_CATEGORY_OPTIONS[number]['value'];

export function focusCategoryLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return FOCUS_CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

// De twee vaste tijdvakken die in het Ochtend Ritueel worden aangeboden (morning/page.tsx).
export const FOCUS_BLOCK_SLOTS = [
  { key: 'focusBlok1', start: '08:30', end: '10:00' },
  { key: 'focusBlok2', start: '12:30', end: '14:00' },
] as const;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function isWithinBlock(now: Date, start: string, end: string): boolean {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= toMinutes(start) && nowMin < toMinutes(end);
}
