import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await sql`SELECT * FROM invoices ORDER BY issue_date DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const number = String(body.number ?? '').trim();
  const clientName = String(body.clientName ?? '').trim();
  if (!number || !clientName) {
    return NextResponse.json({ error: 'Factuurnummer en klantnaam zijn verplicht' }, { status: 400 });
  }

  try {
    const rows = await sql`
      INSERT INTO invoices (number, client_name, company_id, amount, status, issue_date, due_date, notes)
      VALUES (${number}, ${clientName}, ${body.companyId ?? null}, ${body.amount ?? 0}, ${body.status ?? 'open'},
              ${body.issueDate ?? new Date().toISOString().slice(0, 10)}, ${body.dueDate ?? null}, ${body.notes ?? null})
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    if (error?.message?.includes('duplicate') || error?.message?.includes('unique')) {
      return NextResponse.json({ error: 'Factuurnummer bestaat al' }, { status: 409 });
    }
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: 'Kon factuur niet aanmaken' }, { status: 500 });
  }
}
