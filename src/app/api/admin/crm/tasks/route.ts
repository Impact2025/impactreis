import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await sql`SELECT * FROM crm_tasks ORDER BY done ASC, due_date ASC NULLS LAST, created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const title = String(body.title ?? '').trim();
  if (!title) return NextResponse.json({ error: 'Titel is verplicht' }, { status: 400 });

  const rows = await sql`
    INSERT INTO crm_tasks (title, description, due_date, related_type, related_id)
    VALUES (${title}, ${body.description ?? null}, ${body.dueDate ?? null}, ${body.relatedType ?? null}, ${body.relatedId ?? null})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
