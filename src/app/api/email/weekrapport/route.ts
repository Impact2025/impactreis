import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { sql } from '@/lib/db';
import { authenticateToken } from '@/lib/auth';
import { weekrapportEmail, WeekrapportData } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

async function openRouterChat(prompt: string): Promise<string> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://mijn-ondernemers-os.vercel.app',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4-5',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? 'Analyse niet beschikbaar.';
  } catch {
    return 'AI analyse tijdelijk niet beschikbaar.';
  }
}

async function buildAndSend(userId: number, toEmail: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mijn-ondernemers-os.vercel.app';

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setHours(0, 0, 0, 0);
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekEnd.getDate() - 6);

  const startStr = weekStart.toISOString().split('T')[0];
  const endStr = new Date(now).toISOString().split('T')[0];

  const formatDate = (d: Date) =>
    d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

  // Morning logs for the week
  const morningLogs = await sql`
    SELECT date_string, data FROM daily_logs
    WHERE user_id = ${userId}
      AND type = 'morning'
      AND date_string >= ${startStr}
      AND date_string <= ${endStr}
    ORDER BY date_string ASC
  `;

  const ritualsCompleted = morningLogs.length;

  let totalEnergy = 0, totalSleep = 0, energyCount = 0, sleepCount = 0;
  let focusBlokkengepland = 0;
  const topFocusBlokken: { time: string; onderwerp: string; doel: string }[] = [];

  for (const row of morningLogs) {
    const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    if (typeof d.energyLevel === 'number') { totalEnergy += d.energyLevel; energyCount++; }
    if (typeof d.sleepQuality === 'number') { totalSleep += d.sleepQuality; sleepCount++; }
    if (d.focusBlok1?.onderwerp) {
      focusBlokkengepland++;
      if (topFocusBlokken.length < 4)
        topFocusBlokken.push({ time: '08:30', onderwerp: d.focusBlok1.onderwerp, doel: d.focusBlok1.doel || '' });
    }
    if (d.focusBlok2?.onderwerp) {
      focusBlokkengepland++;
      if (topFocusBlokken.length < 4)
        topFocusBlokken.push({ time: '12:30', onderwerp: d.focusBlok2.onderwerp, doel: d.focusBlok2.doel || '' });
    }
  }

  const avgEnergy = energyCount > 0 ? totalEnergy / energyCount : null;
  const avgSleep = sleepCount > 0 ? totalSleep / sleepCount : null;

  // Wins for the week
  const winsRows = await sql`
    SELECT title, category, impact_level FROM wins
    WHERE user_id = ${userId}
      AND date >= ${startStr}
      AND date <= ${endStr}
    ORDER BY impact_level DESC, date DESC
    LIMIT 10
  `;

  const wins = winsRows.map((w: any) => ({
    title: w.title as string,
    category: w.category as string,
    impactLevel: w.impact_level as number,
  }));

  // AI coaching samenvatting
  const topWinsText = wins.slice(0, 3).map(w => w.title).join(', ') || 'geen';
  const topFocusText = topFocusBlokken.slice(0, 3).map(f => f.onderwerp).join(', ') || 'geen';

  const prompt = `Je bent een empathische life coach voor ondernemers. Schrijf een persoonlijke weeksamenvatting in het Nederlands.

WEEK ${formatDate(weekStart)} – ${formatDate(weekEnd)}:
- Ochtend rituelen: ${ritualsCompleted}/7 dagen
- Gemiddelde energie: ${avgEnergy !== null ? avgEnergy.toFixed(1) + '/10' : 'niet gelogd'}
- Gemiddelde slaap: ${avgSleep !== null ? avgSleep.toFixed(1) + '/10' : 'niet gelogd'}
- Focusblokken gepland: ${focusBlokkengepland}
- Wins gelogd: ${wins.length} (top: ${topWinsText})
- Focus onderwerpen: ${topFocusText}

Schrijf een weeksamenvatting van 150–200 woorden die:
1. De week in perspectief plaatst
2. Specifiek benoemt wat goed ging (gebruik de echte data)
3. Één concreet punt voor de volgende week
4. Eindigt met een motiverende boodschap

Schrijf in de jij-vorm, warm en direct. Geen bullet points — gewone paragrafen.`;

  const aiSamenvatting = await openRouterChat(prompt);

  const emailData: WeekrapportData = {
    weekStart: formatDate(weekStart),
    weekEnd: formatDate(weekEnd),
    ritualsCompleted,
    avgEnergy,
    avgSleep,
    focusBlokkengepland,
    wins,
    topFocusBlokken,
    aiSamenvatting,
  };

  const { subject, html } = weekrapportEmail(emailData, appUrl);

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Mijn Ondernemers OS <onboarding@resend.dev>',
    to: toEmail,
    subject,
    html,
  });

  if (error) throw new Error(JSON.stringify(error));
}

// GET — triggered by Vercel cron (every Sunday 07:00 UTC)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = process.env.NOTIFICATION_EMAIL!;
  const users = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    await buildAndSend(users[0].id as number, email);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Weekrapport error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — manual trigger via JWT auth (for testing from settings)
export async function POST(request: NextRequest) {
  const userId = await authenticateToken(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await sql`SELECT email FROM users WHERE id = ${userId} LIMIT 1`;
  if (users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    await buildAndSend(userId as number, users[0].email as string);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Weekrapport error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
