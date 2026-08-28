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

## Volgende stappen, in volgorde

1. **Migratie tegen productie draaien**
   ```
   psql "$DATABASE_URL" -f migrations/manual/0001_add_multi_tenant_columns.sql
   ```
   Maak vooraf een Neon-snapshot/branch als extra vangnet. Verifieer erna:
   `SELECT count(*) FROM wins WHERE organization_id IS NULL;` moet 0 zijn (en zo voor elke tabel).

2. **Auth.js lokaal testen, los van de live app**
   - Vul `AUTH_SECRET` in (`npx auth secret`) en test met een lokale `.env.local`.
   - `npm run dev`, ga naar `/api/auth/signin`, vraag een magic link aan, verifieer dat een sessie
     met `organizationId` binnenkomt.
   - Doe dit *voordat* je een bestaande route omzet — dit is de eerste keer dat de nieuwe auth-flow
     echt met de Resend-key praat.

3. **NOT NULL + Row Level Security aanzetten** (pas na stap 1 geverifieerd)
   ```sql
   ALTER TABLE wins ALTER COLUMN organization_id SET NOT NULL;
   -- herhaal per tabel
   ALTER TABLE wins ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON wins
     USING (organization_id = current_setting('app.current_org_id')::int);
   -- herhaal per tabel
   ```
   Elke API-route moet vóór een query `SET app.current_org_id = ...` zetten (via een Postgres
   sessie-transactie) — dit hoort in de vervangende auth-middleware, niet per route los.

4. **De 32 routes onder `src/app/api` omzetten** van `authenticateToken()`
   (`src/lib/auth.ts`) naar `auth()` (`src/auth.ts`). Eén route per keer, met een handmatige test
   erna. Belangrijkste kandidaten om als eerste te doen (meest gebruikt): `wins`, `focus`,
   `dagboek`, `coach`.

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
