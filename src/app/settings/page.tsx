'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Clock, Download, Check } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import {
  getPreferences,
  savePreferences,
  requestPermission,
  getPermissionStatus,
  isNotificationSupported,
  scheduleAllNotifications,
  cancelAllNotifications,
  type NotificationPreferences,
} from '@/lib/notifications.service';
import { getStreakData } from '@/lib/streak.service';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    morningTime: '06:30',
    eveningTime: '21:30',
    weeklyStartEnabled: true,
    createBeforeConsumeTime: '06:30',
    createBeforeConsumeEnabled: true,
  });
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalDaysCompleted: 0 });
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.getUser();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }
        setUser(currentUser);
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    setNotifSupported(isNotificationSupported());
    setNotifPermission(getPermissionStatus());
    setPreferences(getPreferences());
    setStreakData(getStreakData());

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [router]);

  const handleEnableNotifications = async () => {
    const permission = await requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      savePreferences({ enabled: true });
      setPreferences((prev) => ({ ...prev, enabled: true }));
      scheduleAllNotifications();
    }
  };

  const handleToggleNotifications = (enabled: boolean) => {
    savePreferences({ enabled });
    setPreferences((prev) => ({ ...prev, enabled }));
    if (enabled && notifPermission === 'granted') {
      scheduleAllNotifications();
    } else {
      cancelAllNotifications();
    }
  };

  const handleTimeChange = (key: 'morningTime' | 'eveningTime', value: string) => {
    savePreferences({ [key]: value });
    setPreferences((prev) => ({ ...prev, [key]: value }));
    if (preferences.enabled && notifPermission === 'granted') {
      scheduleAllNotifications();
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsPWAInstalled(true);
    setDeferredPrompt(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-900 dark:border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-semibold text-slate-900 dark:text-white">Instellingen</h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Notifications */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Notificaties
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
            {!notifSupported ? (
              <div className="p-4 text-sm text-slate-500">Browser ondersteunt geen notificaties</div>
            ) : notifPermission === 'denied' ? (
              <div className="p-4 text-sm text-red-500">Notificaties geblokkeerd in browser</div>
            ) : notifPermission === 'default' ? (
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">Notificaties inschakelen</span>
                <button
                  onClick={handleEnableNotifications}
                  className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-lg"
                >
                  Inschakelen
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-300">Reminders actief</span>
                  <button
                    onClick={() => handleToggleNotifications(!preferences.enabled)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      preferences.enabled ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white dark:bg-slate-900 rounded-full transition-transform ${
                      preferences.enabled ? 'translate-x-4' : ''
                    }`} />
                  </button>
                </div>
                {preferences.enabled && (
                  <>
                    <div className="p-4 flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">Ochtend</span>
                      <input
                        type="time"
                        value={preferences.morningTime}
                        onChange={(e) => handleTimeChange('morningTime', e.target.value)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm text-slate-900 dark:text-white border-none"
                      />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">Avond</span>
                      <input
                        type="time"
                        value={preferences.eveningTime}
                        onChange={(e) => handleTimeChange('eveningTime', e.target.value)}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm text-slate-900 dark:text-white border-none"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {/* Install */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Installeren
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            {isPWAInstalled ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <Check size={16} />
                App geinstalleerd
              </div>
            ) : deferredPrompt ? (
              <button
                onClick={handleInstallPWA}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium rounded-lg"
              >
                <Download size={16} />
                Installeer als app
              </button>
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
                <p>Voeg toe aan startscherm:</p>
                <ul className="text-xs space-y-1">
                  <li>Chrome/Edge: installeer-icoon in adresbalk</li>
                  <li>Safari: Delen - Zet op beginscherm</li>
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Statistieken
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{streakData.currentStreak}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">streak</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{streakData.longestStreak}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">record</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{streakData.totalDaysCompleted}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">dagen</p>
            </div>
          </div>
        </section>

        {/* Account */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Account
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
            <div className="p-4">
              <p className="text-sm text-slate-900 dark:text-white">{user?.email}</p>
            </div>
            <div className="p-4">
              <button
                onClick={() => {
                  AuthService.logout();
                  router.push('/auth/login');
                }}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
