import { addMinutesToTime, DEFAULT_RITUAL_SETTINGS, type RitualSettings } from './weekflow.service';

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

// De twee tijdvakken die in het Ochtend Ritueel worden aangeboden (morning/page.tsx) en op de
// Focus-pagina herkend worden (focus/page.tsx). Start + duur zijn instelbaar via
// /api/ritual-settings (Instellingen-pagina); zonder instellingen gelden de oorspronkelijke
// vaste tijden 08:30-10:00 / 12:30-14:00 (DEFAULT_RITUAL_SETTINGS).
export function getFocusBlockSlots(settings: RitualSettings = DEFAULT_RITUAL_SETTINGS) {
  return [
    {
      key: 'focusBlok1' as const,
      start: settings.focusBlock1Start,
      end: addMinutesToTime(settings.focusBlock1Start, settings.focusBlock1DurationMin),
    },
    {
      key: 'focusBlok2' as const,
      start: settings.focusBlock2Start,
      end: addMinutesToTime(settings.focusBlock2Start, settings.focusBlock2DurationMin),
    },
  ];
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function isWithinBlock(now: Date, start: string, end: string): boolean {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= toMinutes(start) && nowMin < toMinutes(end);
}
