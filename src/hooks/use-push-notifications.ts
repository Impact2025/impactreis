'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  pushNotifications,
  NotificationPreferences,
} from '@/lib/push-notifications';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  isLoading: boolean;
  preferences: NotificationPreferences;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  showTestNotification: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    pushNotifications.getPreferences()
  );

  // Initialize state
  useEffect(() => {
    const init = async () => {
      const supported = pushNotifications.isSupported();
      setIsSupported(supported);

      if (supported) {
        setPermission(pushNotifications.getPermissionStatus());
        const subscribed = await pushNotifications.isSubscribed();
        setIsSubscribed(subscribed);
        setPreferences(pushNotifications.getPreferences());
      }

      setIsLoading(false);
    };

    init();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const subscription = await pushNotifications.subscribe();
      if (subscription) {
        setIsSubscribed(true);
        setPermission('granted');
        return true;
      }
      setPermission(pushNotifications.getPermissionStatus());
      return false;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await pushNotifications.unsubscribe();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>): Promise<void> => {
      await pushNotifications.savePreferences(prefs);
      setPreferences(pushNotifications.getPreferences());
    },
    []
  );

  // Show a test notification
  const showTestNotification = useCallback(async (): Promise<void> => {
    await pushNotifications.showLocalNotification(
      'Test Notificatie',
      {
        body: 'Dit is een test notificatie van Mijn Ondernemers OS',
        tag: 'test',
      }
    );
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    showTestNotification,
  };
}
