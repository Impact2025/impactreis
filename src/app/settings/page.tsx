'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Check, Mail, Loader2, Dna } from 'lucide-react';
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
import { useRitualStatus } from '@/hooks/useRitualStatus';
import { DEFAULT_RITUAL_SETTINGS, formatHour, type RitualSettings } from '@/lib/weekflow.service';
import { BottomNav } from '@/components/ui/bottom-nav';
import { ChipButton, CardOption, CheckRow, WeekdayPicker, ISO_WEEKDAY_LABELS } from '@/components/ui/dna-controls';
import {
  INDUSTRY_OPTIONS,
  TEAM_SIZE_OPTIONS,
  BUSINESS_MODEL_OPTIONS,
  TIME_WASTER_OPTIONS,
  AVOIDANCE_BEHAVIOR_OPTIONS,
  LEVERAGE_GOAL_OPTIONS,
  type BusinessDna,
} from '@/lib/onboarding';

const COMMON_TIMEZONES = [
  'Europe/Amsterdam',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Madrid',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'UTC',
];

interface EmailPreferences {
  morningMotivation: boolean;
  morningReminder: boolean;
  weeklyReport: boolean;
  streakCelebration: boolean;
  onboardingNudge: boolean;
  winback: boolean;
}

const EMAIL_PREF_LABELS: { key: keyof EmailPreferences; title: string; desc: string }[] = [
  { key: 'morningMotivation', title: 'Ochtend-motivatie', desc: 'Dagelijkse priming-mail in de vroege ochtend' },
  { key: 'morningReminder', title: 'Ochtend-herinnering', desc: 'Nudge als je ritueel later op de dag nog niet gedaan is' },
  { key: 'weeklyReport', title: 'Weekrapport', desc: 'Wekelijkse samenvatting van rituelen, energie en wins' },
  { key: 'streakCelebration', title: 'Streak-vieringen', desc: 'Mail bij elke streak-mijlpaal (7, 14, 30 dagen, ...)' },
  { key: 'onboardingNudge', title: 'Onboarding-herinnering', desc: 'Eenmalige herinnering als je intake nog niet af is' },
  { key: 'winback', title: 'Terugkom-mails', desc: 'Als je een tijdje inactief bent geweest' },
];

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
  const { streak: streakData } = useRitualStatus();
  const [emailSending, setEmailSending] = useState<'weekrapport' | null>(null);
  const [emailResult, setEmailResult] = useState<{ type: string; ok: boolean } | null>(null);
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences | null>(null);
  const [emailPrefsSaving, setEmailPrefsSaving] = useState<keyof EmailPreferences | null>(null);
  const [ritualSettings, setRitualSettings] = useState<RitualSettings>(DEFAULT_RITUAL_SETTINGS);
  const [ritualSettingsSaving, setRitualSettingsSaving] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dna, setDna] = useState<BusinessDna | null>(null);
  const [dnaOnboardingDone, setDnaOnboardingDone] = useState(true);
  const [dnaLoading, setDnaLoading] = useState(true);
  const [dnaSaving, setDnaSaving] = useState(false);
  const [dnaError, setDnaError] = useState<string | null>(null);

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

    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/settings/email-preferences', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setEmailPrefs(data); })
        .catch(() => {});

      fetch('/api/ritual-settings', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setRitualSettings(data); })
        .catch(() => {});

      fetch('/api/onboarding/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setDnaOnboardingDone(!!data?.completed);
          if (data?.profile?.businessDna) setDna(data.profile.businessDna);
        })
        .catch(() => {})
        .finally(() => setDnaLoading(false));
    }

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

  const handleSendEmail = async (type: 'weekrapport') => {
    setEmailSending(type);
    setEmailResult(null);
    try {
      const token = localStorage.getItem('token');
      const url = '/api/email/weekrapport';
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

  const handleToggleEmailPref = async (key: keyof EmailPreferences) => {
    if (!emailPrefs) return;
    const nextValue = !emailPrefs[key];
    setEmailPrefs({ ...emailPrefs, [key]: nextValue });
    setEmailPrefsSaving(key);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/settings/email-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: nextValue }),
      });
    } catch {
      setEmailPrefs(prev => prev ? { ...prev, [key]: !nextValue } : prev);
    } finally {
      setEmailPrefsSaving(null);
    }
  };

  const handleSaveRitualSettings = async (next: RitualSettings) => {
    const previous = ritualSettings;
    setRitualSettings(next);
    setRitualSettingsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ritual-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(next),
      });
      if (!res.ok) setRitualSettings(previous);
    } catch {
      setRitualSettings(previous);
    } finally {
      setRitualSettingsSaving(false);
    }
  };

  const handleToggleWorkDay = (day: number) => {
    const workDays = ritualSettings.workDays.includes(day)
      ? ritualSettings.workDays.filter((d) => d !== day)
      : [...ritualSettings.workDays, day];
    if (workDays.length === 0) return; // minstens één werkdag
    handleSaveRitualSettings({ ...ritualSettings, workDays: workDays.sort((a, b) => a - b) });
  };

  const handleSaveDna = async (next: BusinessDna) => {
    const previous = dna;
    setDna(next);
    setDnaSaving(true);
    setDnaError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/onboarding/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        setDna(previous);
        setDnaError('Opslaan mislukt. Probeer het opnieuw.');
      }
    } catch {
      setDna(previous);
      setDnaError('Opslaan mislukt. Probeer het opnieuw.');
    } finally {
      setDnaSaving(false);
    }
  };

  const handleToggleDnaTimeWaster = (value: string) => {
    if (!dna) return;
    const has = dna.topTimeWasters.includes(value as BusinessDna['topTimeWasters'][number]);
    let topTimeWasters: BusinessDna['topTimeWasters'];
    if (has) {
      if (dna.topTimeWasters.length <= 1) return; // schema vereist minstens 1
      topTimeWasters = dna.topTimeWasters.filter((v) => v !== value) as BusinessDna['topTimeWasters'];
    } else {
      if (dna.topTimeWasters.length >= 3) return;
      topTimeWasters = [...dna.topTimeWasters, value] as BusinessDna['topTimeWasters'];
    }
    handleSaveDna({ ...dna, topTimeWasters });
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
      <div className="min-h-screen bg-surface-card flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-card pb-28">
      {/* Header */}
      <header className="bg-surface-card border-b border-line px-5 py-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-surface-sunken text-ink active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <h1 className="text-[18px] font-bold text-ink tracking-tight">Instellingen</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-7">
        {/* Bedrijfs-DNA */}
        <section>
          <h2 className="text-[11px] font-bold text-ink-soft uppercase tracking-[0.18em] mb-3 flex items-center gap-2">
            <Dna size={12} />
            Bedrijfs-DNA
            {dnaSaving && <Loader2 size={11} className="animate-spin text-ink-soft" />}
          </h2>
          {dnaLoading ? (
            <div className="rounded-[16px] border border-line bg-white px-5 py-4 text-[13px] text-ink-soft">
              Laden...
            </div>
          ) : !dnaOnboardingDone || !dna ? (
            <div className="rounded-[16px] border border-line bg-white px-5 py-4 space-y-2">
              <p className="text-[13px] text-ink-soft">Je hebt de intake nog niet afgerond — je coach kent je bedrijf nog niet.</p>
              <Link href="/onboarding" className="inline-block text-[13px] font-semibold text-primary">
                Start de intake →
              </Link>
            </div>
          ) : (
            <div className="rounded-[16px] border border-line bg-white divide-y divide-line overflow-hidden">
              <div className="px-5 py-4 space-y-4">
                <p className="text-[12px] text-ink-soft">
                  Dit bepaalt hoe je coach je aanspreekt en waar het ochtendritueel op focust. Wijzigingen worden direct opgeslagen.
                </p>
                <div>
                  <p className="text-[12px] font-medium text-ink-soft uppercase tracking-wider mb-2">Sector</p>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRY_OPTIONS.map((o) => (
                      <ChipButton key={o.value} selected={dna.industry === o.value} onClick={() => handleSaveDna({ ...dna, industry: o.value })}>
                        {o.label}
                      </ChipButton>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-ink-soft uppercase tracking-wider mb-2">Teamgrootte</p>
                  <div className="flex flex-wrap gap-2">
                    {TEAM_SIZE_OPTIONS.map((o) => (
                      <ChipButton key={o.value} selected={dna.teamSize === o.value} onClick={() => handleSaveDna({ ...dna, teamSize: o.value })}>
                        {o.label}
                      </ChipButton>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-ink-soft uppercase tracking-wider mb-2">Verdienmodel</p>
                  <div className="flex flex-wrap gap-2">
                    {BUSINESS_MODEL_OPTIONS.map((o) => (
                      <ChipButton key={o.value} selected={dna.businessModel === o.value} onClick={() => handleSaveDna({ ...dna, businessModel: o.value })}>
                        {o.label}
                      </ChipButton>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-[12px] font-medium text-ink-soft uppercase tracking-wider mb-2">Top-3 tijdvreters</p>
                <div className="space-y-2">
                  {TIME_WASTER_OPTIONS.map((o) => {
                    const selected = dna.topTimeWasters.includes(o.value);
                    return (
                      <CheckRow key={o.value} selected={selected} onClick={() => handleToggleDnaTimeWaster(o.value)} disabled={!selected && dna.topTimeWasters.length >= 3}>
                        {o.label}
                      </CheckRow>
                    );
                  })}
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-[12px] font-medium text-ink-soft uppercase tracking-wider mb-2">Persoonlijk vluchtgedrag</p>
                <div className="space-y-2">
                  {AVOIDANCE_BEHAVIOR_OPTIONS.map((o) => (
                    <CardOption key={o.value} selected={dna.avoidanceBehavior === o.value} onClick={() => handleSaveDna({ ...dna, avoidanceBehavior: o.value })} title={o.label} />
                  ))}
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-[12px] font-medium text-ink-soft uppercase tracking-wider mb-2">Kwartaalhefboom</p>
                <div className="space-y-2">
                  {LEVERAGE_GOAL_OPTIONS.map((o) => (
                    <CardOption key={o.value} selected={dna.quarterlyLeverageGoal === o.value} onClick={() => handleSaveDna({ ...dna, quarterlyLeverageGoal: o.value })} title={o.label} description={o.description} />
                  ))}
                </div>
              </div>
              {dnaError && (
                <div className="px-5 py-3 text-[13px] font-medium text-red-500">{dnaError}</div>
              )}
            </div>
          )}
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-[11px] font-bold text-ink-soft uppercase tracking-[0.18em] mb-3">
            Notificaties
          </h2>
          <div className="rounded-[16px] border border-line bg-white divide-y divide-line overflow-hidden">
            {!notifSupported ? (
              <div className="px-5 py-4 text-[13px] text-ink-soft">
                Browser ondersteunt geen notificaties
              </div>
            ) : notifPermission === 'denied' ? (
              <div className="px-5 py-4 text-[13px] text-red-500">
                Notificaties geblokkeerd in browser
              </div>
            ) : notifPermission === 'default' ? (
              <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-[14px] text-ink">Notificaties inschakelen</span>
                <button
                  onClick={handleEnableNotifications}
                  className="px-4 py-2 bg-surface-inverse text-white text-[13px] font-semibold rounded-[10px] active:scale-95 transition-transform"
                >
                  Inschakelen
                </button>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 flex items-center justify-between">
                  <span className="text-[14px] text-ink">Reminders actief</span>
                  <button
                    onClick={() => handleToggleNotifications(!preferences.enabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      preferences.enabled ? 'bg-primary' : 'bg-line'
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
                      <span className="text-[14px] text-ink">Ochtend reminder</span>
                      <input
                        type="time"
                        value={preferences.morningTime}
                        onChange={(e) => handleTimeChange('morningTime', e.target.value)}
                        className="bg-surface-sunken rounded-[10px] px-3 py-1.5 text-[13px] text-ink border-none outline-none"
                      />
                    </div>
                    <div className="px-5 py-4 flex items-center justify-between">
                      <span className="text-[14px] text-ink">Avond reminder</span>
                      <input
                        type="time"
                        value={preferences.eveningTime}
                        onChange={(e) => handleTimeChange('eveningTime', e.target.value)}
                        className="bg-surface-sunken rounded-[10px] px-3 py-1.5 text-[13px] text-ink border-none outline-none"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {/* Ritueel-instellingen */}
        <section>
          <h2 className="text-[11px] font-bold text-ink-soft uppercase tracking-[0.18em] mb-3 flex items-center gap-2">
            Ritueel-instellingen
            {ritualSettingsSaving && <Loader2 size={11} className="animate-spin text-ink-soft" />}
          </h2>
          <div className="rounded-[16px] border border-line bg-white divide-y divide-line overflow-hidden">
            <div className="px-5 py-4">
              <p className="text-[14px] font-medium text-ink mb-2">Tijdzone</p>
              <select
                value={ritualSettings.timezone}
                onChange={(e) => handleSaveRitualSettings({ ...ritualSettings, timezone: e.target.value })}
                className="w-full bg-surface-sunken rounded-[10px] px-3 py-2 text-[13px] text-ink border-none outline-none"
              >
                {(COMMON_TIMEZONES.includes(ritualSettings.timezone) ? COMMON_TIMEZONES : [ritualSettings.timezone, ...COMMON_TIMEZONES]).map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              <p className="text-[12px] text-ink-soft mt-2">
                Bepaalt wanneer voor jou &quot;vandaag&quot; begint en wanneer het avondritueel opengaat.
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[14px] font-medium text-ink mb-2">Werkdagen</p>
              <WeekdayPicker selectedDays={ritualSettings.workDays} onToggle={handleToggleWorkDay} />
              <p className="text-[12px] text-ink-soft mt-2">
                Op niet-geselecteerde dagen worden ochtend/avond/weekstart niet als &quot;gemist&quot; geteld.
              </p>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-ink">Avondritueel opent om</p>
                <p className="text-[12px] text-ink-soft mt-0.5">Vóór dit uur toont de app een wachtscherm</p>
              </div>
              <select
                value={ritualSettings.eveningRitualOpensHour}
                onChange={(e) => handleSaveRitualSettings({ ...ritualSettings, eveningRitualOpensHour: Number(e.target.value) })}
                className="bg-surface-sunken rounded-[10px] px-3 py-1.5 text-[13px] text-ink border-none outline-none"
              >
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour} value={hour}>{formatHour(hour)}</option>
                ))}
              </select>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-ink">Laatste dag om week te starten</p>
                <p className="text-[12px] text-ink-soft mt-0.5">Daarna telt de weekstart als gemist</p>
              </div>
              <select
                value={ritualSettings.weekStartDeadlineWeekday}
                onChange={(e) => handleSaveRitualSettings({ ...ritualSettings, weekStartDeadlineWeekday: Number(e.target.value) })}
                className="bg-surface-sunken rounded-[10px] px-3 py-1.5 text-[13px] text-ink border-none outline-none"
              >
                {ISO_WEEKDAY_LABELS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-[14px] font-medium text-ink">Focusblokken</p>
              {([
                { key: 'focusBlock1Start' as const, durationKey: 'focusBlock1DurationMin' as const, label: 'Blok 1' },
                { key: 'focusBlock2Start' as const, durationKey: 'focusBlock2DurationMin' as const, label: 'Blok 2' },
              ]).map(({ key, durationKey, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-ink-soft">{label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={ritualSettings[key]}
                      onChange={(e) => handleSaveRitualSettings({ ...ritualSettings, [key]: e.target.value })}
                      className="bg-surface-sunken rounded-[10px] px-3 py-1.5 text-[13px] text-ink border-none outline-none"
                    />
                    <select
                      value={ritualSettings[durationKey]}
                      onChange={(e) => handleSaveRitualSettings({ ...ritualSettings, [durationKey]: Number(e.target.value) })}
                      className="bg-surface-sunken rounded-[10px] px-3 py-1.5 text-[13px] text-ink border-none outline-none"
                    >
                      {[15, 30, 45, 60, 90, 120].map((min) => (
                        <option key={min} value={min}>{min} min</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              <p className="text-[12px] text-ink-soft">
                Tijdvakken die in het Ochtend Ritueel worden aangeboden om te plannen.
              </p>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-medium text-ink">Meditaties</p>
                <p className="text-[12px] text-ink-soft mt-0.5">Ochtend-centering op het dashboard en in het ochtendritueel</p>
              </div>
              <button
                onClick={() => handleSaveRitualSettings({ ...ritualSettings, meditationsEnabled: !ritualSettings.meditationsEnabled })}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                  ritualSettings.meditationsEnabled ? 'bg-primary' : 'bg-line'
                }`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  ritualSettings.meditationsEnabled ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>
          </div>
        </section>

        {/* Install */}
        <section>
          <h2 className="text-[11px] font-bold text-ink-soft uppercase tracking-[0.18em] mb-3">
            Installeren
          </h2>
          <div className="rounded-[16px] border border-line bg-white overflow-hidden">
            {isPWAInstalled ? (
              <div className="px-5 py-4 flex items-center gap-2 text-[14px] text-primary font-medium">
                <Check size={16} />
                App geinstalleerd
              </div>
            ) : deferredPrompt ? (
              <div className="p-4">
                <button
                  onClick={handleInstallPWA}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-surface-inverse text-white text-[14px] font-semibold rounded-[14px] active:scale-95 transition-transform"
                >
                  <Download size={16} />
                  Installeer als app
                </button>
              </div>
            ) : (
              <div className="px-5 py-4 text-[13px] text-ink-soft space-y-2">
                <p className="text-ink font-medium">Voeg toe aan startscherm:</p>
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
          <h2 className="text-[11px] font-bold text-ink-soft uppercase tracking-[0.18em] mb-3">
            Statistieken
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[14px] bg-surface-sunken p-4 text-center">
              <p className="text-[22px] font-bold text-ink">{streakData.currentStreak}</p>
              <p className="text-[11px] text-ink-soft mt-0.5">streak</p>
            </div>
            <div className="rounded-[14px] bg-tertiary-soft border border-tertiary-soft p-4 text-center">
              <p className="text-[22px] font-bold text-tertiary">{streakData.longestStreak}</p>
              <p className="text-[11px] text-tertiary mt-0.5">record</p>
            </div>
            <div className="rounded-[14px] bg-surface-sunken p-4 text-center">
              <p className="text-[22px] font-bold text-ink">{streakData.totalDaysCompleted}</p>
              <p className="text-[11px] text-ink-soft mt-0.5">dagen</p>
            </div>
          </div>
        </section>

        {/* E-mail rapporten */}
        <section>
          <h2 className="text-[11px] font-bold text-ink-soft uppercase tracking-[0.18em] mb-3">
            E-mail Rapporten
          </h2>
          <div className="rounded-[16px] border border-line bg-white divide-y divide-line overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-ink">Weekrapport</p>
                <p className="text-[12px] text-ink-soft mt-0.5">Rituelen, energie, focusblokken, wins</p>
              </div>
              <button
                onClick={() => handleSendEmail('weekrapport')}
                disabled={emailSending !== null}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-inverse text-white text-[13px] font-semibold rounded-[10px] active:scale-95 transition-transform disabled:opacity-50"
              >
                {emailSending === 'weekrapport'
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Mail size={14} />}
                Stuur nu
              </button>
            </div>
            {emailResult && (
              <div className={`px-5 py-3 text-[13px] font-medium ${emailResult.ok ? 'text-primary' : 'text-red-500'}`}>
                {emailResult.ok
                  ? `✓ Weekrapport verstuurd naar je inbox`
                  : `✗ Versturen mislukt — check Vercel logs`}
              </div>
            )}
          </div>
        </section>

        {/* E-mailvoorkeuren */}
        <section>
          <h2 className="text-[11px] font-bold text-ink-soft uppercase tracking-[0.18em] mb-3">
            E-mailvoorkeuren
          </h2>
          <div className="rounded-[16px] border border-line bg-white divide-y divide-line overflow-hidden">
            {!emailPrefs ? (
              <div className="px-5 py-4 text-[13px] text-ink-soft">Voorkeuren laden...</div>
            ) : (
              EMAIL_PREF_LABELS.map(({ key, title, desc }) => (
                <div key={key} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[14px] text-ink">{title}</p>
                    <p className="text-[12px] text-ink-soft mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggleEmailPref(key)}
                    disabled={emailPrefsSaving === key}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60 ${
                      emailPrefs[key] ? 'bg-primary' : 'bg-line'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      emailPrefs[key] ? 'translate-x-5' : ''
                    }`} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Account */}
        <section>
          <h2 className="text-[11px] font-bold text-ink-soft uppercase tracking-[0.18em] mb-3">
            Account
          </h2>
          <div className="rounded-[16px] border border-line bg-white divide-y divide-line overflow-hidden">
            <div className="px-5 py-4">
              <p className="text-[14px] font-medium text-ink">{user?.email}</p>
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
