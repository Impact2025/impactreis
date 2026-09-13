import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { sql } from '@/lib/db';
import { createEvent, isCalendarConfiguredFor } from '@/lib/google-calendar';

// De ENIGE plek waar een calendar_proposals-rij een echte Google Calendar-afspraak wordt —
// altijd getriggerd door een expliciete gebruikersactie (klik op "Goedkeuren"), nooit automatisch.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Er is nog maar één echte Google Calendar gekoppeld (het service-account van de eigenaar) —
  // zonder deze check zou een gebruiker uit een andere organisatie hier een voorstel kunnen
  // goedkeuren en zo een echte afspraak in de agenda van de eigenaar laten aanmaken.
  if (!isCalendarConfiguredFor(authCtx.organizationId)) {
    return NextResponse.json(
      { error: 'Agenda-integratie is niet beschikbaar voor deze organisatie.' },
      { status: 403 }
    );
  }

  const { id } = await params;
  const rows = await sql`
    SELECT id, summary, start_time, end_time, reason, status
    FROM calendar_proposals
    WHERE id = ${id} AND user_id = ${String(authCtx.userId)}
  `;
  const proposal = rows[0];
  if (!proposal) {
    return NextResponse.json({ error: 'Voorstel niet gevonden' }, { status: 404 });
  }
  if (proposal.status !== 'pending') {
    return NextResponse.json({ error: `Voorstel is al ${proposal.status}` }, { status: 409 });
  }

  try {
    await createEvent(
      {
        summary: proposal.summary,
        description: proposal.reason ?? undefined,
        startTime: new Date(proposal.start_time).toISOString(),
        endTime: new Date(proposal.end_time).toISOString(),
      },
      authCtx.organizationId
    );
  } catch (error: any) {
    console.error('Calendar createEvent error:', error);
    return NextResponse.json({ error: error.message || 'Kon afspraak niet aanmaken' }, { status: 502 });
  }

  const updated = await sql`
    UPDATE calendar_proposals SET status = 'approved', resolved_at = NOW()
    WHERE id = ${id}
    RETURNING id, summary, start_time, end_time, status, resolved_at
  `;

  return NextResponse.json({ proposal: updated[0] });
}
