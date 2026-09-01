'use client';

import { Bell, BellOff, Sun, Moon, Calendar, Flame, Check } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    showTestNotification,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="p-4 bg-surface-inverse/50 border border-line/50 rounded-xl">
        <div className="flex items-center gap-3 text-ink-soft">
          <BellOff className="w-5 h-5" />
          <span>Push notificaties worden niet ondersteund in deze browser</span>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="p-4 bg-error/10 border border-error/20 rounded-xl">
        <div className="flex items-center gap-3 text-error">
          <BellOff className="w-5 h-5" />
          <div>
            <p className="font-medium">Notificaties geblokkeerd</p>
            <p className="text-sm text-error/80">
              Ga naar je browser instellingen om notificaties toe te staan
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Subscribe/Unsubscribe */}
      <div className="p-4 bg-surface-inverse/50 border border-line/50 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-inverse/50 flex items-center justify-center">
                <BellOff className="w-5 h-5 text-ink-soft" />
              </div>
            )}
            <div>
              <p className="font-medium text-white">Push Notificaties</p>
              <p className="text-sm text-ink-soft">
                {isSubscribed
                  ? 'Je ontvangt herinneringen'
                  : 'Ontvang herinneringen voor rituelen'}
              </p>
            </div>
          </div>
          <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSubscribed
                ? 'bg-surface-inverse hover:bg-surface-sunken-strong text-outline'
                : 'bg-accent hover:bg-accent text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading
              ? 'Laden...'
              : isSubscribed
              ? 'Uitschakelen'
              : 'Inschakelen'}
          </button>
        </div>
      </div>

      {isSubscribed && (
        <>
          {/* Notification types */}
          <div className="p-4 bg-surface-inverse/50 border border-line/50 rounded-xl space-y-4">
            <h3 className="font-medium text-white">Herinneringen</h3>

            {/* Morning ritual */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-tertiary" />
                <span className="text-outline">Ochtend ritueel</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.morningRitual}
                onChange={(e) =>
                  updatePreferences({ morningRitual: e.target.checked })
                }
                className="w-5 h-5 rounded bg-surface-inverse border-line text-accent focus:ring-accent"
              />
            </label>

            {/* Evening ritual */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-accent" />
                <span className="text-outline">Avond ritueel</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.eveningRitual}
                onChange={(e) =>
                  updatePreferences({ eveningRitual: e.target.checked })
                }
                className="w-5 h-5 rounded bg-surface-inverse border-line text-accent focus:ring-accent"
              />
            </label>

            {/* Weekly review */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-outline">Wekelijkse review</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.weeklyReview}
                onChange={(e) =>
                  updatePreferences({ weeklyReview: e.target.checked })
                }
                className="w-5 h-5 rounded bg-surface-inverse border-line text-accent focus:ring-accent"
              />
            </label>

            {/* Streak reminders */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-tertiary" />
                <span className="text-outline">Streak herinneringen</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.streakReminders}
                onChange={(e) =>
                  updatePreferences({ streakReminders: e.target.checked })
                }
                className="w-5 h-5 rounded bg-surface-inverse border-line text-accent focus:ring-accent"
              />
            </label>
          </div>

          {/* Timing */}
          <div className="p-4 bg-surface-inverse/50 border border-line/50 rounded-xl space-y-4">
            <h3 className="font-medium text-white">Tijden</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-ink-soft mb-1">
                  Ochtend
                </label>
                <input
                  type="time"
                  value={preferences.morningTime}
                  onChange={(e) =>
                    updatePreferences({ morningTime: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-surface-inverse/50 border border-line/50 rounded-lg text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm text-ink-soft mb-1">
                  Avond
                </label>
                <input
                  type="time"
                  value={preferences.eveningTime}
                  onChange={(e) =>
                    updatePreferences({ eveningTime: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-surface-inverse/50 border border-line/50 rounded-lg text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Test notification */}
          <button
            onClick={showTestNotification}
            className="w-full flex items-center justify-center gap-2 py-3 bg-surface-inverse/50 hover:bg-surface-inverse border border-line/50 rounded-xl text-outline transition-colors"
          >
            <Check className="w-5 h-5" />
            Test notificatie versturen
          </button>
        </>
      )}
    </div>
  );
}
