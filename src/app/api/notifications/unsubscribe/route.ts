import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getAuthContext } from '@/lib/auth-context';

const sql = neon(process.env.DATABASE_URL!);

// Client (src/lib/push-notifications.ts, removeSubscription()) posts here on unsubscribe.
// This route didn't exist at all — every unsubscribe call 404'd silently (fetch response
// was never checked), so push_subscriptions rows were never actually cleaned up.
//
// Had geen enkele auth-check (iedereen kon elk endpoint verwijderen door de endpoint-string te
// raden/kennen) — nu vereist, en de delete is geschoold tot rijen van de aanroeper zelf.
export async function POST(request: NextRequest) {
  try {
    const authCtx = await getAuthContext(request);
    const userId = authCtx?.userId ?? null;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await request.json() as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    await sql`
      DELETE FROM push_subscriptions
      WHERE endpoint = ${endpoint} AND user_id = ${userId}
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
