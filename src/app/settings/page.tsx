'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Clock, Download, Check, Mail, Loader2 } from 'lucide-react';
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
import { BottomNav } from '@/components/ui/bottom-nav';

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
  const [emailSending, setEmailSending] = useState<'weekrapport' | 'adhd' | null>(null);
  const [emailResult, setEmailResult] = useState<{ type: string; ok: boolean } | null>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.getUser();
        if (!currentUser) { router.push('/auth/login'); return; }
        setUser(currentUser);
      } catch { router.push('/auth/login'); }
      finally { setLoading(false); }
    };

    checkAuth();
    setNotifSupported(isNotificationSupported());
    setNotifPermission(getPermissionStatus());
    setPreferences(getPreferences());
    setStreakData(getStreakData());

    if (window.matchMedia('(display-mode: standalone)').matches) setIsPWAInstalled(true);

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
      setPreferences(prev => ({ ...prev, enabled: true }));
      scheduleAllNotifications();
    }
  };

  const handleToggleNotifications = (enabled: boolean) => {
    savePreferences({ enabled });
    setPreferences(prev => ({ ...prev, enabled }));
    if (enabled && notifPermission === 'granted') scheduleAllNotifications();
    else cancelAllNotifications();
  };

  const handleTimeChange = (key: 'morningTime' | 'eveningTime', value: string) => {
    savePreferences({ [key]: value });
    setPreferences(prev => ({ ...prev, [key]: value }));
    if (preferences.enabled && notifPermission === 'granted') scheduleAllNotifications();
  };

  const handleSendEmail = async (type: 'weekrapport' | 'adhd') => {
    setEmailSending(type);
    setEmailResult(null);
    try {
      const token = localStorage.getItem('token');
      const url = type === 'weekrapport' ? '/api/email/weekrapport' : '/api/email/adhd-rapport';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      setEmailResult({ type, ok: res.ok });
    } catch {
      setEmailResult({ type, ok: false });
    } finally {
      setEmailSending(null);
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
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#00cc66] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] pb-28">
      {/* Header */}
      <header className="bg-[#ffffff] border-b border-[#e8e8ec] px-5 py-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[#f4f4f7] text-[#0a0a14] active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <h1 className="text-[18px] font-bold text-[#0a0a14] tracking-tight">Instellingen</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-7">
        {/* Notifications */}
        <section>
          <h2 className="text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.18em] mb-3">
            Notificaties
          </h2>
          <div className="rounded-[16px] border border-[#e8e8ec] bg-white divide-y divide-[#e8e8ec] overflow-hidden">
            {!notifSupported ? (
              <div className="px-5 py-4 text-[13px] text-[#8a8a9a]">
                Browser ondersteunt geen notificaties
              </div>
            ) : notifPermission === 'denied' ? (
              <div className="px-5 py-4 text-[13px] text-red-500">
                Notificaties geblokkeerd in browser
              </div>
            ) : notifPermission === 'default' ? (
              <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-[14px] text-[#0a0a14]">Notificaties inschakelen</span>
                <button
                  onClick={handleEnableNotifications}
                  className="px-4 py-2 bg-[#0a0a14] text-white text-[13px] font-semibold rounded-[10px] active:scale-95 transition-transform"
                >
                  Inschakelen
                </button>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 flex items-center justify-between">
                  <span className="text-[14px] text-[#0a0a14]">Reminders actief</span>
                  <button
                    onClick={() => handleToggleNotifications(!preferences.enabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      preferences.enabled ? 'bg-[#00cc66]' : 'bg-[#e8e8ec]'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      preferences.enabled ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>
                {preferences.enabled && (
                  <>
                    <div className="px-5 py-4 flex items-center justify-between">
                      <span className="text-[14px] text-[#0a0a14]">Ochtend reminder</span>
                      <input
                        type="time"
                        value={preferences.morningTime}
                        onChange={(e) => handleTimeChange('morningTime', e.target.value)}
                        className="bg-[#f4f4f7] rounded-[10px] px-3 py-1.5 text-[13px] text-[#0a0a14] border-none outline-none"
                      />
                    </div>
                    <div className="px-5 py-4 flex items-center justify-between">
                      <span className="text-[14px] text-[#0a0a14]">Avond reminder</span>
                      <input
                        type="time"
                        value={preferences.eveningTime}
                        onChange={(e) => handleTimeChange('eveningTime', e.target.value)}
                        className="bg-[#f4f4f7] rounded-[10px] px-3 py-1.5 text-[13px] text-[#0a0a14] border-none outline-none"
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
          <h2 className="text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.18em] mb-3">
            Installeren
          </h2>
          <div className="rounded-[16px] border border-[#e8e8ec] bg-white overflow-hidden">
            {isPWAInstalled ? (
              <div className="px-5 py-4 flex items-center gap-2 text-[14px] text-[#00cc66] font-medium">
                <Check size={16} />
                App geinstalleerd
              </div>
            ) : deferredPrompt ? (
              <div className="p-4">
                <button
                  onClick={handleInstallPWA}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0a0a14] text-white text-[14px] font-semibold rounded-[14px] active:scale-95 transition-transform"
                >
                  <Download size={16} />
                  Installeer als app
                </button>
              </div>
            ) : (
              <div className="px-5 py-4 text-[13px] text-[#8a8a9a] space-y-2">
                <p className="text-[#0a0a14] font-medium">Voeg toe aan startscherm:</p>
                <ul className="space-y-1 text-[12px]">
                  <li>Chrome/Edge: installeer-icoon in adresbalk</li>
                  <li>Safari: Delen - Zet op beginscherm</li>
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.18em] mb-3">
            Statistieken
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[14px] bg-[#f4f4f7] p-4 text-center">
              <p className="text-[22px] font-bold text-[#0a0a14]">{streakData.currentStreak}</p>
              <p className="text-[11px] text-[#8a8a9a] mt-0.5">streak</p>
            </div>
            <div className="rounded-[14px] bg-[#fef3c7] border border-[#fde68a] p-4 text-center">
              <p className="text-[22px] font-bold text-[#92400e]">{streakData.longestStreak}</p>
              <p className="text-[11px] text-[#b45309] mt-0.5">record</p>
            </div>
            <div className="rounded-[14px] bg-[#f4f4f7] p-4 text-center">
              <p className="text-[22px] font-bold text-[#0a0a14]">{streakData.totalDaysCompleted}</p>
              <p className="text-[11px] text-[#8a8a9a] mt-0.5">dagen</p>
            </div>
          </div>
        </section>

        {/* E-mail rapporten */}
        <section>
          <h2 className="text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.18em] mb-3">
            E-mail Rapporten
          </h2>
          <div className="rounded-[16px] border border-[#e8e8ec] bg-white divide-y divide-[#e8e8ec] overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-[#0a0a14]">Weekrapport</p>
                <p className="text-[12px] text-[#8a8a9a] mt-0.5">Rituelen, energie, focusblokken, wins</p>
              </div>
              <button
                onClick={() => handleSendEmail('weekrapport')}
                disabled={emailSending !== null}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0a0a14] text-white text-[13px] font-semibold rounded-[10px] active:scale-95 transition-transform disabled:opacity-50"
              >
                {emailSending === 'weekrapport'
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Mail size={14} />}
                Stuur nu
              </button>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-[#0a0a14]">ADHD Rapport</p>
                <p className="text-[12px] text-[#8a8a9a] mt-0.5">Klachtenmeting week 1 of 2</p>
              </div>
              <button
                onClick={() => handleSendEmail('adhd')}
                disabled={emailSending !== null}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#a78bfa] text-white text-[13px] font-semibold rounded-[10px] active:scale-95 transition-transform disabled:opacity-50"
              >
                {emailSending === 'adhd'
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Mail size={14} />}
                Stuur nu
              </button>
            </div>
            {emailResult && (
              <div className={`px-5 py-3 text-[13px] font-medium ${emailResult.ok ? 'text-[#00cc66]' : 'text-red-500'}`}>
                {emailResult.ok
                  ? `✓ ${emailResult.type === 'weekrapport' ? 'Weekrapport' : 'ADHD rapport'} verstuurd naar je inbox`
                  : `✗ Versturen mislukt — check Vercel logs`}
              </div>
            )}
          </div>
        </section>

        {/* Account */}
        <section>
          <h2 className="text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.18em] mb-3">
            Account
          </h2>
          <div className="rounded-[16px] border border-[#e8e8ec] bg-white divide-y divide-[#e8e8ec] overflow-hidden">
            <div className="px-5 py-4">
              <p className="text-[14px] font-medium text-[#0a0a14]">{user?.email}</p>
            </div>
            <div className="px-5 py-4">
              <button
                onClick={() => { AuthService.logout(); router.push('/auth/login'); }}
                className="text-[13px] text-red-500 font-medium active:scale-95 transition-transform"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
