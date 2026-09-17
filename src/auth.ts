// Auth.js — multi-tenant magic-link login. Loopt naast de bestaande JWT-auth
// (src/lib/auth.ts); routes migreren er één voor één naartoe, zie MULTI_TENANT_MIGRATION.md.
import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './lib/db/client';
import { authUsers, authAccounts, authSessions, authVerificationTokens, users, organizations } from './lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from './lib/db';
import { ensurePreferences } from './lib/email-recipients';
import { isEmailInvited } from './lib/invites';
import { getResend, FROM_EMAIL } from './lib/resend';
import { welcomeEmail, magicLinkEmail } from './lib/email-templates';
import { notifyAdminNewUser } from './lib/admin-notify';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: authUsers,
    accountsTable: authAccounts,
    sessionsTable: authSessions,
    verificationTokensTable: authVerificationTokens,
  }),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL || 'Mijn Ondernemers OS <onboarding@resend.dev>',
      // Auth.js' eigen Resend-provider verstuurt anders een generieke Engelstalige mail zonder
      // huisstijl. We versturen 'm zelf via dezelfde Resend-client/template als de rest van de mails.
      async sendVerificationRequest({ identifier, url }) {
        // Invite-only: geen mail (en dus geen account) voor niet-uitgenodigde e-mailadressen.
        // Zie lib/invites.ts en /admin/uitnodigingen.
        if (!(await isEmailInvited(identifier))) {
          throw new Error('Dit e-mailadres heeft geen toegang. Vraag een uitnodiging aan.');
        }

        const { subject, html } = magicLinkEmail(url);
        // De resend-package gooit geen exception op een API-fout — die komt terug als
        // { error } terwijl de promise gewoon resolvet. Zonder deze check faalt verzending
        // stil: de gebruiker komt op /auth/check-email terecht zonder dat er ooit een mail is verstuurd.
        const { error } = await getResend().emails.send({ from: FROM_EMAIL, to: identifier, subject, html });
        if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
      },
    }),
  ],
  session: { strategy: 'database' },
  pages: {
    signIn: '/auth/login',
    verifyRequest: '/auth/check-email',
  },
  callbacks: {
    async session({ session, user }) {
      // Koppel de Auth.js-identiteit aan onze bestaande users/organizations-tabellen via e-mail.
      const [row] = await db
        .select({ organizationId: users.organizationId, orgSlug: organizations.slug, role: users.role })
        .from(users)
        .leftJoin(organizations, eq(users.organizationId, organizations.id))
        .where(eq(users.email, user.email!))
        .limit(1);

      return {
        ...session,
        user: {
          ...session.user,
          organizationId: row?.organizationId ?? null,
          organizationSlug: row?.orgSlug ?? null,
          role: row?.role ?? null,
        },
      };
    },
  },
  events: {
    // Vuurt wanneer Auth.js voor het eerst een auth_users-rij aanmaakt voor dit e-mailadres —
    // d.w.z. de allereerste succesvolle magic-link klik. Dat is nu de registratie-flow: geen
    // los /auth/register-formulier meer, gewoon dezelfde link die ook een bestaand account
    // matcht op e-mail (zie session-callback hierboven). Bestaande accounts (aangemaakt via het
    // oude wachtwoordformulier) hebben al een users-rij, dus die slaan de provisioning over.
    async createUser({ user }) {
      if (!user.email) return;

      const existing = await sql`SELECT id FROM users WHERE email = ${user.email}`;
      if (existing.length > 0) return;

      const emailLocalPart = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const orgSlug = `${emailLocalPart}-${Date.now().toString(36)}`;
      const orgResult = await sql`
        INSERT INTO organizations (slug, name, plan)
        VALUES (${orgSlug}, ${user.email}, 'starter')
        RETURNING id
      `;
      const organizationId = orgResult[0].id;

      const userResult = await sql`
        INSERT INTO users (email, organization_id)
        VALUES (${user.email}, ${organizationId})
        RETURNING id
      `;
      const newUserId = userResult[0].id;

      await ensurePreferences(newUserId);

      // Best-effort: een mislukte welkomstmail mag de account-aanmaak nooit laten falen.
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sparren.app';
        const { subject, html } = welcomeEmail(appUrl);
        await getResend().emails.send({ from: FROM_EMAIL, to: user.email, subject, html });
      } catch (err) {
        console.error('Welcome email failed (createUser continues):', err);
      }

      await notifyAdminNewUser(user.email, 'magic-link');
    },
    // Vuurt bij elke succesvolle magic-link login (ook na de allereerste, die createUser hierboven
    // al afhandelt) — bijhouden voor het admin-activiteitsoverzicht, zie /api/admin/users.
    async signIn({ user }) {
      if (!user.email) return;
      try {
        await sql`
          UPDATE users
          SET last_login_at = NOW(), login_count = login_count + 1
          WHERE email = ${user.email}
        `;
      } catch (err) {
        console.error('Login-tracking update failed (signIn continues):', err);
      }
    },
  },
});
