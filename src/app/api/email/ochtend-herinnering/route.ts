import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { sql } from '@/lib/db';
import { herinneringEmail } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return Math.ceil((days + start.getDay() + 1) / 7);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notificationEmail = process.env.NOTIFICATION_EMAIL!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mijn-ondernemers-os.vercel.app';

  const now = new Date();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  const today = now.toISOString().split('T')[0];

  // Look up user by notification email
  const users = await sql`SELECT id FROM users WHERE email = ${notificationEmail} LIMIT 1`;
  if (users.length === 0) {
    return NextResponse.json({ skipped: 'user not found' });
  }
  const userId = users[0].id;

  let alreadyDone = false;

  if (isWeekend) {
    // Check weekly_reviews table for this week
    const weekNum = getWeekNumber(now);
    const year = now.getFullYear();
    const reviews = await sql`
      SELECT id FROM weekly_reviews
      WHERE user_id = ${userId}
        AND week_number = ${String(weekNum)}
        AND EXTRACT(YEAR FROM timestamp) = ${year}
      LIMIT 1
    `;
    alreadyDone = reviews.length > 0;
  } else {
    // Check daily_logs for today's morning ritual
    const logs = await sql`
      SELECT id FROM daily_logs
      WHERE user_id = ${userId}
        AND type = 'morning'
        AND date_string = ${today}
      LIMIT 1
    `;
    alreadyDone = logs.length > 0;
  }

  if (alreadyDone) {
    return NextResponse.json({ skipped: 'already completed', date: today });
  }

  const { subject, html } = herinneringEmail(appUrl, isWeekend);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mijn Ondernemers OS <onboarding@resend.dev>',
      to: notificationEmail,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ sent: true, id: data?.id });
  } catch (err) {
    console.error('Email send error:', err);
    return NextResponse.json({ error: 'Send failed' }, { status: 500 });
  }
}
