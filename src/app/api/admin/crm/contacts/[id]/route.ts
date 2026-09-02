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
    UPDATE crm_contacts SET
      company_id = ${body.companyId ?? null}, name = ${body.name ?? ''}, email = ${body.email ?? null},
      phone = ${body.phone ?? null}, role = ${body.role ?? null}, notes = ${body.notes ?? null}, updated_at = NOW()
    WHERE id = ${id}
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await sql`DELETE FROM crm_contacts WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
