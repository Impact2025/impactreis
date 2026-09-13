import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { isCalendarConfiguredFor, listTodayEvents } from '@/lib/google-calendar';

// Alleen-lezen: vandaag in de agenda van de eigenaar, via het service-account dat ImpactOS ook
// al gebruikt. Nog geen per-klant OAuth — er is maar één agenda gekoppeld, dus dit is expliciet
// beperkt tot GOOGLE_CALENDAR_OWNER_ORGANIZATION_ID (zie isCalendarConfiguredFor in
// src/lib/google-calendar.ts). Elke andere organisatie krijgt "niet geconfigureerd" i.p.v. de
// agenda van de eigenaar te zien.
export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isCalendarConfiguredFor(authCtx.organizationId)) {
    return NextResponse.json({ configured: false, events: [] });
  }

  try {
    const events = await listTodayEvents(authCtx.organizationId);
    return NextResponse.json({ configured: true, events });
  } catch (error: any) {
    console.error('Calendar fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Kon agenda niet ophalen' },
      { status: 502 }
    );
  }
}
