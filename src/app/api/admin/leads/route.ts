import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leads = await sql`
    SELECT id, email, name, level, score, profile_key, weekly_hours_lost, monthly_hours_lost,
           created_at, unsubscribed
    FROM reality_check_leads
    ORDER BY created_at DESC
  `;

  const [stats] = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS new_7d
    FROM reality_check_leads
  `;

  return NextResponse.json({ leads, stats });
}
