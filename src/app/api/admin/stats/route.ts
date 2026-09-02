import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [posts, deals, tasks, invoices] = await Promise.all([
    sql`SELECT status, COUNT(*)::int AS count FROM blog_posts GROUP BY status`,
    sql`SELECT stage, COUNT(*)::int AS count, COALESCE(SUM(value), 0)::float AS total FROM crm_deals WHERE stage NOT IN ('gewonnen', 'verloren') GROUP BY stage`,
    sql`SELECT COUNT(*)::int AS count FROM crm_tasks WHERE done = false`,
    sql`SELECT status, COUNT(*)::int AS count, COALESCE(SUM(amount), 0)::float AS total FROM invoices GROUP BY status`,
  ]);

  return NextResponse.json({
    posts,
    deals,
    openTasks: tasks[0]?.count ?? 0,
    invoices,
  });
}
