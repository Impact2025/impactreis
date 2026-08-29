import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { isCalendarConfigured, listTodayEvents } from '@/lib/google-calendar';

// Alleen-lezen: vandaag in Vincents agenda (chat@weareimpact.nl), via het service-account dat
// ImpactOS ook al gebruikt. Systeembreed, niet per-organisatie — er is nog maar één agenda
// gekoppeld, geen per-klant OAuth. Zie src/lib/google-calendar.ts.
export async function GET(request: NextRequest) {
  const authCtx = await getAuthContext(request);
  if (!authCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isCalendarConfigured()) {
    return NextResponse.json({ configured: false, events: [] });
  }

  try {
    const events = await listTodayEvents();
    return NextResponse.json({ configured: true, events });
  } catch (error: any) {
    console.error('Calendar fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Kon agenda niet ophalen' },
      { status: 502 }
    );
  }
}
