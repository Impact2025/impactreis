import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { sql } from '@/lib/db';
import { authenticateToken } from '@/lib/auth';
import { sessieAnalyseEmail, SessieAnalyseData } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DAY_NAMES = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

function getCurrentStreak(logs: { date_string: string }[]): number {
  const dates = [...new Set(logs.map(l => l.date_string))].sort().reverse();
  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 0;
  let prev: Date | null = null;

  for (const d of dates) {
    const cur = new Date(d);
    if (prev === null) { streak = 1; prev = cur; continue; }
    const diff = Math.round((prev.getTime() - cur.getTime()) / 86400000);
    if (diff === 1) { streak++; prev = cur; } else break;
  }
  return streak;
}

export async function POST(request: NextRequest) {
  const userId = await authenticateToken(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let sessionData: SessieAnalyseData['today'];
  try {
    sessionData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Get user email
  const users = await sql`SELECT email FROM users WHERE id = ${userId} LIMIT 1`;
  if (users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const userEmail = users[0].email as string;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const todayDate = now.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });

  // Get yesterday's log
  const yesterdayLogs = await sql`
    SELECT data FROM daily_logs
    WHERE user_id = ${userId} AND type = 'morning' AND date_string = ${yesterday}
    LIMIT 1
  `;

  // Get all logs for streak calculation
  const allLogs = await sql`
    SELECT date_string FROM daily_logs
    WHERE user_id = ${userId} AND type = 'morning'
    ORDER BY date_string DESC
    LIMIT 30
  `;

  const streak = getCurrentStreak(allLogs as { date_string: string }[]);

  let yesterdayData: SessieAnalyseData['yesterday'] = null;
  if (yesterdayLogs.length > 0) {
    const raw = typeof yesterdayLogs[0].data === 'string'
      ? JSON.parse(yesterdayLogs[0].data)
      : yesterdayLogs[0].data;
    yesterdayData = {
      energyLevel: raw.energyLevel || 0,
      sleepQuality: raw.sleepQuality || 0,
      intentie: raw.intentie || '',
      dankbaarheid: raw.dankbaarheid || [],
    };
  }

  // Claude AI analysis
  const energyTrend = yesterdayData
    ? sessionData.energyLevel > yesterdayData.energyLevel
      ? 'gestegen'
      : sessionData.energyLevel < yesterdayData.energyLevel
      ? 'gedaald'
      : 'gelijk gebleven'
    : null;

  const prompt = `Je bent een empathische, motiverende life coach die gespecialiseerd is in ondernemers en persoonlijke groei.
Analyseer de ochtend ritual sessie van vandaag en schrijf een persoonlijke coaching analyse in het Nederlands.

SESSIE VAN VANDAAG (${todayDate}, ${dayName}):
- Energie niveau: ${sessionData.energyLevel}/10
- Slaap kwaliteit: ${sessionData.sleepQuality}/10
- Wakker geworden: ${sessionData.wakeTime}
- Intentie: "${sessionData.intentie}"
- Dankbaarheid: ${sessionData.dankbaarheid.filter(Boolean).map((d, i) => `${i + 1}. ${d}`).join(', ')}
- Affirmatie: "${sessionData.affirmatie}"

${yesterdayData ? `SESSIE VAN GISTEREN:
- Energie: ${yesterdayData.energyLevel}/10 (vandaag ${energyTrend})
- Slaap: ${yesterdayData.sleepQuality}/10
- Intentie gisteren: "${yesterdayData.intentie}"
- Dankbaarheid gisteren: ${yesterdayData.dankbaarheid.filter(Boolean).join(', ')}` : 'GISTEREN: Geen sessie data beschikbaar.'}

STREAK: ${streak} dag${streak !== 1 ? 'en' : ''} op rij

Schrijf een analyse van 150-200 woorden die:
1. Begint met een observatie over vandaag's sessie (energie, slaap, intentie)
2. ${yesterdayData ? 'Verwijst naar de vergelijking met gisteren en wat dat zegt' : 'Moedigt aan om consistent te zijn'}
3. Een concreet inzicht geeft over de dankbaarheid of intentie van vandaag
4. Eindigt met één krachtige coaching tip of bemoediging

Schrijf in de jij-vorm, warm en direct. Geen bullet points — gewone paragrafen.`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const aiAnalyse = message.content[0].type === 'text' ? message.content[0].text : 'Analyse niet beschikbaar.';

  const emailData: SessieAnalyseData = {
    todayDate,
    dayName,
    today: sessionData,
    yesterday: yesterdayData,
    streak,
    aiAnalyse,
  };

  const { subject, html } = sessieAnalyseEmail(emailData);

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Mijn Ondernemers OS <onboarding@resend.dev>',
    to: userEmail,
    subject,
    html,
  });

  if (error) {
    console.error('Resend error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
