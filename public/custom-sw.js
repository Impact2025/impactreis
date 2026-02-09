/**
 * Custom Service Worker for Push Notifications
 * Extends the default next-pwa service worker with push notification handling
 */

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'Mijn Ondernemers OS',
    body: 'Je hebt een nieuwe notificatie',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'default',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {},
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };

  // Add ritual-specific actions
  if (data.type === 'morning-ritual') {
    options.actions = [
      { action: 'start', title: 'Start Ritueel' },
      { action: 'snooze', title: 'Later' },
    ];
    options.tag = 'morning-ritual';
  } else if (data.type === 'evening-ritual') {
    options.actions = [
      { action: 'start', title: 'Start Ritueel' },
      { action: 'snooze', title: 'Later' },
    ];
    options.tag = 'evening-ritual';
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  let url = '/dashboard';

  // Handle specific actions
  if (action === 'start') {
    if (notification.tag === 'morning-ritual') {
      url = '/morning';
    } else if (notification.tag === 'evening-ritual') {
      url = '/evening';
    }
  } else if (action === 'snooze') {
    // Schedule a snooze notification (15 minutes)
    setTimeout(() => {
      self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        tag: notification.tag,
        data: notification.data,
        actions: notification.actions,
      });
    }, 15 * 60 * 1000);
    return;
  } else if (data.url) {
    url = data.url;
  }

  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  // Track notification dismissals if needed
});

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Sync data function
async function syncData() {
  try {
    // Trigger sync in the main app
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({ type: 'SYNC_DATA' });
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { delay, notification } = event.data;
    setTimeout(() => {
      self.registration.showNotification(notification.title, notification);
    }, delay);
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);

  if (event.tag === 'ritual-reminder') {
    event.waitUntil(checkRitualReminders());
  }
});

async function checkRitualReminders() {
  const now = new Date();
  const hour = now.getHours();

  // Morning reminder at 7:00
  if (hour === 7) {
    await self.registration.showNotification('Goedemorgen!', {
      body: 'Start je dag met je ochtend ritueel',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'morning-ritual',
      data: { url: '/morning', type: 'morning-ritual' },
      actions: [
        { action: 'start', title: 'Start Ritueel' },
        { action: 'snooze', title: 'Later' },
      ],
    });
  }

  // Evening reminder at 21:00
  if (hour === 21) {
    await self.registration.showNotification('Tijd om af te sluiten', {
      body: 'Rond je dag af met je avond ritueel',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'evening-ritual',
      data: { url: '/evening', type: 'evening-ritual' },
      actions: [
        { action: 'start', title: 'Start Ritueel' },
        { action: 'snooze', title: 'Later' },
      ],
    });
  }
}

console.log('[SW] Custom service worker loaded');
