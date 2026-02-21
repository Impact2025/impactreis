import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { authenticateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await sql`
      SELECT * FROM daily_logs
      WHERE user_id = ${userId}
        AND type = 'controle_cirkel'
      ORDER BY timestamp DESC
      LIMIT 20
    `;

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Get controle-cirkel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { probleem, mijn_kant, niet_mijn_kant, gekozen_actie, losgelaten } = body;

    if (!probleem) {
      return NextResponse.json({ error: 'probleem is verplicht' }, { status: 400 });
    }

    const data = {
      probleem,
      mijn_kant: mijn_kant ?? [],
      niet_mijn_kant: niet_mijn_kant ?? [],
      gekozen_actie: gekozen_actie ?? '',
      losgelaten: losgelaten ?? false,
    };

    const date = new Date().toISOString().split('T')[0];

    const result = await sql`
      INSERT INTO daily_logs (user_id, type, date_string, data, timestamp)
      VALUES (${userId}, 'controle_cirkel', ${date}, ${JSON.stringify(data)}, NOW())
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create controle-cirkel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
