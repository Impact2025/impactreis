// Statische meditatie-catalogus. Elke meditatie is een pre-rendered audiobestand in
// public/audio/ — geen dynamische generatie, dus geen latency en geen tokenkosten per bezoeker.
// Nieuwe meditatie toevoegen = audiobestand in public/audio/ zetten + hier één entry toevoegen.

export type MeditationCategory = 'ochtend' | 'focus' | 'avond' | 'reset';

export interface Meditation {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: MeditationCategory;
  durationLabel: string;
  audioSrc: string;
}

export const MEDITATION_CATEGORY_LABELS: Record<MeditationCategory, string> = {
  ochtend: 'Ochtend',
  focus: 'Focus',
  avond: 'Avond',
  reset: 'Reset',
};

export const MEDITATIONS: Meditation[] = [
  {
    id: 'executive-centering-v1',
    slug: 'executive-centering',
    title: 'Executive Centering',
    description: 'Rustige start vóór de dagopening — kalmeert het hoofd zonder tijd te kosten.',
    category: 'ochtend',
    durationLabel: '3 min',
    audioSrc: '/audio/executive-centering.mp3',
  },
];

export function getMeditationBySlug(slug: string): Meditation | undefined {
  return MEDITATIONS.find((m) => m.slug === slug);
}

export function getMeditationsByCategory(category: MeditationCategory): Meditation[] {
  return MEDITATIONS.filter((m) => m.category === category);
}

// Eenvoudige tijd-gebaseerde aanbeveling voor het dashboard-widget.
export function getRecommendedMeditation(hour: number = new Date().getHours()): Meditation | undefined {
  const category: MeditationCategory = hour < 12 ? 'ochtend' : hour < 18 ? 'focus' : 'avond';
  return getMeditationsByCategory(category)[0] ?? MEDITATIONS[0];
}
