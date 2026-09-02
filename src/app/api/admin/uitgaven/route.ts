import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await sql`SELECT * FROM expenses ORDER BY date DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const description = String(body.description ?? '').trim();
  if (!description) return NextResponse.json({ error: 'Omschrijving is verplicht' }, { status: 400 });

  const rows = await sql`
    INSERT INTO expenses (description, category, amount, date, notes)
    VALUES (${description}, ${body.category ?? null}, ${body.amount ?? 0}, ${body.date ?? new Date().toISOString().slice(0, 10)}, ${body.notes ?? null})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
