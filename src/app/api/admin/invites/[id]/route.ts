import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const inviteId = Number(id);
  if (!Number.isInteger(inviteId)) {
    return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 });
  }

  await sql`DELETE FROM invited_emails WHERE id = ${inviteId}`;
  return NextResponse.json({ success: true });
}
