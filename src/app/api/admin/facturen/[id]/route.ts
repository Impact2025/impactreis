import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  await sql`
    UPDATE invoices SET
      number = ${body.number ?? ''}, client_name = ${body.clientName ?? ''}, company_id = ${body.companyId ?? null},
      amount = ${body.amount ?? 0}, status = ${body.status ?? 'open'}, issue_date = ${body.issueDate ?? null},
      due_date = ${body.dueDate ?? null}, notes = ${body.notes ?? null}, updated_at = NOW()
    WHERE id = ${id}
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
