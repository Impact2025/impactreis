import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { sql } from '@/lib/db';

// Voorstellen voor agenda-tijdblokken — GEEN Google Calendar-write hier. Schrijven gebeurt pas
// in /api/calendar/proposals/[id]/approve na expliciete goedkeuring. Zie src/lib/google-calendar.ts.
export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const proposals = await sql`
    SELECT id, summary, start_time, end_time, reason, source, status, created_at
    FROM calendar_proposals
    WHERE user_id = ${String(authCtx.userId)} AND status = 'pending'
    ORDER BY start_time ASC
  `;

  return NextResponse.json({ proposals });
}

export async function POST(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!authCtx.organizationId) {
    return NextResponse.json({ error: 'Geen organisatie gekoppeld aan dit account' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const { summary, startTime, endTime, reason, source } = body ?? {};
  if (!summary || !startTime || !endTime) {
    return NextResponse.json({ error: 'summary, startTime en endTime zijn verplicht' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO calendar_proposals (organization_id, user_id, summary, start_time, end_time, reason, source, status)
    VALUES (${authCtx.organizationId}, ${String(authCtx.userId)}, ${summary}, ${startTime}, ${endTime}, ${reason ?? null}, ${source ?? 'coach'}, 'pending')
    RETURNING id, summary, start_time, end_time, reason, source, status, created_at
  `;

  return NextResponse.json({ proposal: rows[0] }, { status: 201 });
}
