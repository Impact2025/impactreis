import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getAuthContext } from '@/lib/auth-context';

const sql = neon(process.env.DATABASE_URL!);

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json() as { subscription: PushSubscription };

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Client (src/lib/push-notifications.ts) always sends the JWT bearer token, but this
    // route never decoded it — every subscription was stored with user_id = NULL, so
    // per-user push targeting (notifications/send's payload.userId filter) could never work.
    const authCtx = await getAuthContext(request);
    const userId = authCtx?.userId ?? null;

    // Check if subscription already exists
    const existing = await sql`
      SELECT id FROM push_subscriptions
      WHERE endpoint = ${subscription.endpoint}
    `;

    if (existing.length > 0) {
      // Update existing subscription
      await sql`
        UPDATE push_subscriptions
        SET
          p256dh = ${subscription.keys.p256dh},
          auth = ${subscription.keys.auth},
          user_id = ${userId},
          updated_at = NOW()
        WHERE endpoint = ${subscription.endpoint}
      `;
    } else {
      // Create new subscription
      await sql`
        INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_id)
        VALUES (
          ${subscription.endpoint},
          ${subscription.keys.p256dh},
          ${subscription.keys.auth},
          ${userId}
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json() as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint required' },
        { status: 400 }
      );
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
