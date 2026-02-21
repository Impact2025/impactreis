import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { authenticateToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Fetch existing data
    const existing = await sql`
      SELECT data FROM daily_logs
      WHERE id = ${id}
        AND user_id = ${userId}
        AND type = 'controle_cirkel'
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const currentData = typeof existing[0].data === 'string'
      ? JSON.parse(existing[0].data)
      : existing[0].data;

    const updatedData = { ...currentData, ...body };

    const result = await sql`
      UPDATE daily_logs
      SET data = ${JSON.stringify(updatedData)}, timestamp = NOW()
      WHERE id = ${id}
        AND user_id = ${userId}
        AND type = 'controle_cirkel'
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Update controle-cirkel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
