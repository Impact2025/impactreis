# STATUS — MyAIPA (Mijn Ondernemers OS)

**Laatste update:** 2026-09-01
**Dit is de enige bron van waarheid over de huidige staat van de app.** `SYSTEM_AUDIT_REPORT.md`, `PRODUCTION_READY.md` en delen van `CHANGELOG.md` beschrijven een eerdere architectuur (Express-server + Vite/React SPA) die niet meer bestaat in deze codebase — die documenten zijn gearchiveerd en gemarkeerd als verouderd. Gebruik dit bestand, niet die scores.

## Architectuur

- **Framework**: Next.js 16 (App Router), TypeScript, React 19.
- **Database**: Neon Postgres (serverless HTTP-driver). Overwegend raw SQL via getagde templates (`src/lib/db.ts`, ~150 call sites); een klein deel (onboarding-routes, Auth.js-adapter) gebruikt Drizzle ORM (`src/lib/db/schema.ts`, `src/lib/db/client.ts`).
- **Auth**: eigen JWT-laag (`src/lib/auth.ts`, token in `localStorage`) + `next-auth` v5 beta voor magic-link login. `getAuthContext()` is de gedeelde auth-check in alle API-routes.
- **Multi-tenant**: `organizations`/`organization_id` is **live in productie** (sinds 2026-08-28, zie `MULTI_TENANT_MIGRATION.md`) voor de 12 kerntabellen (users, habits, daily_logs, goals, weekly_goals, weekly_reviews, focus_sessions, wins, user_context, coach_lessons, energy_log, coach_predictions). App-laag filtert op `organization_id`; Row Level Security is **bewust uitgesteld** (Neon's HTTP-driver behoudt geen sessie-`SET`-state tussen tagged-template calls, dus `current_setting()`-gebaseerde RLS werkt niet zonder herbouw van de connectielaag).
- **PWA**: `public/manifest.json` + `public/custom-sw.js` + `src/app/offline/page.tsx` — functionele offline-opzet, niet decoratief.
- **Deploy**: Vercel, `reis.weareimpact.nl`. Handmatig via `vercel --prod` (geen GitHub auto-deploy).

## Routes (27 pagina's)

**Kernflow (dagelijks gebruik)**: `/dashboard`, `/morning`, `/evening`, `/focus`, `/coach`, `/wins`, `/goals`.
**Weekritme**: `/weekly-start`, `/weekly-review`, `/insights`.
**Verdieping / minder frequent**: `/identity`, `/dagboek`, `/controle-cirkel`, `/reflectie`, `/aca` (7-weken herstelpad), `/adhd` (symptoomtracker), `/courses` (+ `[slug]`, `[slug]/lesson/[lessonId]`).
**Systeem**: `/settings`, `/share`, `/offline`, `/onboarding`, `/auth/*` (login/register/forgot-password/reset-password/check-email).

Geen van deze routes is een lege stub — de zwakte zit niet in onvolledigheid maar in navigatie-hiërarchie (zie Workstream 4 in het bijbehorende plan).

## Coach-laag (`src/lib/coach.ts`)

Het sterkste onderdeel van de app. Geen "chatbot met system prompt":

- **Deterministische techniekkeuze** (`chooseTechnique`) uit 7 coachingmethodes (GROW, MI, oplossingsgericht, CGT, ACT, systemisch, strengths-based) op basis van harde cijfers (energietrend, streak, stressniveau) — niet aan het LLM overgelaten.
- **Lerend geheugen**: `coach_lessons` met Laplace-smoothed confidence die groeit/krimpt op bewijs.
- **Falsifieerbare voorspellingen**: `coach_predictions`-tabel bestaat in het schema, maar wordt momenteel **nergens gelezen of geschreven** in de code — dit is een dode tabel, geen actief mechanisme (bekend gat).
- **Proactieve signalering** (`detectProactiveSignal`): puur functioneel, herkent 3-dagen-lage-energie of energie-kost-groter-dan-geeft-patronen. Wordt aangeroepen door zowel de server-to-server bridge-route (`/api/coach/signal`, voor ImpactOS's WhatsApp-job) als de JWT-authed `/api/coach/proactive-signal` — die laatste voedt sinds 2026-09-01 een dismissable signaalkaart bovenaan het eigen dashboard.
- **Model**: `anthropic/claude-haiku-4-5` via OpenRouter, met fallback naar een lokale LLM-gateway.
- Coach-chat (`/api/coach/chat`) is dunner dan de asynchrone analyse (`runCoachAnalysis`) — 100 woorden max, geen sessie-geheugen buiten wat wordt meegegeven.

## Agenda-integratie

`src/lib/google-calendar.ts` leest (`listEvents`/`listTodayEvents`) en kan sinds 2026-09-01 ook schrijven (`createEvent`) — maar **nooit automatisch**. Schrijven loopt via een `calendar_proposals`-tabel (multi-tenant vanaf dag 1, zie migratie `migrations/manual/0004_calendar_proposals.sql`) en vier routes (`GET/POST /api/calendar/proposals`, `POST .../[id]/approve`, `POST .../[id]/reject`): de coach (of een toekomstige regel) legt een voorstel vast, en pas een expliciete klik op "Goedkeuren" in de dashboard-UI roept `createEvent()` aan. Dit volgt bewust hetzelfde review-gate-patroon als het zusterproject ImpactOS. De koppeling "coach-signaal → automatisch een voorstel aanmaken" is nog niet gebouwd — vandaag moet een voorstel handmatig of via een toekomstige uitbreiding worden aangemaakt (`POST /api/calendar/proposals`); de infrastructuur staat.

## Bekende technische schuld

1. **Schema-fragmentatie**: drie bronnen die uit elkaar lopen — `schema.sql` (verouderd, incl. een nooit-toegepaste `goals`-vorm), `src/lib/db/schema.ts` (canoniek voor Drizzle maar mist courses- en push-tabellen), en de daadwerkelijke productiedatabase (heeft alles, inclusief handmatige migraties in `migrations/manual/`). `migrations/0000_multi_tenant_foundation.sql` is drizzle-kit-gegenereerd en **niet veilig om tegen productie te draaien** (gaat uit van een lege database) — alleen de `migrations/manual/*`-bestanden zijn productie-veilig.
2. **Courses- en push-notificatietabellen** (`courses`, `course_modules`, ..., `push_subscriptions`, `notification_preferences`, `scheduled_notifications`) hebben geen `organization_id` en staan niet in het Drizzle-schema — ze bestaan alleen via losse, niet in `package.json` opgenomen scripts (`create-push-tables.js`) of via `run-schema.js`.
3. **Testdekking is dun**: 4 testbestanden (`coach.test.ts`, `auth-context.test.ts`, `utils.test.ts`, `button.test.tsx`), geen API-route- of E2E-tests.
4. **`coach_predictions`** is een dode tabel (zie boven).

## Retentie-mechanismen (werken echt, niet alleen aspirationeel)

- Streak-service (`src/lib/streak.service.ts`) met herstel-logica en milestones.
- E-mail cronjobs via Vercel Cron (`vercel.json`) + Resend: ochtend-motivatie (~06:00 NL), ochtend-herinnering (~08:30 NL), wekelijks rapport (zondag), mits `RESEND_API_KEY`/`CRON_SECRET` correct staan in Vercel.
