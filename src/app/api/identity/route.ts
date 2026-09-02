import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthContext } from '@/lib/auth-context';

/**
 * GET /api/identity
 * Haal het identiteitsprofiel (statements + proofs) op voor de ingelogde gebruiker.
 * Bestaat de rij nog niet, dan geven we lege arrays terug (nog geen 404 — de pagina
 * behandelt "nog niets aangemaakt" als normale staat).
 */
export async function GET(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    const userId = authCtx?.userId ?? null;
    const organizationId = authCtx?.organizationId ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await sql`
      SELECT statements, proofs, updated_at FROM identity_profiles
      WHERE user_id = ${userId} AND organization_id = ${organizationId}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ statements: [], proofs: [] });
    }

    return NextResponse.json({
      statements: rows[0].statements ?? [],
      proofs: rows[0].proofs ?? [],
      updatedAt: rows[0].updated_at,
    });
  } catch (error) {
    console.error('Get identity profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/identity
 * Upsert het volledige identiteitsprofiel (statements + proofs in één keer) —
 * dezelfde "hele array in één keer beheren"-aanpak als de pagina al hanteerde.
 * Body: { statements: IdentityStatement[], proofs: IdentityProof[] }
 */
export async function PUT(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    const userId = authCtx?.userId ?? null;
    const organizationId = authCtx?.organizationId ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const statements = Array.isArray(body.statements) ? body.statements : [];
    const proofs = Array.isArray(body.proofs) ? body.proofs : [];

    const result = await sql`
      INSERT INTO identity_profiles (user_id, organization_id, statements, proofs, updated_at)
      VALUES (${userId}, ${organizationId}, ${JSON.stringify(statements)}, ${JSON.stringify(proofs)}, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET
        statements = ${JSON.stringify(statements)},
        proofs = ${JSON.stringify(proofs)},
        updated_at = NOW()
      RETURNING statements, proofs, updated_at
    `;

    return NextResponse.json({
      statements: result[0].statements,
      proofs: result[0].proofs,
      updatedAt: result[0].updated_at,
    });
  } catch (error) {
    console.error('Update identity profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
