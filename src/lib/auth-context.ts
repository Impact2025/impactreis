// Gedeelde auth-resolutie voor API-routes tijdens de multi-tenant overgang.
//
// Drie geldige manieren om ingelogd te zijn, allevier tot een organizationId herleid:
//  1. JWT bearer-token (bestaande login, src/lib/auth.ts) — blijft werken, dit is vandaag
//     de enige manier waarop de UI daadwerkelijk inlogt.
//  2. COACH_BRIDGE_TOKEN (machine-to-machine, ImpactOS -> hier) — zelfde gedeelde geheim als
//     de bestaande coach-bridge-routes (src/lib/coach.ts:checkBridgeToken), nu ook geldig voor
//     /api/logs, /api/focus, /api/wins, /api/weekly-reviews zodat ImpactOS' rituals-domein
//     hier direct tegen kan lezen/schrijven i.p.v. een eigen lokale kopie bij te houden.
//  3. Auth.js database-sessie (magic link, src/auth.ts) — nieuw, klaar voor zodra de UI
//     een magic-link-scherm heeft.
//
// Routes die authenticateToken() vervangen door getAuthContext() blijven dus werken voor
// de huidige gebruiker én zijn meteen klaar voor een tweede tenant via magic link.
import { NextRequest } from 'next/server';
import { authenticateToken } from './auth';
import { auth } from '@/auth';
import { sql } from './db';
import { checkBridgeToken, loadSingleUserId, loadUserOrganizationId } from './coach';

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

  if (checkBridgeToken(request.headers.get('authorization'))) {
    const bridgeUserId = await loadSingleUserId();
    if (bridgeUserId) {
      const organizationId = await loadUserOrganizationId(bridgeUserId);
      return { userId: Number(bridgeUserId), organizationId };
    }
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
