# Multi-tenant fundament — uitvoeringsplan (Fase 1)

Status: **live in productie** (reis.weareimpact.nl, gedeployed 28-08-2026). Schema, migratie,
Auth.js, alle 32 routes en de NOT NULL-constraint staan er. RLS staat bewust nog uit — zie
onderaan waarom. Dit document is de concrete vervolgstap op AIPACOACH_BOUWPLAN — lees dit voordat
je verder bouwt aan fase 2+.

## Wat er nu al staat

- `src/lib/db/schema.ts` — Drizzle-schema, spiegelt `schema.sql` één-op-één plus `organization_id`
  op elke tabel en een nieuwe `organizations`-tabel.
- `src/lib/db/client.ts` — Drizzle-client naast de bestaande `sql` tagged-template in
  `src/lib/db.ts`. Nieuwe code kan tegen `db` schrijven; bestaande routes migreren geleidelijk.
- `migrations/manual/0001_add_multi_tenant_columns.sql` — **handmatig geschreven**, idempotente
  ALTER-migratie voor de bestaande productie-database. 100% additief: geen kolom wordt verwijderd
  of van type veranderd, dus de app blijft werken zoals nu totdat je zelf de volgende stap zet.
- `src/auth.ts` — Auth.js-scaffold (Resend magic link + Drizzle-adapter). **Nog niet gewired** in
  een route of in de 32 bestaande API-routes die nu `authenticateToken()` gebruiken.

`migrations/0000_multi_tenant_foundation.sql` (drizzle-kit gegenereerd) is een losstaand bestand
voor een **lege** database — handig voor een lokale/test-Postgres, maar niet bedoeld om tegen
productie te draaien (die tabellen bestaan daar al).

## Waarom niet in één keer doorgevoerd

Dit raakt de enige productie-database met echte gebruikersdata, met handmatige deploy naar
Vercel. Een migratie of auth-cutover die faalt halverwege is duur om terug te draaien. Vandaar:
elke stap hieronder is los uitvoerbaar en je bevestigt expliciet voordat iets tegen productie
draait of gedeployed wordt.

## Voortgang

- [x] **Stap 1 — migratie gedraaid tegen productie** (28-08-2026, via
  `scripts/run-multi-tenant-migration.mjs`). `organizations`-tabel bevat 1 rij (`impact-reis`,
  id 1, plan `pro`). Alle 12 tabellen geverifieerd op 0 rijen met `organization_id IS NULL`.
  Let op: het eerste scriptrun miste 3 statements door een bug in de commentaar-splitsing
  (INSERT organizations, `password_hash` nullable maken, `UPDATE users`) — met de hand
  nagelopen en alsnog uitgevoerd; script inmiddels gecorrigeerd voor toekomstig gebruik.
- [x] **Stap 2 — Auth.js lokaal getest** (28-08-2026). CSRF, sign-in-form en DB-adapter
  (nieuwe `auth_users`/`auth_accounts`/`auth_sessions`/`auth_verification_tokens`-tabellen,
  losgekoppeld van de bestaande `users`-tabel en gekoppeld via e-mail) werken aantoonbaar.
  Liep vast op een lege `RESEND_API_KEY` in `.env.local` — vul die lokaal in om de mail zelf
  te zien; de serverkant is verder bewezen correct.
- [x] **Stap 3 — routes omgezet** (28-08-2026). Alle 32 routes gebruiken nu
  `getAuthContext()` (`src/lib/auth-context.ts`), die zowel het bestaande JWT-token als een
  Auth.js-sessie accepteert — geen regressie op de huidige login. Elke INSERT in een van de
  12 tenant-tabellen krijgt `organization_id` mee. End-to-end gesmoketest tegen productie
  (nieuwe registratie → eigen organisatie → win met juiste organization_id).
  `auth/register` maakt nu ook een organisatie aan per nieuwe registratie (was eerder een gat).
- [x] **Stap 4a — NOT NULL aangezet** (28-08-2026) op `organization_id` in alle 12 tabellen.
  Geverifieerd met een nieuwe smoketest-registratie ná het aanzetten: write slaagt gewoon.
- [ ] **Stap 4b — RLS: bewust NIET aangezet.** Geverifieerd dat `neon()` (de HTTP-driver die
  `src/lib/db.ts` en alle 32 routes gebruiken) een `SET` in de ene call niet laat doorwerken naar
  de volgende — elke tagged-template-aanroep is een aparte connectie. Het standaard RLS-patroon
  (`SET app.current_org_id` vóór de query) werkt hier dus principieel niet, met of zonder `FORCE`.
  Om RLS alsnog te doen: óf alle 32 routes herschrijven om `SET` + query te bundelen in
  `sql.transaction([...])`, óf tenant-isolatie in de applicatielaag afdwingen
  (`WHERE organization_id = ...` expliciet in elke query, i.p.v. Postgres session state). Dat
  laatste is waarschijnlijk de betere fit voor deze architectuur.
- [ ] Stap 5 — ImpactOS-bridge scopen
- [ ] Stap 6 — oude JWT-auth verwijderen (niet eerder dan wanneer er een lopende, geteste
  magic-link-inlogpagina in de UI is — vandaag bestaat die nog niet)

**Nieuw gevonden tijdens stap 3, niet opgelost (buiten scope):** `src/app/api/goals/route.ts`
verwacht kolommen (`type`, `title`, `period`, `completed`) die niet bestaan in de echte
`goals`-tabel (die heeft `user_id`/`id`/`data`/`updated_at`/`organization_id`). Dit lijkt een
restant van de oude Express-migratie (`server-old/routes/goals.routes.ts` had dezelfde vorm) dat
nooit is rechtgetrokken. `schema.ts` is aangepast om de ECHTE tabel te spiegelen; de route zelf
is niet aangepast omdat onduidelijk is wat de bedoelde vorm moet zijn. Bevestigd: `/api/goals` wordt wél nog echt aangeroepen, door `src/app/share/page.tsx` (de
PWA-share-target, als je iets deelt naar "doel"). Die actie faalt vermoedelijk nu al met een
SQL-fout, los van dit werk — dit is een bestaande productiebug, geen regressie door mij
geïntroduceerd. Los op door `goals.schema.ts`/`goals/route.ts` te herschrijven naar de echte
`data jsonb`-kolom, of de share-flow naar `weekly-goals` te wijzen.

**Volgorde-correctie t.o.v. de eerste versie van dit document:** NOT NULL en RLS kunnen pas ná de
routes zijn omgezet, niet ervoor. De 32 bestaande routes doen nu INSERT/UPDATE zonder
`organization_id` mee te geven — zet je nu al NOT NULL, dan faalt de eerstvolgende schrijfactie
(nieuwe win, nieuw logboek) meteen. RLS aanzetten zonder dat elke request eerst de tenant-context
zet is even riskant: de app verbindt als `neondb_owner` (tabel-eigenaar), en RLS-policies gelden
pas voor de eigenaar als je ook `FORCE ROW LEVEL SECURITY` zet — dat is dus geen sluitende
bescherming totdat de context überhaupt ergens gezet wordt.

## Wat nog moet gebeuren

1. **Applicatielaag-tenant-isolatie op reads** (vervangt RLS voor deze architectuur). Voeg
   `AND organization_id = ${authCtx.organizationId}` toe aan de WHERE-clause van elke SELECT in de
   32 routes, naast de bestaande `user_id`-filter. Vandaag is dit onschadelijk om over te slaan
   (één organisatie, user_id filtert al correct) maar het is de echte isolatie-garantie zodra er
   een tweede tenant is — niet de RLS-policy die hierboven als niet-haalbaar staat aangemerkt.

2. **Magic-link-inlogscherm bouwen in de UI.** Auth.js werkt aantoonbaar server-side, maar er is
   nog geen frontend-pagina die een e-mailadres vraagt en `signIn('resend', { email })` aanroept.
   Zonder die pagina is Auth.js alleen bruikbaar via directe API-calls, niet voor een echte
   gebruiker. Bouw dit vóórdat je een tweede klant onboardt.

3. **AUTH_SECRET expliciet zetten in Vercel** (naast de bestaande `NEXTAUTH_SECRET`). Productie
   werkt nu blijkbaar via een fallback, maar dat is niet gedocumenteerd Auth.js-v5-gedrag om op te
   vertrouwen. `vercel env add AUTH_SECRET production` met dezelfde waarde als `NEXTAUTH_SECRET`.

4. **ImpactOS-bridge scopen.** `COACH_BRIDGE_TOKEN`/`IMPACTOS_BASE_URL` mag alleen data koppelen
   binnen de founder-organisatie (`impact-reis`), nooit impliciet aan nieuwe tenants. Voeg een
   expliciete `organization_id`-check toe waar deze bridge wordt aangeroepen.

5. **`/api/goals` repareren** — zie hierboven, bestaande productiebug die share-naar-doel breekt.

6. **Oude JWT-auth verwijderen** (`src/lib/auth.ts`, `bcrypt`/`jsonwebtoken`-dependencies) pas
   nadat stap 2 hierboven (UI voor magic link) live is en getest — niet ervoor, anders kan niemand
   meer inloggen.

## Wat ik bewust niet heb gedaan

- Geen `npm audit fix --force` — de nieuwe dev-dependencies (drizzle-kit) brachten waarschuwingen
  mee die niet met een geforceerde fix opgelost horen te worden zonder te weten wat er breekt.
- Geen wijziging aan `courses`/`course_*`-tabellen (Tony Robbins-content) — die zijn niet kritiek
  voor de tenant-laag en kunnen in een latere migratie mee.
- Geen `git push` en geen `vercel --prod` — alles staat lokaal gecommit.
