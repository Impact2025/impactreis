// Auth.js — multi-tenant magic-link login. Loopt naast de bestaande JWT-auth
// (src/lib/auth.ts); routes migreren er één voor één naartoe, zie MULTI_TENANT_MIGRATION.md.
import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './lib/db/client';
import { authUsers, authAccounts, authSessions, authVerificationTokens, users, organizations } from './lib/db/schema';
import { eq } from 'drizzle-orm';

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
    }),
  ],
  session: { strategy: 'database' },
  pages: {
    signIn: '/auth',
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
});
