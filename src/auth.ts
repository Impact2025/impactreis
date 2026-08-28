// Auth.js scaffold voor de multi-tenant magic-link login (vervangt uiteindelijk JWT/bcrypt in
// src/lib/auth.ts). NIET NOG GEWIRED in de API-routes — zie MULTI_TENANT_MIGRATION.md stap 4
// voor de cutover-volgorde. Draai eerst de migratie in migrations/manual/, en verifieer
// lokaal met een testmail voordat dit de bestaande login vervangt.
import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './lib/db/client';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL || 'Mijn Ondernemers OS <onboarding@resend.dev>',
    }),
  ],
  session: { strategy: 'database' },
  pages: {
    signIn: '/auth',
  },
});

// TODO vóór activatie (zie MULTI_TENANT_MIGRATION.md):
// 1. Voeg de Auth.js-adaptertabellen toe aan schema.ts (accounts, sessions, verification_token)
//    en map ze op de bestaande `users`-tabel i.p.v. een tweede user-tabel te introduceren.
// 2. Draai migrations/manual/0001_add_multi_tenant_columns.sql tegen productie.
// 3. Test lokaal: npm run dev, magic link aanvragen, inloggen, sessie bevat organizationId.
// 4. Pas daarna de 32 API-routes onder src/app/api die nu authenticateToken() gebruiken
//    aan naar auth() uit dit bestand — één route per keer, met een test per route.
