# Deployment

> Dit bestand is herschreven op 2026-09-19 om de vorige, verouderde versie (Express/Vite-architectuur,
> single-tenant schema) te vervangen. Zie [STATUS.md](./STATUS.md) voor de architectuur — dit bestand
> gaat alleen over het deploy-proces zelf.

## Hoe je deployt

Er is precies één geautoriseerde weg naar productie:

```bash
npm run deploy
```

Dit script (`scripts/deploy.mjs`):
1. Draait `npm run predeploy` (type-check → tests → build). Stopt de deploy als een van deze faalt.
2. Deployt via `vercel --prod`.
3. Poll't `https://sparren.app/api/health` (max 5 pogingen, 3s interval) en faalt zichtbaar als productie niet gezond terugkomt.

**Draai nooit kaal `vercel --prod`** — dat slaat alle checks over en was de oorzaak van een kapotte build die eind vorige sessie onopgemerkt richting productie ging.

## Git-koppeling

Het GitHub-repo (`Impact2025/impactreis`) is gekoppeld aan het Vercel-project, maar `vercel.json` zet
`git.deploymentEnabled.master = false` — pushes naar `master` triggeren dus **geen** automatische
deploy. Productie gaat alleen via `npm run deploy`. Pushes naar andere branches (zoals
`feature/flowpa-integration`) genereren wél automatisch een Vercel preview-deployment, handig om een
wijziging te bekijken vóór je 'm naar productie promoot.

## Als de health-check faalt na een deploy

```bash
vercel rollback
```

promoot de vorige gezonde deployment terug naar productie. Kijk daarna in de Vercel-dashboard-logs
(`vercel inspect <deployment-url>`) naar de oorzaak voordat je opnieuw deployt.

## Environment variables (productie, Vercel dashboard)

Minimaal nodig — zie `src/lib/db.ts`, `src/lib/resend.ts`, `src/lib/auth.ts` voor waar ze gebruikt worden:

- `DATABASE_URL` — Neon Postgres connection string
- `JWT_SECRET`
- `RESEND_API_KEY`, `CRON_SECRET` — voor de e-mail cronjobs (`vercel.json`)
- `NEXT_PUBLIC_APP_URL` — moet `https://sparren.app` zijn in productie
- Google Calendar / OpenRouter / overige integratie-keys — zie de betreffende `src/lib/*.ts`-bestanden
  voor de exacte namen; niet hier dupliceren om drift met de code te voorkomen.

## Database migraties

Alleen bestanden onder `migrations/manual/*.sql` zijn productie-veilig (zie STATUS.md — de
Drizzle-gegenereerde `migrations/0000_*.sql` gaat uit van een lege database). Draai een nieuwe manuele
migratie handmatig tegen productie vóór je de bijbehorende code-deploy doet, niet erna.
