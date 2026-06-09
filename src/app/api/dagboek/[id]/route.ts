import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { authenticateToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await sql`
      DELETE FROM daily_logs
      WHERE id = ${id}
        AND user_id = ${userId}
        AND type IN ('dagboek_ochtend', 'dagboek_avond')
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete dagboek error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
