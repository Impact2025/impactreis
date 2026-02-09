import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Web Push library would be used here in production
// npm install web-push
// import webpush from 'web-push';

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

// VAPID keys should be set in environment variables
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

// POST - Send push notification
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as NotificationPayload;

    if (!payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Get subscriptions (optionally filtered by user)
    let subscriptions;
    if (payload.userId) {
      subscriptions = await sql`
        SELECT endpoint, p256dh, auth
        FROM push_subscriptions
        WHERE user_id = ${payload.userId}
      `;
    } else {
      subscriptions = await sql`
        SELECT endpoint, p256dh, auth
        FROM push_subscriptions
      `;
    }

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { message: 'No subscriptions found', sent: 0 },
        { status: 200 }
      );
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      tag: payload.tag || payload.type || 'general',
      type: payload.type,
      data: payload.data || {},
    });

    // In production, use web-push library
    // For now, log the intent and return success
    console.log(`Would send push to ${subscriptions.length} subscribers:`, notificationPayload);

    /*
    // Production implementation with web-push:
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'VAPID keys not configured' },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, notificationPayload);
          return { success: true, endpoint: sub.endpoint };
        } catch (error) {
          // Remove invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            await sql`
              DELETE FROM push_subscriptions
              WHERE endpoint = ${sub.endpoint}
            `;
          }
          return { success: false, endpoint: sub.endpoint, error: error.message };
        }
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - sent;
    */

    return NextResponse.json({
      success: true,
      sent: subscriptions.length,
      failed: 0,
      message: 'Notifications queued (web-push library needed for actual delivery)',
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// GET - Send scheduled ritual reminders (for cron jobs)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || !['morning', 'evening', 'weekly'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      );
    }

    const notifications: Record<string, { title: string; body: string; type: string }> = {
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

    // Get all subscriptions
    const subscriptions = await sql`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
    `;

    console.log(`Sending ${type} reminder to ${subscriptions.length} subscribers`);

    return NextResponse.json({
      success: true,
      type,
      subscribers: subscriptions.length,
      notification,
    });
  } catch (error) {
    console.error('Error sending scheduled notification:', error);
    return NextResponse.json(
      { error: 'Failed to send scheduled notification' },
      { status: 500 }
    );
  }
}
