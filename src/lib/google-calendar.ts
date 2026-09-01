// Google Calendar (service-account) — hergebruikt dezelfde credentials als ImpactOS/agentos
// (D:\apps\agentos, backend/domains/calendar/service_google.py). Die agenda (`chat@weareimpact.nl`)
// is expliciet gedeeld met het service-account; geen domain-wide delegation nodig.
//
// Lezen (listEvents/listTodayEvents) voedt de ochtendbriefing/dashboard.
// Schrijven (createEvent) mag ALLEEN aangeroepen worden ná expliciete gebruikersgoedkeuring van
// een `calendar_proposals`-rij (zie src/app/api/calendar/proposals/[id]/approve/route.ts) — dat
// is de menselijke review-gate die ImpactOS al kent. Nooit rechtstreeks vanuit coach-analyse.
import { JWT } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

let client: JWT | null = null;

function getClient(): JWT {
  if (!client) {
    const email = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
    const key = process.env.GOOGLE_CALENDAR_PRIVATE_KEY;
    if (!email || !key) {
      throw new Error('GOOGLE_CALENDAR_CLIENT_EMAIL/GOOGLE_CALENDAR_PRIVATE_KEY niet geconfigureerd.');
    }
    client = new JWT({ email, key, scopes: SCOPES });
  }
  return client;
}

export function isCalendarConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CALENDAR_CLIENT_EMAIL && process.env.GOOGLE_CALENDAR_PRIVATE_KEY);
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string | null; // ISO, of null bij een hele-dag-event zonder tijd
  end: string | null;
  isAllDay: boolean;
  location: string | null;
}

/** Events tussen `timeMin` en `timeMax` (ISO 8601), gesorteerd op starttijd. */
export async function listEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID niet geconfigureerd.');

  const jwt = getClient();
  const url = new URL(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '25');

  const res = await jwt.request<{ items?: any[] }>({ url: url.toString() });

  return (res.data.items ?? []).map((item) => ({
    id: item.id,
    summary: item.summary ?? '(geen titel)',
    start: item.start?.dateTime ?? null,
    end: item.end?.dateTime ?? null,
    isAllDay: !item.start?.dateTime && Boolean(item.start?.date),
    location: item.location ?? null,
  }));
}

export interface NewCalendarEvent {
  summary: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
}

/** Schrijft een nieuwe afspraak. Roep dit ALLEEN aan na expliciete gebruikersgoedkeuring
 * van een calendar_proposals-rij — nooit automatisch. */
export async function createEvent(input: NewCalendarEvent): Promise<CalendarEvent> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID niet geconfigureerd.');

  const jwt = getClient();
  const url = `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`;

  const res = await jwt.request<any>({
    url,
    method: 'POST',
    data: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startTime, timeZone: 'Europe/Amsterdam' },
      end: { dateTime: input.endTime, timeZone: 'Europe/Amsterdam' },
    },
  });

  return {
    id: res.data.id,
    summary: res.data.summary ?? input.summary,
    start: res.data.start?.dateTime ?? null,
    end: res.data.end?.dateTime ?? null,
    isAllDay: false,
    location: res.data.location ?? null,
  };
}

/** Vandaag (lokale Europe/Amsterdam-dag), voor de ochtendbriefing/dashboard. */
export async function listTodayEvents(): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return listEvents(startOfDay.toISOString(), endOfDay.toISOString());
}
