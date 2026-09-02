import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await sql`SELECT * FROM crm_companies ORDER BY name ASC`;
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const name = String(body.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 });

  const rows = await sql`
    INSERT INTO crm_companies (name, website, industry, notes)
    VALUES (${name}, ${body.website ?? null}, ${body.industry ?? null}, ${body.notes ?? null})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
