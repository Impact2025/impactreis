import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const closedAt = ['gewonnen', 'verloren'].includes(body.stage) ? (body.closedAt ?? new Date().toISOString()) : null;

  await sql`
    UPDATE crm_deals SET
      company_id = ${body.companyId ?? null}, contact_id = ${body.contactId ?? null}, title = ${body.title ?? ''},
      value = ${body.value ?? 0}, stage = ${body.stage ?? 'lead'}, notes = ${body.notes ?? null},
      closed_at = ${closedAt}, updated_at = NOW()
    WHERE id = ${id}
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await sql`DELETE FROM crm_deals WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
