# Multi-tenant fundament — uitvoeringsplan (Fase 1)

Status: schema en migratie geschreven, **nog niet tegen productie gedraaid**. Dit document is de
concrete vervolgstap op AIPACOACH_BOUWPLAN — lees dit voordat je verder bouwt aan fase 2+.

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
- [ ] Stap 4 — NOT NULL + RLS aanzetten
- [ ] Stap 5 — ImpactOS-bridge scopen
- [ ] Stap 6 — oude JWT-auth verwijderen

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

## Volgende stappen, in volgorde

1. ~~Migratie tegen productie draaien~~ — gedaan, zie Voortgang hierboven.

2. **Auth.js lokaal testen, los van de live app**
   - Vul `AUTH_SECRET` in (`npx auth secret`) en test met een lokale `.env.local`.
   - `npm run dev`, ga naar `/api/auth/signin`, vraag een magic link aan, verifieer dat een sessie
     met `organizationId` binnenkomt.
   - Doe dit *voordat* je een bestaande route omzet — dit is de eerste keer dat de nieuwe auth-flow
     echt met de Resend-key praat.

3. **De 32 routes onder `src/app/api` omzetten** van `authenticateToken()`
   (`src/lib/auth.ts`) naar `auth()` (`src/auth.ts`), én elke INSERT/UPDATE aanvullen met
   `organization_id`. Eén route per keer, met een handmatige test erna. Belangrijkste kandidaten
   om als eerste te doen (meest gebruikt): `wins`, `focus`, `dagboek`, `coach`.

4. **NOT NULL + Row Level Security aanzetten** (pas als stap 3 voor alle routes klaar is)
   ```sql
   ALTER TABLE wins ALTER COLUMN organization_id SET NOT NULL;
   -- herhaal per tabel
   ALTER TABLE wins ENABLE ROW LEVEL SECURITY;
   ALTER TABLE wins FORCE ROW LEVEL SECURITY; -- anders geldt de policy niet voor neondb_owner
   CREATE POLICY tenant_isolation ON wins
     USING (organization_id = current_setting('app.current_org_id')::int);
   -- herhaal per tabel
   ```
   Elke API-route moet vóór een query `SET app.current_org_id = ...` zetten binnen dezelfde
   Postgres-sessie — dit hoort in de vervangende auth-middleware, niet per route los. Let op: de
   Neon HTTP-driver (`neon()` in `src/lib/db.ts`) opent per statement mogelijk een nieuwe sessie;
   verifieer dit expliciet voordat je FORCE RLS aanzet, anders lijkt tenant-isolatie actief terwijl
   ze het niet is.

5. **ImpactOS-bridge scopen.** `COACH_BRIDGE_TOKEN`/`IMPACTOS_BASE_URL` mag alleen data koppelen
   binnen de founder-organisatie (`impact-reis`), nooit impliciet aan nieuwe tenants. Voeg een
   expliciete `organization_id`-check toe waar deze bridge wordt aangeroepen.

6. **Oude auth verwijderen** (`src/lib/auth.ts`, `bcrypt`/`jsonwebtoken`-dependencies) pas nadat
   alle 32 routes zijn omgezet en getest — niet ervoor.

## Wat ik bewust niet heb gedaan

- Geen `npm audit fix --force` — de nieuwe dev-dependencies (drizzle-kit) brachten waarschuwingen
  mee die niet met een geforceerde fix opgelost horen te worden zonder te weten wat er breekt.
- Geen wijziging aan `courses`/`course_*`-tabellen (Tony Robbins-content) — die zijn niet kritiek
  voor de tenant-laag en kunnen in een latere migratie mee.
- Geen `git push` en geen `vercel --prod` — alles staat lokaal gecommit.
