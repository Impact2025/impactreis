import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
import {
  REALITY_CHECK_QUESTIONS,
  scoreAnswers,
  getProfile,
  getHoursLost,
  getContradictionRisk,
  getWeaknessDiagnoses,
} from '@/lib/reality-check';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { realityCheckEmail1 } from '@/lib/email-templates';
import { clientIp, rateLimitResponse } from '@/lib/rate-limit';

const sql = neon(process.env.DATABASE_URL!);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimitResponse(`reality-check:${clientIp(request)}`, 5, 60);
    if (limited) return limited;

    const body = await request.json();
    const { email, name, level, answers } = body as {
      email?: string;
      name?: string;
      level?: string;
      answers?: number[];
    };

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Geldig zakelijk e-mailadres is verplicht' }, { status: 400 });
    }
    if (!level) {
      return NextResponse.json({ error: 'Directieniveau is verplicht' }, { status: 400 });
    }
    if (!Array.isArray(answers) || answers.length !== REALITY_CHECK_QUESTIONS.length) {
      return NextResponse.json({ error: 'Alle vragen moeten beantwoord zijn' }, { status: 400 });
    }

    // Score wordt hier, server-side, herberekend uit de ruwe antwoord-indices — nooit uit een
    // door de client aangeleverd totaal (zie src/lib/reality-check.ts).
    const score = scoreAnswers(answers);
    const profile = getProfile(score);
    const { weekly, monthly } = getHoursLost(score);
    const contradictionRisk = getContradictionRisk(answers[2]);
    const diagnoses = getWeaknessDiagnoses(answers);

    const unsubscribeToken = randomUUID();
    const [lead] = await sql`
      INSERT INTO reality_check_leads (email, name, level, answers, score, profile_key, weekly_hours_lost, monthly_hours_lost, unsubscribe_token)
      VALUES (${email}, ${name ?? null}, ${level}, ${JSON.stringify(answers)}, ${score}, ${profile.key}, ${weekly}, ${monthly}, ${unsubscribeToken})
      RETURNING id
    `;

    // Best-effort: e-mail 1 van de nurture-reeks direct versturen. Een falende send mag de
    // lead-opslag en het tonen van het resultaat nooit blokkeren — de nurture-cron pakt de
    // ontbrekende email1_sent_at anders gewoon niet op (die stuurt alleen stap 2-4).
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sparren.app';
      const { subject, html } = realityCheckEmail1({
        name,
        profileLabel: profile.label,
        score,
        maxScore: REALITY_CHECK_QUESTIONS.reduce((s, q) => s + Math.max(...q.options.map((o) => o.points)), 0),
        weeklyHoursLost: weekly,
        monthlyHoursLost: monthly,
        resultUrl: `${appUrl}/reality-check/result?score=${score}`,
        debriefUrl: `${appUrl}/auth/register`,
        unsubscribeUrl: `${appUrl}/api/email/reality-check-unsubscribe?token=${unsubscribeToken}`,
      });
      const { error: sendError } = await getResend().emails.send({ from: FROM_EMAIL, to: email, subject, html });
      if (!sendError) {
        await sql`UPDATE reality_check_leads SET email1_sent_at = NOW() WHERE id = ${lead.id}`;
      } else {
        console.error('reality-check email1 send failed:', sendError);
      }
    } catch (sendErr) {
      console.error('reality-check email1 send threw:', sendErr);
    }

    return NextResponse.json({
      score,
      maxScore: REALITY_CHECK_QUESTIONS.reduce((s, q) => s + Math.max(...q.options.map((o) => o.points)), 0),
      profile,
      weeklyHoursLost: weekly,
      monthlyHoursLost: monthly,
      contradictionRisk,
      diagnoses,
    });
  } catch (error) {
    console.error('Error saving reality check lead:', error);
    return NextResponse.json({ error: 'Kon resultaat niet opslaan' }, { status: 500 });
  }
}
