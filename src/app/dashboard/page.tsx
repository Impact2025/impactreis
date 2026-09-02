'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Bell, Sunrise, Moon, CalendarDays, TrendingUp,
  Play, ChevronRight, Zap, Fingerprint, Sparkles, BookHeart, AlertCircle, X, Mountain, Flame,
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { Win } from '@/types';
import { RitualGuard } from '@/components/weekflow/ritual-guard';
import { canAccessDemoFeatures } from '@/lib/demo-guard';
import { getDayType, getToday, getCurrentQuarter } from '@/lib/weekflow.service';
import { initializeNotifications } from '@/lib/notifications.service';
import { buildRecoveryProposalUrl } from '@/lib/calendar-proposal';
import { useRitualStatus } from '@/hooks/useRitualStatus';
import { BottomNav } from '@/components/ui/bottom-nav';
import type { GoalAction } from '@/lib/goal-actions';

interface Goal {
  id: string;
  title: string;
  category: string;
  progress: number;
  status: string;
  isRock?: boolean;
  quarter?: string | null;
  nextActions?: GoalAction[];
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: string | null;
  end: string | null;
  isAllDay: boolean;
}

export default function DashboardPage() {
  const [user, setUser]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [goals, setGoals]           = useState<Goal[]>([]);
  const [recentWins, setRecentWins] = useState<Win[]>([]);
  const [stats, setStats]           = useState({ activeGoals: 0, weeklyProgress: 0 });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarConfigured, setCalendarConfigured] = useState(false);
  const [leverageGoal, setLeverageGoal] = useState<string | null>(null);
  const [proactiveSignal, setProactiveSignal] = useState<{ signal: boolean; patternKey: string; message: string } | null>(null);
  const [signalDismissed, setSignalDismissed] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [resolvingProposalId, setResolvingProposalId] = useState<string | number | null>(null);
  const [canAccessDemo, setCanAccessDemo] = useState(false);
  const [todayDayType, setTodayDayType] = useState<'focus' | 'buffer' | 'free' | null>(null);
  const [leverageTasks, setLeverageTasks] = useState<{ goal: Goal; action: GoalAction }[]>([]);
  const [nsdrDismissed, setNsdrDismissed] = useState(false);
  const router                      = useRouter();

  const ritualStatuses = useRitualStatus();
  const dayType        = getDayType();
  const nextRitual      = ritualStatuses.nextRitual;

  const categoryLabel: Record<string, string> = {
    business:      'BUSINESS',
    health:        'GEZONDHEID',
    relationships: 'RELATIES',
    personal:      'PERSOONLIJK',
    marketing:     'MARKETING',
  };

  const fetchData = async (retry = 0) => {
    try {
      const [goalsRes, focusRes, winsRes, calendarRes, onboardingRes, signalRes, proposalsRes, morningLogRes] = await Promise.allSettled([
        api.goals.getAll(),
        api.focus.getAll(),
        api.wins.getAll(),
        api.calendar.today(),
        api.onboarding.profile(),
        api.coach.proactiveSignal(),
        api.calendar.proposals.list(),
        api.logs.getByTypeAndDate('morning', getToday()),
      ]);

      if (morningLogRes.status === 'fulfilled' && Array.isArray(morningLogRes.value) && morningLogRes.value[0]) {
        const raw = morningLogRes.value[0].data;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (['focus', 'buffer', 'free'].includes(parsed?.dayType)) setTodayDayType(parsed.dayType);
      }

      if (signalRes.status === 'fulfilled' && signalRes.value.signal) {
        setProactiveSignal(signalRes.value);
      }

      if (proposalsRes.status === 'fulfilled') {
        setProposals(proposalsRes.value.proposals ?? []);
      }

      if (calendarRes.status === 'fulfilled') {
        setCalendarConfigured(calendarRes.value.configured);
        setCalendarEvents(calendarRes.value.events ?? []);
      }

      if (onboardingRes.status === 'fulfilled' && onboardingRes.value.profile) {
        setLeverageGoal(onboardingRes.value.profile.impactProfile?.quarterlyLeverageGoal ?? null);
      }

      const allGoals    = goalsRes.status === 'fulfilled' ? goalsRes.value : [];
      // RPM-doelen hebben geen `status`-veld (dat was een rest van het oude, nooit toegepaste
      // schema) — "actief" betekent hier gewoon "nog niet afgerond".
      const activeGoals = allGoals.filter((g: any) => !g.completed);
      const weeklyProg  = focusRes.status === 'fulfilled'
        ? Math.min(100, (focusRes.value as any[]).length * 10) : 0;

      setGoals(activeGoals.slice(0, 4));
      setStats({ activeGoals: activeGoals.length, weeklyProgress: weeklyProg });

      // Hefboom-taken vandaag: 80/20-gemarkeerde, nog niet voltooide acties uit alle actieve
      // Rocks van dit kwartaal (niet beperkt tot de 4 getoonde "Actuele Doelen") — Pareto-
      // discipline zit in de begrenzing tot 5, niet in een aparte prioriteitsberekening.
      const currentQ = getCurrentQuarter();
      const tasks = activeGoals
        .filter((g: Goal) => g.isRock && g.quarter === currentQ)
        .flatMap((g: Goal) => (g.nextActions ?? [])
          .filter((a) => a.leverage && !a.completed)
          .map((action) => ({ goal: g, action })))
        .slice(0, 5);
      setLeverageTasks(tasks);

      if (winsRes.status === 'fulfilled') {
        setRecentWins(
          winsRes.value
            .sort((a: Win, b: Win) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3)
        );
      }
    } catch {
      if (retry < 2) setTimeout(() => fetchData(retry + 1), 1200 * (retry + 1));
    }
  };

  useEffect(() => {
    const init = async () => {
      const u = AuthService.getUser();
      if (!u) { router.push('/auth/login'); return; }
      setUser(u);
      await fetchData();
      initializeNotifications().catch(() => {});
      setLoading(false);
    };
    init();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Goedemorgen';
    if (h < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  const firstName  = user?.email?.split('@')[0] ?? 'Ondernemer';
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  // Golden Egg: een actieve Rock van dit kwartaal weegt zwaarder dan "toevallig laatst bewerkt" —
  // dat is precies het punt van Rocks (EOS-kwartaalprioriteiten). Valt terug op het oude gedrag
  // zolang er nog geen Rocks zijn gemarkeerd.
  const currentQuarter = getCurrentQuarter();
  const focusGoal  = goals.find(g => g.isRock && g.quarter === currentQuarter) ?? goals[0];

  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const missedEveningYesterday = ritualStatuses.missedRituals.some(
    (m) => m.type === 'evening' && m.daysAgo === 1
  );

  const today = getToday();
  const dismissSignalKey = proactiveSignal ? `proactiveSignalDismissed_${today}_${proactiveSignal.patternKey}` : null;
  const showProactiveSignal =
    proactiveSignal && !signalDismissed &&
    (typeof window === 'undefined' || !dismissSignalKey || !localStorage.getItem(dismissSignalKey));

  const dismissSignal = () => {
    if (dismissSignalKey) localStorage.setItem(dismissSignalKey, 'true');
    setSignalDismissed(true);
  };

  // NSDR-suggestie in de namiddag op een Focus Day (Non-Sleep Deep Rest, 20 min) — puur een
  // client-side tijdcheck, geen cron/push nodig, zelfde dismiss-patroon als het proactieve signaal.
  const nsdrDismissKey = `nsdrDismissed_${today}`;
  const currentHour = new Date().getHours();
  const showNsdr =
    todayDayType === 'focus' && currentHour >= 14 && currentHour < 15 && !nsdrDismissed &&
    (typeof window === 'undefined' || !localStorage.getItem(nsdrDismissKey));
  const dismissNsdr = () => {
    localStorage.setItem(nsdrDismissKey, 'true');
    setNsdrDismissed(true);
  };

  const completeLeverageTask = async (goal: Goal, action: GoalAction) => {
    setLeverageTasks(prev => prev.filter(t => t.action.id !== action.id));
    const nextActions = (goal.nextActions ?? []).map(a => a.id === action.id ? { ...a, completed: true } : a);
    await api.goals.update(goal.id, { nextActions });
  };

  const resolveProposal = async (id: string | number, action: 'approve' | 'reject') => {
    setResolvingProposalId(id);
    try {
      if (action === 'approve') await api.calendar.proposals.approve(id);
      else await api.calendar.proposals.reject(id);
      setProposals((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // Laat het voorstel staan zodat de gebruiker het opnieuw kan proberen.
    } finally {
      setResolvingProposalId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <RitualGuard>
      <div className="min-h-screen bg-surface pb-28">

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-line">
          <div className="max-w-lg mx-auto px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="myAiPA logo"
                width={36}
                height={36}
                className="rounded-full"
                priority
              />
              <div className="leading-tight">
                <p className="text-[13px] font-bold text-ink">myAiPA</p>
                <p className="text-[9px] font-bold tracking-[0.18em] text-primary uppercase">
                  Jouw persoonlijke AI PA
                </p>
              </div>
            </div>
            <button className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center text-ink-soft hover:text-ink transition-colors">
              <Bell size={16} />
            </button>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-5">

          {/* ══ GREETING ════════════════════════════════════════ */}
          <div className="pt-7 pb-6">
            <h1 className="text-[30px] font-bold leading-tight text-ink tracking-tight">
              {getGreeting()}, {displayName}
            </h1>
            {leverageGoal ? (
              <div className="mt-2.5">
                <p className="text-[10px] font-bold tracking-[0.15em] text-primary uppercase mb-1">
                  90-dagen hefboom
                </p>
                <p className="text-[13px] text-ink leading-relaxed">{leverageGoal}</p>
              </div>
            ) : (
              <p className="text-[13px] text-ink-soft mt-2 italic leading-relaxed">
                &ldquo;The best way to predict the future is to create it.&rdquo;
              </p>
            )}
          </div>

          {/* ══ FREE DAY — RUST, GEEN PRESTATIEDRUK ═════════════ */}
          {todayDayType === 'free' && (
            <div className="flex items-center gap-3 rounded-card border border-tertiary/20 bg-tertiary-soft p-4 mb-5">
              <div className="w-9 h-9 rounded-[10px] bg-tertiary/15 flex items-center justify-center flex-shrink-0">
                <Sunrise size={17} className="text-tertiary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-ink">Vrije dag — geniet ervan.</p>
                <p className="text-[11px] text-ink-soft">Herstel is vandaag het doel, niet presteren.</p>
              </div>
            </div>
          )}

          {/* ══ PROACTIEVE SIGNAALKAART (AIPA) ══════════════════ */}
          {todayDayType !== 'free' && showProactiveSignal && proactiveSignal && (
            <div className="rounded-card border border-accent/25 bg-accent-soft p-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={17} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold tracking-[0.15em] text-accent uppercase mb-1">AIPA signaleert</p>
                  <p className="text-[13px] text-ink leading-relaxed mb-3">{proactiveSignal.message}</p>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/coach"
                      className="text-[12px] font-semibold text-accent"
                    >
                      Bespreek met AIPA →
                    </Link>
                    <button
                      onClick={dismissSignal}
                      className="text-[12px] font-medium text-ink-soft"
                    >
                      Negeren voor vandaag
                    </button>
                  </div>
                </div>
                <button
                  onClick={dismissSignal}
                  aria-label="Sluiten"
                  className="text-ink-soft hover:text-ink flex-shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ══ NOG TE DOEN: RITUEEL ═════════════════════════════ */}
          {todayDayType !== 'free' && nextRitual && nextRitual.isAvailable && (
            <Link
              href={nextRitual.path}
              className="flex items-center gap-3 rounded-card border border-primary/25 bg-primary-muted p-4 mb-5 active:scale-[0.99] transition-transform"
            >
              <div className="w-9 h-9 rounded-[10px] bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Sunrise size={17} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-ink">Nog te doen: {nextRitual.title}</p>
                <p className="text-[11px] text-primary">{nextRitual.reason} →</p>
              </div>
            </Link>
          )}

          {/* ══ GEMIST AVONDRITUEEL BANNER ══════════════════════ */}
          {missedEveningYesterday && (
            <Link
              href={`/evening?date=${yesterday}`}
              className="flex items-center gap-3 rounded-card border border-accent/25 bg-accent-soft p-4 mb-5 active:scale-[0.99] transition-transform"
            >
              <div className="w-9 h-9 rounded-[10px] bg-accent/15 flex items-center justify-center flex-shrink-0">
                <Moon size={17} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-ink">Avondritueel gemist</p>
                <p className="text-[11px] text-accent">Tik om gisteren alsnog in te vullen →</p>
              </div>
            </Link>
          )}

          {/* ══ GOLDEN EGG — FOCUS VAN DE DAG ═══════════════════ */}
          {focusGoal ? (
            <div className="rounded-hero bg-surface-inverse p-5 mb-6 shadow-organic-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="live-dot w-2 h-2 rounded-full bg-primary-light inline-block" />
                  <span className="text-[9px] font-bold tracking-[0.2em] text-primary-light uppercase">
                    Golden Egg — Focus van de dag
                  </span>
                </div>
                <Link href="/goals" className="text-[10px] font-semibold text-on-surface-inverse/50 hover:text-on-surface-inverse transition-colors">
                  {goalProgressLabel(focusGoal.progress)}
                </Link>
              </div>
              <h2 className="text-[19px] font-bold text-on-surface-inverse leading-snug mb-1.5">
                {focusGoal.title}
              </h2>
              <p className="text-[12px] text-on-surface-inverse/50 mb-5">
                Prioriteit: Hoog &mdash; blijf gefocust op wat écht telt.
              </p>
              <Link
                href="/focus"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[14px] bg-primary text-white font-bold text-[14px] active:scale-[0.98] transition-transform shadow-[0_4px_20px_rgba(81,96,80,0.35)]"
              >
                <Play size={14} fill="currentColor" />
                Start Focus Timer
              </Link>
            </div>
          ) : (
            <Link
              href="/goals"
              className="block rounded-hero bg-surface-inverse p-5 mb-6 shadow-organic-lg"
            >
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-on-surface-inverse/30 inline-block" />
                <span className="text-[9px] font-bold tracking-[0.2em] text-on-surface-inverse/50 uppercase">
                  Geen actief doel
                </span>
              </div>
              <p className="text-[16px] font-bold text-on-surface-inverse mb-1">Stel je focus in</p>
              <p className="text-[12px] text-on-surface-inverse/50">Voeg een doel toe om te starten →</p>
            </Link>
          )}

          {/* ══ HEFBOOM-TAKEN VANDAAG (80/20) ════════════════════ */}
          {leverageTasks.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-8 h-8 rounded-[10px] bg-tertiary-soft flex items-center justify-center">
                  <Flame size={15} className="text-tertiary" />
                </div>
                <h2 className="text-[15px] font-bold text-ink">Hefboom-taken vandaag</h2>
              </div>
              <div className="space-y-2">
                {leverageTasks.map(({ goal, action }) => (
                  <div key={action.id} className="flex items-center gap-3 px-4 py-3 rounded-[14px] border border-line bg-surface-card">
                    <button
                      onClick={() => completeLeverageTask(goal, action)}
                      className="w-6 h-6 shrink-0 rounded-full border-2 border-tertiary flex items-center justify-center active:scale-90 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-ink truncate">{action.text}</p>
                      <p className="text-[11px] text-ink-soft truncate">{goal.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ══ MIJN ROUTINES ═══════════════════════════════════ */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[15px] font-bold text-ink">Mijn Routines</h2>
              <Link href="/morning" className="text-[12px] font-semibold text-primary">
                Beheer alles
              </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory">
              <Link
                href="/morning"
                className="flex-none w-[168px] snap-start rounded-card border border-line bg-surface-card p-4 shadow-organic hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-9 h-9 rounded-[10px] bg-tertiary-soft flex items-center justify-center">
                    <Sunrise size={17} className="text-tertiary" />
                  </div>
                  {ritualStatuses.morning.isComplete && (
                    <span className="text-[9px] font-bold text-primary bg-primary-muted px-1.5 py-0.5 rounded-full">✓ Klaar</span>
                  )}
                </div>
                <p className="text-[10px] text-ink-soft mb-0.5 tabular-nums">07:00 – 08:30</p>
                <p className="text-[13px] font-bold text-ink mb-0.5">Ochtend Routine</p>
                <p className="text-[10px] text-ink-soft mb-3 leading-snug">Meditatie, Schrijven, Sport</p>
                <div className="h-1 rounded-full bg-surface-sunken overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: ritualStatuses.morning.isComplete ? '100%' : '65%' }}
                  />
                </div>
                <p className="text-[10px] text-ink-soft mt-1.5 font-medium">
                  {ritualStatuses.morning.isComplete ? '100%' : '65%'}
                </p>
              </Link>

              <Link
                href="/evening"
                className="flex-none w-[168px] snap-start rounded-card border border-line bg-surface-card p-4 shadow-organic hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-9 h-9 rounded-[10px] bg-accent-soft flex items-center justify-center">
                    <Moon size={17} className="text-accent" />
                  </div>
                  {ritualStatuses.evening.isComplete && (
                    <span className="text-[9px] font-bold text-primary bg-primary-muted px-1.5 py-0.5 rounded-full">✓ Klaar</span>
                  )}
                </div>
                <p className="text-[10px] text-ink-soft mb-0.5 tabular-nums">20:00 – 21:00</p>
                <p className="text-[13px] font-bold text-ink mb-0.5">Avond Routine</p>
                <p className="text-[10px] text-ink-soft mb-3 leading-snug">Reflectie, Planning</p>
                <div className="h-1 rounded-full bg-surface-sunken overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: ritualStatuses.evening.isComplete ? '100%' : '0%' }}
                  />
                </div>
                <p className="text-[10px] text-ink-soft mt-1.5 font-medium">
                  {ritualStatuses.evening.isComplete ? '100%' : 'Vanaf 17:00'}
                </p>
              </Link>

              {ritualStatuses.weeklyStart.canStillComplete && !ritualStatuses.weeklyStart.isComplete && (
                <Link
                  href="/weekly-start"
                  className="flex-none w-[168px] snap-start rounded-card border border-line bg-surface-card p-4 shadow-organic"
                >
                  <div className="mb-3.5">
                    <div className="w-9 h-9 rounded-[10px] bg-primary-muted flex items-center justify-center">
                      <CalendarDays size={17} className="text-primary" />
                    </div>
                  </div>
                  <p className="text-[10px] text-ink-soft mb-0.5">Maandag</p>
                  <p className="text-[13px] font-bold text-ink mb-0.5">Week Start</p>
                  <p className="text-[10px] text-ink-soft mb-3">Plan je week</p>
                  <div className="h-1 rounded-full bg-surface-sunken" />
                  <p className="text-[10px] text-ink-soft mt-1.5">Niet gestart</p>
                </Link>
              )}

              {dayType === 'weekend' && (
                <Link
                  href="/weekly-review"
                  className="flex-none w-[168px] snap-start rounded-card border border-line bg-surface-card p-4 shadow-organic"
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-9 h-9 rounded-[10px] bg-tertiary-soft flex items-center justify-center">
                      <TrendingUp size={17} className="text-tertiary" />
                    </div>
                    {ritualStatuses.weeklyReview.isComplete && (
                      <span className="text-[9px] font-bold text-primary bg-primary-muted px-1.5 py-0.5 rounded-full">✓</span>
                    )}
                  </div>
                  <p className="text-[10px] text-ink-soft mb-0.5">Weekend</p>
                  <p className="text-[13px] font-bold text-ink mb-0.5">Week Review</p>
                  <p className="text-[10px] text-ink-soft mb-3">Evalueer je week</p>
                  <div className="h-1 rounded-full bg-surface-sunken overflow-hidden">
                    <div
                      className="h-full rounded-full bg-tertiary"
                      style={{ width: ritualStatuses.weeklyReview.isComplete ? '100%' : '0%' }}
                    />
                  </div>
                </Link>
              )}
            </div>
          </section>

          {/* ══ VANDAAG IN JE AGENDA ════════════════════════════ */}
          {calendarConfigured && calendarEvents.length > 0 && (() => {
            const meetingMinutes = calendarEvents.reduce((sum, ev) => {
              if (ev.isAllDay || !ev.start || !ev.end) return sum;
              return sum + Math.max(0, (new Date(ev.end).getTime() - new Date(ev.start).getTime()) / 60000);
            }, 0);
            const hours = Math.round((meetingMinutes / 60) * 10) / 10;
            const isDrukkeDag = meetingMinutes >= 300;
            const druk = isDrukkeDag ? 'Drukke dag' : meetingMinutes >= 150 ? 'Gemiddelde vergaderdruk' : 'Rustige dag';

            const timedEvents = calendarEvents.filter((ev) => !ev.isAllDay && ev.end);
            const lastEventEnd = timedEvents.length > 0
              ? new Date(Math.max(...timedEvents.map((ev) => new Date(ev.end!).getTime())))
              : new Date();
            const recoveryStart = new Date(lastEventEnd.getTime() + 15 * 60000);
            const recoveryUrl = buildRecoveryProposalUrl(
              recoveryStart,
              60,
              'Hersteltijd (voorgesteld door AIPA)',
              'Voorgesteld na een drukke dag met veel vergaderingen — even geen scherm, even geen taak.'
            );

            // Maker-tijd-signaal: op een Focus Day is de ochtend het duurste onroerend goed op de
            // kalender (zie het tijdsarchitectuur-onderzoek) — een vergadering vóór de middag botst
            // daarmee, puur signalerend, geen automatische actie.
            const hasMorningMeeting = todayDayType === 'focus' && timedEvents.some(
              (ev) => ev.start && new Date(ev.start).getHours() < 12
            );

            return (
            <div className="rounded-card border border-line bg-surface-card p-5 mb-6 shadow-organic">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[10px] bg-primary-muted flex items-center justify-center">
                    <CalendarDays size={15} className="text-primary" />
                  </div>
                  <p className="text-[14px] font-semibold text-ink">Vandaag in je agenda</p>
                </div>
                {meetingMinutes > 0 && (
                  <span className="text-[10px] font-medium text-ink-soft bg-surface-sunken rounded-full px-2.5 py-1 whitespace-nowrap">
                    {druk} &middot; {hours}u
                  </span>
                )}
              </div>
              <div className="space-y-2.5">
                {calendarEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3">
                    <span className="text-[12px] font-medium text-ink-soft w-12 flex-shrink-0 tabular-nums">
                      {ev.isAllDay || !ev.start
                        ? 'Hele dag'
                        : new Date(ev.start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[13px] text-ink truncate">{ev.summary}</span>
                  </div>
                ))}
              </div>
              {hasMorningMeeting && (
                <div className="mt-4 flex items-center gap-2.5 rounded-[12px] bg-tertiary-soft px-4 py-3">
                  <Mountain size={14} className="text-tertiary flex-shrink-0" />
                  <span className="text-[12px] font-medium text-ink flex-1">
                    Vergadering(en) vóór de middag botsen met je Focus Day — de ochtend is je duurste onroerend goed
                  </span>
                </div>
              )}
              {isDrukkeDag && (
                <a
                  href={recoveryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2.5 rounded-[12px] bg-primary-muted px-4 py-3 hover:bg-primary/15 transition-colors"
                >
                  <Sparkles size={14} className="text-primary flex-shrink-0" />
                  <span className="text-[12px] font-medium text-ink flex-1">
                    Drukke dag — AIPA stelt een uur hersteltijd voor na je laatste afspraak
                  </span>
                  <ChevronRight size={14} className="text-primary flex-shrink-0" />
                </a>
              )}
            </div>
            );
          })()}

          {/* ══ NSDR-SUGGESTIE (NAMIDDAG, FOCUS DAY) ═════════════ */}
          {showNsdr && (
            <div className="flex items-center gap-3 rounded-card border border-tertiary/20 bg-tertiary-soft p-4 mb-6">
              <div className="w-9 h-9 rounded-[10px] bg-tertiary/15 flex items-center justify-center flex-shrink-0">
                <Moon size={17} className="text-tertiary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-ink">Tijd voor 20 minuten NSDR</p>
                <p className="text-[11px] text-ink-soft">Reset je focus vóór de rest van de middag.</p>
              </div>
              <button onClick={dismissNsdr} aria-label="Sluiten" className="text-ink-soft hover:text-ink flex-shrink-0">
                <X size={15} />
              </button>
            </div>
          )}

          {/* ══ VOORGESTELDE TIJDBLOKKEN ═════════════════════════ */}
          {proposals.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-8 h-8 rounded-[10px] bg-primary-muted flex items-center justify-center">
                  <Sparkles size={15} className="text-primary" />
                </div>
                <h2 className="text-[15px] font-bold text-ink">Voorgestelde tijdblokken</h2>
              </div>
              <div className="space-y-2.5">
                {proposals.map((p) => (
                  <div key={p.id} className="rounded-card border border-line bg-surface-card p-4">
                    <p className="text-[13px] font-semibold text-ink mb-0.5">{p.summary}</p>
                    <p className="text-[11px] text-ink-soft mb-1">
                      {new Date(p.start_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(p.end_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {p.reason && <p className="text-[11px] text-ink-soft mb-3 leading-snug">{p.reason}</p>}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => resolveProposal(p.id, 'approve')}
                        disabled={resolvingProposalId === p.id}
                        className="flex-1 py-2.5 rounded-[12px] bg-primary text-white text-[12px] font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
                      >
                        Goedkeuren
                      </button>
                      <button
                        onClick={() => resolveProposal(p.id, 'reject')}
                        disabled={resolvingProposalId === p.id}
                        className="flex-1 py-2.5 rounded-[12px] bg-surface-sunken text-ink-soft text-[12px] font-semibold disabled:opacity-50"
                      >
                        Afwijzen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ══ AIPA ═════════════════════════════════════════════ */}
          <Link
            href="/coach"
            className="block rounded-card bg-surface-inverse p-4 mb-6 hover:opacity-95 transition-opacity shadow-organic"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-on-surface-inverse/10 flex items-center justify-center flex-shrink-0">
                <Sparkles size={18} className="text-primary-light" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-on-surface-inverse">AIPA</p>
                <p className="text-[11px] text-on-surface-inverse/50 leading-snug">Je business- en welzijnscoach — vraag een reflectie op je dag</p>
              </div>
              <ChevronRight size={16} className="text-on-surface-inverse/40 flex-shrink-0" />
            </div>
          </Link>

          {/* ══ ACTUELE DOELEN ══════════════════════════════════ */}
          {goals.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[15px] font-bold text-ink">Actuele Doelen</h2>
                <Link
                  href="/insights"
                  className="flex items-center gap-1 text-[11px] font-semibold text-ink-soft hover:text-primary transition-colors"
                >
                  <TrendingUp size={13} />
                  Insights
                </Link>
              </div>

              <div className="space-y-2.5">
                {goals.map((goal) => (
                  <Link
                    key={goal.id}
                    href="/goals"
                    className="block rounded-[14px] border border-line bg-surface-card px-4 py-3.5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[13px] font-semibold text-ink leading-snug flex-1 pr-3">
                        {goal.title}
                      </p>
                      <span className="text-[14px] font-bold text-primary tabular-nums shrink-0">
                        {goal.progress ?? 0}%
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-ink-soft tracking-[0.15em] uppercase mb-2">
                      {categoryLabel[goal.category] ?? goal.category}
                    </p>
                    <div className="h-1 rounded-full bg-surface-sunken overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${Math.max(2, goal.progress ?? 0)}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ══ STATS ROW ═══════════════════════════════════════ */}
          <section className="mb-6">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-[14px] bg-surface-sunken px-3 py-4">
                <p className="text-[9px] font-bold text-ink-soft uppercase tracking-[0.12em] mb-1.5">Doelen</p>
                <p className="text-[26px] font-bold text-ink leading-none">{stats.activeGoals}</p>
                <p className="text-[9px] text-ink-soft mt-1">actief</p>
              </div>
              <div className="rounded-[14px] bg-tertiary-soft border border-[#ffb5a1] px-3 py-4">
                <p className="text-[9px] font-bold text-tertiary uppercase tracking-[0.12em] mb-1.5">Streak</p>
                <p className="text-[26px] font-bold text-ink leading-none">{ritualStatuses.streak.currentStreak}</p>
                <p className="text-[9px] text-tertiary mt-1">dagen</p>
              </div>
              <div className="rounded-[14px] bg-surface-sunken px-3 py-4">
                <p className="text-[9px] font-bold text-ink-soft uppercase tracking-[0.12em] mb-1.5">Week</p>
                <p className="text-[26px] font-bold text-ink leading-none">{stats.weeklyProgress}</p>
                <p className="text-[9px] text-ink-soft mt-1">procent</p>
              </div>
            </div>
          </section>

          {/* ══ RECENTE WINS ════════════════════════════════════ */}
          {recentWins.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[15px] font-bold text-ink">Recente Wins</h2>
                <Link href="/wins" className="text-[12px] font-semibold text-primary">
                  Alles bekijken
                </Link>
              </div>
              <div className="space-y-2">
                {recentWins.map((win) => (
                  <div
                    key={win.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-[14px] border border-line bg-surface-card"
                  >
                    <div className="w-8 h-8 rounded-[10px] bg-primary-muted flex items-center justify-center flex-none">
                      <Zap size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ink truncate">{win.title}</p>
                      <p className="text-[11px] text-ink-soft">
                        {new Date(win.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < win.impact_level ? 'bg-primary' : 'bg-line'}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ══ SNEL VERDER ═════════════════════════════════════ */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[15px] font-bold text-ink">Snel verder</h2>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/identity"
                className="rounded-card bg-surface-inverse p-4 flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <div className="w-9 h-9 rounded-[10px] bg-on-surface-inverse/10 flex items-center justify-center">
                  <Fingerprint size={17} className="text-on-surface-inverse" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-on-surface-inverse">Identiteit</p>
                  <p className="text-[10px] text-on-surface-inverse/50">Claim wie je bent</p>
                </div>
              </Link>
              <Link
                href="/dagboek"
                className="rounded-card border border-line bg-surface-card p-4 flex items-center gap-3 hover:border-primary/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-[10px] bg-tertiary-soft flex items-center justify-center">
                  <BookHeart size={17} className="text-tertiary" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-ink">Dagboek</p>
                  <p className="text-[10px] text-ink-soft">Hoe voel je je?</p>
                </div>
              </Link>
            </div>
            <p className="text-[11px] text-ink-soft text-center mt-3">
              Verdieping (Controle Cirkel, ACA, ADHD, Cursussen) vind je onder{' '}
              <span className="font-semibold text-ink">Menu → Verdieping</span> hieronder.
            </p>
          </section>

        </main>

        {/* ══ BOTTOM NAV ══════════════════════════════════════ */}
        <BottomNav />
      </div>
    </RitualGuard>
  );
}

function goalProgressLabel(progress: number | undefined) {
  const p = progress ?? 0;
  if (p >= 100) return 'Afgerond →';
  return `${p}% klaar →`;
}
