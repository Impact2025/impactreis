import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await sql`
    SELECT
      u.id,
      u.email,
      u.role,
      u.created_at,
      u.last_login_at,
      u.login_count,
      o.name AS organization_name,
      o.plan AS organization_plan
    FROM users u
    LEFT JOIN organizations o ON o.id = u.organization_id
    ORDER BY u.created_at DESC
  `;

  const [stats] = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '7 days')::int AS active_7d,
      COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '30 days')::int AS active_30d,
      COUNT(*) FILTER (WHERE last_login_at IS NULL)::int AS never_logged_in,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS new_7d
    FROM users
  `;

  return NextResponse.json({ users, stats });
}
