import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { motivatieEmail } from '@/lib/email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

const DAY_NAMES = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

export async function GET(request: NextRequest) {
  // Vercel cron auth
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const to = process.env.NOTIFICATION_EMAIL!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mijn-ondernemers-os.vercel.app';

  const now = new Date();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  const dayName = DAY_NAMES[day];

  const { subject, html } = motivatieEmail(appUrl, isWeekend, dayName);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mijn Ondernemers OS <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err) {
    console.error('Email send error:', err);
    return NextResponse.json({ error: 'Send failed' }, { status: 500 });
  }
}
