/**
 * Notification Service
 *
 * Beheert browser notificaties voor ritueel reminders.
 * Ondersteunt:
 * - Browser Notification API
 * - Scheduled reminders
 * - Permission management
 */

export interface NotificationPreferences {
  enabled: boolean;
  morningTime: string; // "06:30"
  eveningTime: string; // "21:30"
  weeklyStartEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  morningTime: '06:30',
  eveningTime: '21:30',
  weeklyStartEnabled: true,
};

const STORAGE_KEY = 'notification_preferences';

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  // Already granted
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Get notification preferences from localStorage
 */
export function getPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_PREFERENCES;

  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save notification preferences to localStorage
 */
export function savePreferences(prefs: Partial<NotificationPreferences>): void {
  if (typeof window === 'undefined') return;

  const current = getPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Send an instant notification
 */
export function sendNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  const prefs = getPreferences();
  if (!prefs.enabled) return null;

  const notification = new Notification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    ...options,
  });

  // Auto-close after 10 seconds
  setTimeout(() => notification.close(), 10000);

  return notification;
}

/**
 * Parse time string to hours and minutes
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Get milliseconds until next occurrence of a time
 */
function getMsUntilTime(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr);
  const now = new Date();
  const target = new Date();

  target.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/**
 * Check if it's time for a specific notification
 */
export function isTimeFor(timeStr: string, toleranceMinutes: number = 5): boolean {
  const { hours, minutes } = parseTime(timeStr);
  const now = new Date();

  const targetMinutes = hours * 60 + minutes;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return Math.abs(targetMinutes - nowMinutes) <= toleranceMinutes;
}

// Store scheduled timeouts
const scheduledTimeouts: Map<string, NodeJS.Timeout> = new Map();

/**
 * Schedule a notification for a specific time
 */
export function scheduleNotification(
  id: string,
  timeStr: string,
  title: string,
  body: string
): void {
  // Clear existing schedule for this ID
  const existing = scheduledTimeouts.get(id);
  if (existing) {
    clearTimeout(existing);
  }

  const msUntil = getMsUntilTime(timeStr);

  // Don't schedule if more than 24 hours away
  if (msUntil > 24 * 60 * 60 * 1000) return;

  const timeout = setTimeout(() => {
    sendNotification(title, {
      body,
      tag: id,
      requireInteraction: true,
    });

    // Reschedule for tomorrow
    scheduleNotification(id, timeStr, title, body);
  }, msUntil);

  scheduledTimeouts.set(id, timeout);
}

/**
 * Cancel a scheduled notification
 */
export function cancelScheduledNotification(id: string): void {
  const timeout = scheduledTimeouts.get(id);
  if (timeout) {
    clearTimeout(timeout);
    scheduledTimeouts.delete(id);
  }
}

/**
 * Schedule all daily notifications based on preferences
 */
export function scheduleAllNotifications(): void {
  const prefs = getPreferences();

  if (!prefs.enabled || Notification.permission !== 'granted') {
    return;
  }

  // Morning ritual reminder
  scheduleNotification(
    'morning-ritual',
    prefs.morningTime,
    'Goedemorgen!',
    'Tijd voor je ochtend ritueel. Start je dag met intentie.'
  );

  // Evening ritual reminder
  scheduleNotification(
    'evening-ritual',
    prefs.eveningTime,
    'Goedeavond!',
    'Tijd om je dag af te sluiten met reflectie.'
  );

  // Weekly start reminder (only on Mondays)
  if (prefs.weeklyStartEnabled) {
    const today = new Date().getDay();
    if (today === 1) {
      // Monday
      scheduleNotification(
        'weekly-start',
        prefs.morningTime,
        'Nieuwe week!',
        'Start je week met focus. Plan je belangrijkste doelen.'
      );
    }
  }
}

/**
 * Cancel all scheduled notifications
 */
export function cancelAllNotifications(): void {
  scheduledTimeouts.forEach((_, id) => cancelScheduledNotification(id));
}

/**
 * Initialize notification system
 * Call this on app mount
 */
export async function initializeNotifications(): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.log('Notifications not supported');
    return false;
  }

  const prefs = getPreferences();
  if (!prefs.enabled) {
    console.log('Notifications disabled by user');
    return false;
  }

  // Request permission if not yet granted
  if (Notification.permission === 'default') {
    const permission = await requestPermission();
    if (permission !== 'granted') {
      return false;
    }
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  // Schedule all notifications
  scheduleAllNotifications();

  return true;
}

/**
 * Show notification prompt for first-time users
 */
export function shouldShowNotificationPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isNotificationSupported()) return false;

  // Already decided
  if (Notification.permission !== 'default') return false;

  // Check if we've asked before
  const hasAsked = localStorage.getItem('notification_prompt_shown');
  return !hasAsked;
}

/**
 * Mark notification prompt as shown
 */
export function markNotificationPromptShown(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('notification_prompt_shown', 'true');
}

/**
 * Get notification status summary for UI
 */
export interface NotificationStatus {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  enabled: boolean;
  morningScheduled: boolean;
  eveningScheduled: boolean;
}

export function getNotificationStatus(): NotificationStatus {
  const prefs = getPreferences();
  const permission = getPermissionStatus();
  const enabled = prefs.enabled && permission === 'granted';

  return {
    supported: isNotificationSupported(),
    permission,
    enabled,
    morningScheduled: enabled && scheduledTimeouts.has('morning-ritual'),
    eveningScheduled: enabled && scheduledTimeouts.has('evening-ritual'),
  };
}
