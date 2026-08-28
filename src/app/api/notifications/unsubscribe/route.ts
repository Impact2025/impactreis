import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Client (src/lib/push-notifications.ts, removeSubscription()) posts here on unsubscribe.
// This route didn't exist at all — every unsubscribe call 404'd silently (fetch response
// was never checked), so push_subscriptions rows were never actually cleaned up.
export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json() as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    await sql`
      DELETE FROM push_subscriptions
      WHERE endpoint = ${endpoint}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
