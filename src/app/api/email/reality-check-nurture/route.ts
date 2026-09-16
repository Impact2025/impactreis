import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { REALITY_CHECK_MAX_SCORE, getProfile } from '@/lib/reality-check';
import { getResend, FROM_EMAIL } from '@/lib/resend';
import {
  realityCheckEmail2,
  realityCheckEmail3,
  realityCheckEmail4,
  type RealityCheckLeadEmailData,
} from '@/lib/email-templates';

const sql = neon(process.env.DATABASE_URL!);

interface Lead {
  id: number;
  email: string;
  name: string | null;
  score: number;
  weekly_hours_lost: number;
  monthly_hours_lost: number;
  unsubscribe_token: string | null;
}

function buildData(lead: Lead, appUrl: string): RealityCheckLeadEmailData {
  return {
    name: lead.name,
    profileLabel: getProfile(lead.score).label,
    score: lead.score,
    maxScore: REALITY_CHECK_MAX_SCORE,
    weeklyHoursLost: lead.weekly_hours_lost,
    monthlyHoursLost: lead.monthly_hours_lost,
    resultUrl: `${appUrl}/reality-check/result?score=${lead.score}`,
    debriefUrl: `${appUrl}/auth/register`,
    unsubscribeUrl: lead.unsubscribe_token
      ? `${appUrl}/api/email/reality-check-unsubscribe?token=${lead.unsubscribe_token}`
      : undefined,
  };
}

async function runStage(
  leads: Lead[],
  appUrl: string,
  build: (data: RealityCheckLeadEmailData) => { subject: string; html: string },
  markSent: (id: number) => Promise<unknown>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (const lead of leads) {
    try {
      const { subject, html } = build(buildData(lead, appUrl));
      const { error } = await getResend().emails.send({ from: FROM_EMAIL, to: lead.email, subject, html });
      if (error) throw new Error(JSON.stringify(error));
      await markSent(lead.id);
      sent++;
    } catch (err) {
      console.error('reality-check-nurture send failed for lead', lead.id, err);
      failed++;
    }
  }
  return { sent, failed };
}

// Draait één keer per dag (zie vercel.json) — dagelijkse granulariteit is ruim genoeg voor een
// "+24u/+48u/+72u sinds afronding"-reeks van maar 3 stappen. Elke stage is idempotent: een lead
// komt pas in de query zodra de vorige stage al verstuurd is én de huidige nog niet, dus een
// dubbele cron-run in dezelfde dag verstuurt nooit twee keer dezelfde mail.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sparren.app';

  const stage2Leads = (await sql`
    SELECT id, email, name, score, weekly_hours_lost, monthly_hours_lost, unsubscribe_token
    FROM reality_check_leads
    WHERE unsubscribed = FALSE AND email1_sent_at IS NOT NULL AND email2_sent_at IS NULL
      AND created_at <= NOW() - INTERVAL '24 hours'
  `) as unknown as Lead[];
  const stage3Leads = (await sql`
    SELECT id, email, name, score, weekly_hours_lost, monthly_hours_lost, unsubscribe_token
    FROM reality_check_leads
    WHERE unsubscribed = FALSE AND email2_sent_at IS NOT NULL AND email3_sent_at IS NULL
      AND created_at <= NOW() - INTERVAL '48 hours'
  `) as unknown as Lead[];
  const stage4Leads = (await sql`
    SELECT id, email, name, score, weekly_hours_lost, monthly_hours_lost, unsubscribe_token
    FROM reality_check_leads
    WHERE unsubscribed = FALSE AND email3_sent_at IS NOT NULL AND email4_sent_at IS NULL
      AND created_at <= NOW() - INTERVAL '72 hours'
  `) as unknown as Lead[];

  const email2 = await runStage(stage2Leads, appUrl, realityCheckEmail2, (id) =>
    sql`UPDATE reality_check_leads SET email2_sent_at = NOW() WHERE id = ${id}`
  );
  const email3 = await runStage(stage3Leads, appUrl, realityCheckEmail3, (id) =>
    sql`UPDATE reality_check_leads SET email3_sent_at = NOW() WHERE id = ${id}`
  );
  const email4 = await runStage(stage4Leads, appUrl, realityCheckEmail4, (id) =>
    sql`UPDATE reality_check_leads SET email4_sent_at = NOW() WHERE id = ${id}`
  );

  return NextResponse.json({ ok: true, email2, email3, email4 });
}
