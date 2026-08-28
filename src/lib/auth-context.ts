// Gedeelde auth-resolutie voor API-routes tijdens de multi-tenant overgang.
//
// Twee geldige manieren om ingelogd te zijn, allebei tot een organizationId herleid:
//  1. JWT bearer-token (bestaande login, src/lib/auth.ts) — blijft werken, dit is vandaag
//     de enige manier waarop de UI daadwerkelijk inlogt.
//  2. Auth.js database-sessie (magic link, src/auth.ts) — nieuw, klaar voor zodra de UI
//     een magic-link-scherm heeft.
//
// Routes die authenticateToken() vervangen door getAuthContext() blijven dus werken voor
// de huidige gebruiker én zijn meteen klaar voor een tweede tenant via magic link.
import { NextRequest } from 'next/server';
import { authenticateToken } from './auth';
import { auth } from '@/auth';
import { sql } from './db';

export interface AuthContext {
  userId: number;
  organizationId: number | null;
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const jwtUserId = await authenticateToken(request);
  if (jwtUserId) {
    const rows = await sql`SELECT organization_id FROM users WHERE id = ${jwtUserId}`;
    return { userId: jwtUserId, organizationId: rows[0]?.organization_id ?? null };
  }

  const session = await auth();
  if (session?.user?.email) {
    const rows = await sql`SELECT id, organization_id FROM users WHERE email = ${session.user.email}`;
    if (rows[0]) {
      return { userId: rows[0].id, organizationId: rows[0].organization_id ?? null };
    }
  }

  return null;
}
