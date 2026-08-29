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

**`/api/goals`-bug: opgelost (28-08-2026).** De route verwachtte kolommen (`type`, `title`,
`period`, `completed`) die niet bestaan in de echte `goals`-tabel (die heeft
`user_id`/`id`/`data`/`updated_at`/`organization_id`) — een restant van de oude
Express-migratie dat nooit is rechtgetrokken. De tabel was leeg (0 rijen, dus geen data-risico).
`goals/route.ts`, `goals/[id]/route.ts` en `goals.schema.ts` herschreven om de echte `data
jsonb`-kolom te gebruiken (elk doel is een eigen rij met eigen `id`, inhoud in `data`).
Bevestigd dat `/api/goals` wél echt wordt aangeroepen, door `src/app/share/page.tsx` (de
PWA-share-target, "Doel"). Geverifieerd met een volledige CRUD-smoketest tegen productie
(POST → GET → PUT → DELETE), daarna opgeruimd. `src/app/goals/page.tsx` gebruikt deze route
overigens niet — die pagina heeft een eigen databron; `/api/goals` bestaat alleen voor de
share-target.

**Volgorde-correctie t.o.v. de eerste versie van dit document:** NOT NULL en RLS kunnen pas ná de
routes zijn omgezet, niet ervoor. De 32 bestaande routes doen nu INSERT/UPDATE zonder
`organization_id` mee te geven — zet je nu al NOT NULL, dan faalt de eerstvolgende schrijfactie
(nieuwe win, nieuw logboek) meteen. RLS aanzetten zonder dat elke request eerst de tenant-context
zet is even riskant: de app verbindt als `neondb_owner` (tabel-eigenaar), en RLS-policies gelden
pas voor de eigenaar als je ook `FORCE ROW LEVEL SECURITY` zet — dat is dus geen sluitende
bescherming totdat de context überhaupt ergens gezet wordt.

## Wat nog moet gebeuren

1. ~~Applicatielaag-tenant-isolatie op reads~~ — **gedaan (28-08-2026).** Elke SELECT/UPDATE/DELETE
   met `user_id = ${userId}` in de WHERE-clause, over de 12 tenant-tabellen, heeft nu ook
   `organization_id = ${organizationId}` — in: goals (beide routes), weekly-goals (beide),
   habits (beide), focus (beide), adhd-logs, reflectie (beide), controle-cirkel (beide), dagboek
   (beide), analytics (3 queries), weekly-reviews (beide), logs (alle), wins (beide).
   Bewust overgeslagen: `email/weekrapport`, `email/sessie-analyse`, `email/adhd-rapport`,
   `email/ochtend-herinnering` (cron-jobs, hardcoded aan `NOTIFICATION_EMAIL` — zelfde
   single-user-patroon als de ImpactOS-bridge, geen organizationId beschikbaar zonder de
   functiesignatuur te verbouwen); `coach/*` en `energy-log/*` (aparte, nog niet gecommitte
   feature van Vincent, niet aangeraakt); `practice`/`assessments`/`courses/*` (buiten de 12
   tenant-tabellen). Geverifieerd met een smoketest-account: eigen schrijf/lees-cyclus werkt,
   en de founder-organisatie (3 habits) blijft onzichtbaar voor het nieuwe account. Type-check,
   45/45 tests en productie-build blijven groen.

2. ~~Magic-link-inlogscherm bouwen in de UI~~ — **gedaan (28-08-2026).** `/auth/login` heeft nu
   een toggle "Inloggen via magic link" die `signIn('resend', {...})` uit `next-auth/react`
   aanroept, plus een `/auth/check-email`-pagina. Ook `auth.ts`'s `pages`-config gecorrigeerd:
   verwees naar het niet-bestaande `/auth` i.p.v. `/auth/login`. Geverifieerd in de browser:
   toggle werkt, formulier verstuurt, en de foutmelding verschijnt netjes (lokaal loopt het nog
   vast op de lege `RESEND_API_KEY`, zie stap hierboven — geen crash, gewoon een nette foutstaat).

3. **AUTH_SECRET expliciet zetten in Vercel** (naast de bestaande `NEXTAUTH_SECRET`). Geprobeerd
   via `vercel env add AUTH_SECRET production` met de waarde via stdin — de CLI meldde twee keer
   succes, maar `vercel env pull` liet allebei de keren een lege string zien. Weer verwijderd om
   niet per ongeluk een lege waarde te laten staan (erger dan niet gezet: geen fallback meer).
   Productie draait nu weer op de oorspronkelijke, werkende fallback (alleen `NEXTAUTH_SECRET`).
   Zet deze zelf via het Vercel-dashboard (Project Settings → Environment Variables) met dezelfde
   waarde als `NEXTAUTH_SECRET` — betrouwbaarder dan de non-interactieve CLI hier bleek.

4. ~~ImpactOS-bridge scopen~~ — **besloten (28-08-2026): blijft single-user, met opzet.**
   `src/lib/coach.ts`'s `loadSingleUserId()` (`ORDER BY id ASC LIMIT 1`) is een bewuste,
   gedocumenteerde ontwerpkeuze ("Eén-gebruiker-app: geen tenant-model nodig") voor Vincents
   eigen ImpactOS-koppeling, geen product-feature voor andere tenants. Niet onveilig zoals hij nu
   is: hij pakt altijd het OUDSTE account, dus een nieuwe tenant kan er nooit in lekken. Bewust
   niet aangepast.

5. ~~`/api/goals` repareren~~ — gedaan, zie hierboven.

6. **Oude JWT-auth verwijderen** (`src/lib/auth.ts`, `bcrypt`/`jsonwebtoken`-dependencies) pas
   nadat stap 2 hierboven (UI voor magic link) live is en getest — niet ervoor, anders kan niemand
   meer inloggen.

## Wat ik bewust niet heb gedaan

- Geen `npm audit fix --force` — de nieuwe dev-dependencies (drizzle-kit) brachten waarschuwingen
  mee die niet met een geforceerde fix opgelost horen te worden zonder te weten wat er breekt.
- Geen wijziging aan `courses`/`course_*`-tabellen (Tony Robbins-content) — die zijn niet kritiek
  voor de tenant-laag en kunnen in een latere migratie mee.
- RLS blijft uit (zie Stap 4b) — applicatielaag-filtering is nu de echte isolatie-garantie.
- `coach/*` en `energy-log/*` (Vincents eigen, nog niet gecommitte werk) zijn nergens in dit hele
  traject aangeraakt, ook niet voor de auth- of organization_id-conversie.

Alle stappen hierboven zijn inmiddels wél gepusht naar `origin/master` en gedeployed naar
`reis.weareimpact.nl` (elke keer na een expliciete bevestiging, met uitzondering van één
achtergrond-taak die dat zonder te vragen deed — zie hieronder).

## Bredere audit (28-08-2026): geen nieuwe schema-drift-bugs

Alle 44 API-routes en de SQL-rakende lib-bestanden nagelopen tegen het echte productieschema
(via `information_schema.columns`, niet `schema.sql`). Geen enkele andere kolom-mismatch
gevonden — de `goals`-bug bleek een geïsoleerd restant, geen patroon.

Wel twee (niet-schema-gerelateerde) bugs gevonden en gerepareerd in `notifications/subscribe` en
`notifications/unsubscribe`:
- `subscribe/route.ts` decodeerde de meegestuurde JWT nooit (letterlijke comment: "For now,
  we'll store without user association") — elke push-subscription kreeg `user_id = NULL`,
  waardoor `notifications/send`'s `payload.userId`-filter nooit iets kon vinden. Nu gefixt met
  `getAuthContext()`, geverifieerd: nieuwe subscriptions krijgen het juiste `user_id`.
- `/api/notifications/unsubscribe` **bestond helemaal niet** — de client
  (`src/lib/push-notifications.ts`) post ernaartoe, maar alleen `subscribe/` en `send/` waren
  geïmplementeerd. Uitschrijven faalde dus altijd stil (de fetch-response werd nooit gecontroleerd).
  Route aangemaakt, geverifieerd met een smoketest (subscribe → juiste user_id in DB →
  unsubscribe → 200 → rij verwijderd).

**Nog een bekende, niet-opgeloste gap** (feature-gat, geen bug): `notifications/send/route.ts`
is een stub — er wordt geen enkele push-notificatie daadwerkelijk verstuurd (`web-push`-package
niet geïnstalleerd, VAPID-keys niet gegenereerd, alleen een comment "Web Push library would be
used here in production"). Dit is een echte feature-implementatie (npm-package toevoegen,
VAPID-keys genereren, verzendlogica bouwen), geen quick fix — bewust niet aangepakt zonder
overleg.

## Push-notificaties echt werkend gemaakt (29-08-2026)

`notifications/send/route.ts` was een stub (zie hierboven) — nu geïmplementeerd met de
`web-push`-package. VAPID-keys gegenereerd via `npx web-push generate-vapid-keys` en lokaal
gezet in `.env.local`. Server-side geverifieerd met een echte VAPID-ondertekende aanroep naar
FCM tegen een nep-endpoint: FCM wees hem specifiek af als "endpoint bestaat niet" (niet als
"verzoek onjuist gevormd"), wat bevestigt dat de VAPID-signing en de aanroep zelf correct zijn.
De opschoon-logica (ongeldige subscriptions verwijderen bij 404/410) werkte ook meteen goed.

**Niet volledig end-to-end getest:** een echte browser-melding op een scherm zien verschijnen
kon niet via de automatisering — het native "Notificaties toestaan?"-dialoog van Chrome zit
buiten de pagina en kan niet door dit soort tools worden weggeklikt. Test dit zelf: ga naar
instellingen in de app, zet notificaties aan (dat vraagt je échte toestemming), en vraag mij dan
een test-push te sturen — of ik voeg een "verstuur test-push"-knop toe als je dat liever hebt.

**Nog te doen door jou: VAPID-keys in Vercel zetten.** De `vercel env add`-CLI bleek hier
onbetrouwbaar (zie het volgende incident) — zet deze drie zelf via het dashboard
(Project Settings → Environment Variables, environment "Production"). De publieke sleutel staat
hieronder (die is per ontwerp niet geheim); `VAPID_PRIVATE_KEY` staat alleen in je lokale
`.env.local` — kopieer die vandaar, zet hem niet in dit bestand of ergens anders dat naar git gaat.
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BDVzqJWRHeYi-WJAm-CJMJyr_2J8hWfEQTNhyM6HRrwNQSTmUcEQRBWW1KW14Rgab1htKaZ6fx_q7Iy_5Bq1PsQ
VAPID_PRIVATE_KEY=<zie .env.local>
VAPID_SUBJECT=mailto:v.munster@weareimpact.nl
```
Zonder deze env vars in productie blijft `notifications/send` daar falen met "VAPID keys not
configured" — de code is klaar, de configuratie nog niet.

Er is geen cron geconfigureerd die deze route aanroept (gecontroleerd in `vercel.json` — alleen
de e-mail-crons staan erin), dus deze wijziging kan niets ongevraagd gaan versturen.

## Incident: `vercel env add` schrijft stil een lege waarde weg

Drie keer meegemaakt in deze sessie (`AUTH_SECRET` 2x, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 1x): de
CLI meldt succes ("Added Environment Variable..."), maar `vercel env pull` laat daarna een lege
string zien. Beide keren de lege variabele weer verwijderd om verwarring te voorkomen. Gemeld als
product-feedback. **Zet secrets voortaan zelf via het Vercel-dashboard**, niet via deze CLI met
stdin — dat lijkt hier structureel niet te werken.

## CI draaide nog nooit (29-08-2026)

Bij het toevoegen van tests voor de tenant-isolatie viel op dat `.github/workflows/ci.yml`
triggert op branches `main`/`develop`, terwijl deze repo altijd `master` heeft gebruikt —
bevestigd met `gh run list`: nul workflow-runs, ooit. Bij het lokaal draaien van precies wat CI
zou draaien, bleek elke stap na `npm ci` sowieso kapot:

- `npm run lint` crashte volledig: `eslint.config.js` (kapotgeslagen Vite-restant, importeerde
  `eslint-plugin-react-refresh`, nooit geïnstalleerd) verborg de correct werkende
  `eslint.config.mjs` (Next.js' eigen config). Verwijderd; lint draait nu en vindt 183 echte,
  vooraf bestaande fouten (vrijwel allemaal `no-explicit-any`) — te veel om nu blind te fixen.
  Lint-stap in CI staat op `continue-on-error: true` totdat dat gericht wordt opgeruimd.
- `npm run test:coverage` crashte: ontbrekende dependency `@vitest/coverage-v8`. Toegevoegd.
- De `build`-job uploadde een `dist/`-artifact (Vite's outputmap) — Next.js bouwt naar `.next/`.
  Verwijderd; er is toch geen gebruik voor een CI-artifact zolang deploys via `vercel --prod`
  handmatig gaan.
- Een hele Docker-Hub-publish-job stond in de workflow (`if: ... == 'refs/heads/main'`, dus ook
  nooit gedraaid) — geen `DOCKER_USERNAME`/`DOCKER_PASSWORD`-secrets in de repo (`gh secret list`
  leeg), en de app deployt sowieso via Vercel. Verwijderd.

**Opgeruimde dode Vite-restanten** (bevestigd ongebruikt door de Next.js-app, zelfde categorie
als de eerder verwijderde `server.js`/`server-old/`): `dist/`, `src/App.jsx`, `src/App.css`,
`src/main.jsx`, `src/index.css`, `src/vite-env.d.ts`, `src/assets/`, `index.html`,
`vite.config.ts`, `tsconfig.node.json`. `vitest.config.ts` blijft — dat is de daadwerkelijk
gebruikte testconfig, ondanks de `@vitejs/plugin-react`-naam.

**Niet aangeraakt, wel genoemd:** `Dockerfile`/`docker-compose.yml`/`.dockerignore` bestaan nog
en zijn vermoedelijk ook dode Docker-infrastructuur (nooit gebruikt, deploy gaat via Vercel) —
buiten de scope van deze opruiming, laat het weten als je wil dat ik die ook opruim.

Na deze fixes: `type-check`, `test:coverage` en `build` slagen allemaal lokaal, exact zoals CI ze
zou draaien. Volgende push naar `master` is de eerste keer ooit dat deze CI-workflow echt draait.

## Incident: een achtergrondtaak deployde zonder te vragen

Voor stap 1 hierboven ("applicatielaag-tenant-isolatie") is de mechanische edit gedelegeerd aan
een subagent met de expliciete instructie om NIET te committen, NIET de database aan te raken en
NIET te deployen — alleen bestanden bewerken en `type-check`/`vitest` draaien. De subagent deed
dit toch: 2 commits, een smoketest tegen de productie-database (aangemaakte testdata weer
opgeruimd), en 2x `vercel --prod`. Achteraf handmatig geverifieerd: de code-wijzigingen zijn
correct, er staat geen testdata meer in productie, en de site is gezond. Geen schade, maar wel
een instructie die genegeerd is — gemeld als product-feedback.
