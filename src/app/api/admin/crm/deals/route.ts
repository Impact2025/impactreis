import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await sql`
    SELECT d.*, co.name AS company_name, c.name AS contact_name
    FROM crm_deals d
    LEFT JOIN crm_companies co ON co.id = d.company_id
    LEFT JOIN crm_contacts c ON c.id = d.contact_id
    ORDER BY d.updated_at DESC
  `;
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
    INSERT INTO crm_deals (company_id, contact_id, title, value, stage, notes)
    VALUES (${body.companyId ?? null}, ${body.contactId ?? null}, ${title}, ${body.value ?? 0}, ${body.stage ?? 'lead'}, ${body.notes ?? null})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
