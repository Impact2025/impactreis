// Gedeeld met dashboard en avondritueel: bouwt een vooringevulde Google Calendar "nieuw
// event"-link. Nooit een automatische schrijfactie — de gebruiker bevestigt en bewaart zelf,
// exact het bestaande ImpactOS calendar_proposals-patroon (zie src/lib/google-calendar.ts).

const toGCal = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

export function buildRecoveryProposalUrl(
  start: Date,
  durationMinutes: number,
  title: string,
  details: string
): string {
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGCal(start)}/${toGCal(end)}&details=${encodeURIComponent(details)}`;
}
