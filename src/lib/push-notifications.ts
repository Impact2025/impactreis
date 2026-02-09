/**
 * Push Notification Service
 * Handles Web Push subscription and permission management
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// VAPID public key - this should match the server's public key
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreferences {
  morningRitual: boolean;
  eveningRitual: boolean;
  weeklyReview: boolean;
  streakReminders: boolean;
  morningTime: string; // HH:mm format
  eveningTime: string; // HH:mm format
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  morningRitual: true,
  eveningRitual: true,
  weeklyReview: true,
  streakReminders: true,
  morningTime: '07:00',
  eveningTime: '21:00',
};

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  // Check if push notifications are supported
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Get or create service worker registration
  private async getRegistration(): Promise<ServiceWorkerRegistration> {
    if (this.registration) return this.registration;

    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    this.registration = await navigator.serviceWorker.ready;
    return this.registration;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    const registration = await this.getRegistration();

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      if (!VAPID_PUBLIC_KEY) {
        console.warn('VAPID public key not configured');
        return null;
      }

      const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });
    }

    // Convert subscription to sendable format
    const subscriptionData = this.subscriptionToData(subscription);

    // Send to server
    await this.saveSubscription(subscriptionData);

    return subscriptionData;
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    const registration = await this.getRegistration();
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return true;

    // Unsubscribe locally
    const success = await subscription.unsubscribe();

    if (success) {
      // Remove from server
      await this.removeSubscription(subscription.endpoint);
    }

    return success;
  }

  // Get current subscription
  async getSubscription(): Promise<PushSubscription | null> {
    const registration = await this.getRegistration();
    return registration.pushManager.getSubscription();
  }

  // Check if currently subscribed
  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  // Save subscription to server
  private async saveSubscription(subscription: PushSubscriptionData): Promise<void> {
    const token = localStorage.getItem('token');

    await fetch(`${API_BASE}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ subscription }),
    });
  }

  // Remove subscription from server
  private async removeSubscription(endpoint: string): Promise<void> {
    const token = localStorage.getItem('token');

    await fetch(`${API_BASE}/notifications/unsubscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ endpoint }),
    });
  }

  // Convert subscription to data format
  private subscriptionToData(subscription: PushSubscription): PushSubscriptionData {
    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: key ? this.arrayBufferToBase64(key) : '',
        auth: auth ? this.arrayBufferToBase64(auth) : '',
      },
    };
  }

  // Convert URL-safe base64 to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // Convert ArrayBuffer to base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Get notification preferences
  getPreferences(): NotificationPreferences {
    try {
      const saved = localStorage.getItem('notification_preferences');
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore errors
    }
    return DEFAULT_PREFERENCES;
  }

  // Save notification preferences
  async savePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    const current = this.getPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem('notification_preferences', JSON.stringify(updated));

    // Sync to server
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE}/notifications/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(updated),
      });
    } catch {
      // Preferences are saved locally, server sync can fail
    }
  }

  // Show a local notification (for testing)
  async showLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.isSupported()) return;

    const permission = this.getPermissionStatus();
    if (permission !== 'granted') return;

    const registration = await this.getRegistration();
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    });
  }

  // Schedule a notification (using service worker)
  async scheduleNotification(
    title: string,
    options: NotificationOptions,
    delayMs: number
  ): Promise<void> {
    const registration = await this.getRegistration();

    if (registration.active) {
      registration.active.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        delay: delayMs,
        notification: { title, ...options },
      });
    }
  }
}

// Export singleton
export const pushNotifications = new PushNotificationService();

// React hook for push notifications
export function usePushNotifications() {
  return pushNotifications;
}
