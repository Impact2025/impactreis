# Plan: Rustbrenger-editie (Mentale Rust & Duurzame Focus) voor sociaal ondernemers

Status: fase 0-2 GEIMPLEMENTEERD op 2026-09-21 (defaults: omkeerbaar in /settings, bestaande users blijven commercial). Fase 3 geimplementeerd op 2026-09-21 (behalve ACA-observatie). Fase 4 nog open. Vastgelegd op 2026-09-19. Doel: bij onboarding kan een sociaal ondernemer kiezen voor een beschermende coach-modus in plaats van de commerciële Challenger-modus.

## Correcties op de originele blauwdruk (feiten in de repo)
- Er is geen `src/lib/coach/engine.ts`, `techniques.ts`, `prompt.ts`, `onboarding/types.ts`, `elevenlabs/voices.ts`. Alles zit in `src/lib/coach.ts` en `src/lib/onboarding.ts`.
- Geen kolom of migratie nodig: `onboarding_profiles.profile` is jsonb met een Zod-schema (`onboardingProfileSchema`).
- Er is geen ElevenLabs-integratie. `voiceId` is een placeholder, `hooks/use-speech.ts` gebruikt browser-speechSynthesis. Audiobriefing is dus nieuwbouw.
- ACT, systemisch en oplossingsgericht bestaan al in `chooseTechnique()`. Free Day forceert al ACT.
- `/controle-cirkel` en `/aca` bestaan al: hergebruiken, niet herbouwen.
- `coachProfileSchema.toneSeverity` is `z.literal('high_challenger')` en `businessDna` is verplicht: het schema moet een discriminated union op `mode` worden.
- Onboarding heeft 8 stappen incl. consequentie-module (Martell); `e2e/onboarding.spec.ts` moet mee.

## Ontwerpbeslissingen / risico's
1. Een gedeelde rituelen-motor met `mode`, geen twee aparte apps. Alleen echt afwijkende onderdelen krijgen een variant.
2. Modus omkeerbaar in `/settings`, niet als eenmalige tak. Bestaande gebruikers blijven `commercial` (default).
3. Anti-martelaarschap doseren: de coach mag geen nieuwe druk worden.
4. Rode batterij over meerdere dagen en de Noodknop: harde doorverwijsregel (huisarts, bedrijfsarts, 113 bij acute nood). Coach behandelt niet zelf.
5. "Sluit de Poort" is een zachte sluiting, omzeilbaar.
6. ACA-waarschuwing als observatie op eigen data, geen medische claim.
7. Audiobriefing pas in fase 4.
8. Geen emoji's in UI of e-mails (zie memory).

## Fases
**Fase 0 - Fundament**: `mode: 'commercial' | 'rustbrenger'` optioneel (default commercial) in het profiel; `toneSeverity` naar `'high_challenger' | 'gentle_mentor'`; helper `getCoachMode(userId)`; wissel-instelling in `/settings`.

**Fase 1 - Onboarding**: "Kies je pad"-stap vooraan. Rustbrenger: Breekpunt & Grenscontract (eerste signaal over grens, vaste laptop-dicht-tijd) in plaats van consequentie-module; energielekken (bureaucratische ruis, emotionele belasting, financiele stress) in plaats van `businessDna`; een missie-ankervraag. Zod als discriminated union. e2e bijwerken.

**Fase 2 - Coach-engine (`coach.ts`)**: bij rustbrenger in `chooseTechnique()` geen cgt/grow/challenger, voorrang ACT/systemisch/oplossingsgericht (schaalvragen). In `buildCoachPrompt()` het Begrenzende Mentor-persona (anti-martelaarschap, radicale vereenvoudiging, nuchtere empathie, rustige toon); geen challenger-injectie en geen kikker-trigger op uurtarief. Tests in `coach.test.ts`.

**Fase 3 - Rituelen**:
- `/morning`: batterij (groen/oranje/rood), Ene Zaak, niet-doen-lijst (parkeervak, nieuw opslagveld).
- `/evening`: Sluit de Poort, "Wat leg ik neer?", "Wat telt wel?", loslaat-prullenbak; vervangt waarde_verkocht/gevlucht_in_veiligheid.
- `/weekly-start`: reele speelruimte (uren min vaste overleggen/ruis, max 2 kernpunten). `/weekly-review`: balans-driehoek (Impact, Continuiteit, Persoonlijke energie); rood op energie stuurt volgende weekplan bij.
- `/controle-cirkel`: koppelen aan coach en noodknop.
- `/focus`: box-breathing, dwingende pauze na 2 blokken (scherm dimt, geen to-do's), noodknop "Hoofd zit vol".

**Fase 4 - Extra's**: echte ElevenLabs-integratie met rustige stem en 60-sec briefing; Rustbrenger-varianten van de 06:00- en 08:30-mails en post-sessie analyse.

Aanbevolen volgorde: 0, 1, 2, dan 3; fase 4 na feedback van eerste gebruikers.

## Open vragen (nog te beantwoorden)
1. Omkeerbaar in `/settings` (aanbevolen) of vast bij onboarding?
2. Bestaande gebruikers blijven `commercial`?
3. Fase 0-2 in een keer laten uitvoeren?
