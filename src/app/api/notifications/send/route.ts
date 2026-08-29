import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import webpush from 'web-push';

const sql = neon(process.env.DATABASE_URL!);

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  type?: 'morning-ritual' | 'evening-ritual' | 'weekly-review' | 'streak' | 'general';
  data?: Record<string, unknown>;
  userId?: number;
}

// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendToSubscriptions(subscriptions: SubscriptionRow[], notificationPayload: string) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID keys not configured');
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
        return { success: true, endpoint: sub.endpoint };
      } catch (error: any) {
        // Expired/invalid subscriptions are reported by the push service as 404/410 —
        // clean those up so we stop wasting sends on dead endpoints.
        if (error.statusCode === 410 || error.statusCode === 404) {
          await sql`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`;
        }
        return { success: false, endpoint: sub.endpoint, error: error.message };
      }
    })
  );

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
  return { sent, failed: results.length - sent };
}

// POST - Send push notification
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json() as NotificationPayload;

    if (!payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    const subscriptions = payload.userId
      ? await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${payload.userId}`
      : await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions`;

    if (subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found', sent: 0 }, { status: 200 });
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      tag: payload.tag || payload.type || 'general',
      type: payload.type,
      data: payload.data || {},
    });

    const { sent, failed } = await sendToSubscriptions(subscriptions as SubscriptionRow[], notificationPayload);

    return NextResponse.json({ success: true, sent, failed });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// GET - Send scheduled ritual reminders (for cron jobs)
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || !['morning', 'evening', 'weekly'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      );
    }

    const notifications: Record<string, { title: string; body: string; type: NotificationPayload['type'] }> = {
      morning: {
        title: 'Goedemorgen!',
        body: 'Start je dag met je ochtend ritueel',
        type: 'morning-ritual',
      },
      evening: {
        title: 'Tijd om af te sluiten',
        body: 'Rond je dag af met je avond ritueel',
        type: 'evening-ritual',
      },
      weekly: {
        title: 'Wekelijkse Review',
        body: 'Tijd voor je wekelijkse reflectie',
        type: 'weekly-review',
      },
    };

    const notification = notifications[type];
    const subscriptions = await sql`SELECT endpoint, p256dh, auth FROM push_subscriptions`;

    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, type, subscribers: 0, sent: 0, failed: 0 });
    }

    const notificationPayload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: notification.type,
      type: notification.type,
      data: {},
    });

    const { sent, failed } = await sendToSubscriptions(subscriptions as SubscriptionRow[], notificationPayload);

    return NextResponse.json({ success: true, type, subscribers: subscriptions.length, sent, failed });
  } catch (error: any) {
    console.error('Error sending scheduled notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send scheduled notification' },
      { status: 500 }
    );
  }
}
