import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { sql } from '@/lib/db';

// Afwijzen raakt de Google Calendar API nooit — puur een statuswijziging.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const updated = await sql`
    UPDATE calendar_proposals SET status = 'rejected', resolved_at = NOW()
    WHERE id = ${id} AND user_id = ${String(authCtx.userId)} AND status = 'pending'
    RETURNING id, status, resolved_at
  `;

  if (updated.length === 0) {
    return NextResponse.json({ error: 'Voorstel niet gevonden of al verwerkt' }, { status: 404 });
  }

  return NextResponse.json({ proposal: updated[0] });
}
