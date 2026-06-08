import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { sql } from '@/lib/db';
import { authenticateToken } from '@/lib/auth';
import { adhdRapportEmail, AdhdRapportData } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

const SYMPTOMS = [
  'Moeite met concentratie', 'Vergeetachtigheid', 'Hyperfocus',
  'Onrust in hoofd', 'Onrust in lichaam', 'Beweeglijkheid',
  'Snel praten', 'Prikkelbaarheid', 'Somberheid',
  'Stemmingswisselingen', 'Impulsiviteit', 'Agressiviteit',
  'Suïcidaliteit', 'Vreetbuien',
];

const MAX_TOTAL = SYMPTOMS.length * 3; // 42

const WEEK1_START = '2026-06-03';
const WEEK1_END = '2026-06-09';
const WEEK2_START = '2026-06-10';
const WEEK2_END = '2026-06-17';

function formatNL(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

async function computeWeekStats(userId: number, start: string, end: string) {
  const logs = await sql`
    SELECT date_string, data FROM daily_logs
    WHERE user_id = ${userId}
      AND type = 'adhd'
      AND date_string >= ${start}
      AND date_string <= ${end}
    ORDER BY date_string ASC
  `;

  const loggedDays = logs.length;

  const symptomAvgs: Record<string, number> = {};
  SYMPTOMS.forEach(s => { symptomAvgs[s] = 0; });

  if (loggedDays === 0) {
    return { loggedDays, avgDagScore: 0, symptomAvgs };
  }

  let totalScore = 0;
  for (const row of logs) {
    const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    const scores: Record<string, number> = d.scores ?? {};
    const dayTotal = Object.values(scores).reduce((a: number, b) => a + (b as number), 0);
    totalScore += dayTotal;
    SYMPTOMS.forEach(s => { symptomAvgs[s] += scores[s] ?? 0; });
  }

  SYMPTOMS.forEach(s => { symptomAvgs[s] = symptomAvgs[s] / loggedDays; });
  const avgDagScore = totalScore / loggedDays;

  return { loggedDays, avgDagScore, symptomAvgs };
}

async function buildAndSend(userId: number, toEmail: string, weekNr: 1 | 2) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mijn-ondernemers-os.vercel.app';

  const start = weekNr === 1 ? WEEK1_START : WEEK2_START;
  const end = weekNr === 1 ? WEEK1_END : WEEK2_END;

  const { loggedDays, avgDagScore, symptomAvgs } = await computeWeekStats(userId, start, end);

  const top5 = [...SYMPTOMS]
    .sort((a, b) => symptomAvgs[b] - symptomAvgs[a])
    .slice(0, 5);

  let week1AvgDagScore: number | undefined;
  let week1SymptomAvgs: Record<string, number> | undefined;

  if (weekNr === 2) {
    const week1 = await computeWeekStats(userId, WEEK1_START, WEEK1_END);
    week1AvgDagScore = week1.avgDagScore;
    week1SymptomAvgs = week1.symptomAvgs;
  }

  const emailData: AdhdRapportData = {
    weekNr,
    weekStart: formatNL(start),
    weekEnd: formatNL(end),
    loggedDays,
    avgDagScore,
    maxScore: MAX_TOTAL,
    symptomAvgs,
    top5,
    week1AvgDagScore,
    week1SymptomAvgs,
  };

  const { subject, html } = adhdRapportEmail(emailData, appUrl);

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Mijn Ondernemers OS <onboarding@resend.dev>',
    to: toEmail,
    subject,
    html,
  });

  if (error) throw new Error(JSON.stringify(error));
}

function detectWeek(): 1 | 2 {
  const today = new Date().toISOString().split('T')[0];
  return today <= WEEK1_END ? 1 : 2;
}

// GET — triggered by Vercel cron (June 9 and June 17)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = process.env.NOTIFICATION_EMAIL!;
  const users = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
  if (users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    await buildAndSend(users[0].id as number, email, detectWeek());
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('ADHD rapport error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — manual trigger via JWT auth (for testing from settings)
export async function POST(request: NextRequest) {
  const userId = await authenticateToken(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await sql`SELECT email FROM users WHERE id = ${userId} LIMIT 1`;
  if (users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let weekNr: 1 | 2 = detectWeek();
  try {
    const body = await request.json();
    if (body.week === 1 || body.week === 2) weekNr = body.week;
  } catch { /* use auto-detected week */ }

  try {
    await buildAndSend(userId as number, users[0].email as string, weekNr);
    return NextResponse.json({ ok: true, week: weekNr });
  } catch (err: any) {
    console.error('ADHD rapport error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
