# Testing Results

**Laatst bijgewerkt**: 2026-09-16
**Status**: zie hieronder — dit document beschrijft alleen wat daadwerkelijk gedraaid en geverifieerd is, geen aspiratie.

> De vorige versie van dit bestand (gedateerd 2024-12-04) beschreef een Express-backend
> (`server/index.ts`, Helmet, CORS-middleware, `server/routes/`) die niet meer bestaat — de app
> is sindsdien een Next.js App Router-applicatie. Dat document was niet meer te vertrouwen als
> bron en is vervangen door deze, tegen de huidige code geverifieerde, versie.

---

## Unit/integratietests (Vitest)

```
npx vitest run
Result: 102/102 tests groen, 0 gefaald
```

Belangrijkste testbestanden (`src/lib/__tests__/`, `src/**/*.test.ts(x)`):
- `auth-context.test.ts` — de centrale auth-resolutie (`getAuthContext`) die alle tenant-aware
  API-routes gebruiken; regressies hier breken tenant-isolatie overal tegelijk.
- `coach.test.ts`, `coach-predictions.test.ts` — de AI-coach-logica: techniekkeuze, lessen,
  falsifieerbare voorspellingen.
- `rate-limit.test.ts` — de rate limiter (`src/lib/rate-limit.ts`) die AI-, auth- en
  lead-gen-endpoints beschermt.
- `weekflow.service.test.ts`, `ritual-status.test.ts` en overige domeinlogica.

## TypeScript

```
npx tsc --noEmit
Result: 0 errors
```

## ESLint

```
npx eslint .
```
Zie CHANGELOG/commit-historie voor de actuele stand — dit is een levend cijfer, geen momentopname
die je hier moet vertrouwen. Draai het commando zelf voor de huidige telling.

## E2E (Playwright)

5 specs in `e2e/`. Dun voor de omvang van de app (43 pages) — kritieke flows (onboarding,
magic-link login, coach-analyse) verdienen bredere dekking voordat je op meerdere
klant-organisaties draait. Nog niet gedaan.

## Coverage

`coverage/coverage-final.json` was leeg/verouderd bij eerdere inspectie. Draai
`npm run test:coverage` voor een actueel cijfer; dit document claimt geen percentage dat niet
recent geverifieerd is.

---

## Wat hier bewust niet in staat

Geen "100% coverage", geen "enterprise-grade security", geen checklist met afgevinkte vakjes die
niet één-op-één tegen de code zijn geverifieerd. Claims die niet kloppen met de code zijn erger
dan geen claims.
