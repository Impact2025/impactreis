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
      <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="flex items-center gap-3 text-slate-400">
          <BellOff className="w-5 h-5" />
          <span>Push notificaties worden niet ondersteund in deze browser</span>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
        <div className="flex items-center gap-3 text-red-400">
          <BellOff className="w-5 h-5" />
          <div>
            <p className="font-medium">Notificaties geblokkeerd</p>
            <p className="text-sm text-red-400/80">
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
      <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-emerald-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center">
                <BellOff className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <div>
              <p className="font-medium text-white">Push Notificaties</p>
              <p className="text-sm text-slate-400">
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
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
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
          <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-4">
            <h3 className="font-medium text-white">Herinneringen</h3>

            {/* Morning ritual */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-400" />
                <span className="text-slate-300">Ochtend ritueel</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.morningRitual}
                onChange={(e) =>
                  updatePreferences({ morningRitual: e.target.checked })
                }
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            {/* Evening ritual */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-indigo-400" />
                <span className="text-slate-300">Avond ritueel</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.eveningRitual}
                onChange={(e) =>
                  updatePreferences({ eveningRitual: e.target.checked })
                }
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            {/* Weekly review */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-300">Wekelijkse review</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.weeklyReview}
                onChange={(e) =>
                  updatePreferences({ weeklyReview: e.target.checked })
                }
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            {/* Streak reminders */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-slate-300">Streak herinneringen</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.streakReminders}
                onChange={(e) =>
                  updatePreferences({ streakReminders: e.target.checked })
                }
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          {/* Timing */}
          <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-4">
            <h3 className="font-medium text-white">Tijden</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Ochtend
                </label>
                <input
                  type="time"
                  value={preferences.morningTime}
                  onChange={(e) =>
                    updatePreferences({ morningTime: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Avond
                </label>
                <input
                  type="time"
                  value={preferences.eveningTime}
                  onChange={(e) =>
                    updatePreferences({ eveningTime: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Test notification */}
          <button
            onClick={showTestNotification}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-slate-300 transition-colors"
          >
            <Check className="w-5 h-5" />
            Test notificatie versturen
          </button>
        </>
      )}
    </div>
  );
}
