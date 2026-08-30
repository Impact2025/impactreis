'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell, Sunrise, Moon, CalendarDays, BookOpen,
  TrendingUp, Play, ChevronRight, Zap, BookHeart, Sparkles,
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { Win } from '@/types';
import { RitualGuard } from '@/components/weekflow/ritual-guard';
import { getDayType, isEveningRitualComplete } from '@/lib/weekflow.service';
import { initializeNotifications } from '@/lib/notifications.service';
import { canStillDoWeeklyStart } from '@/lib/ritual-recovery.service';
import { useRitualStatus } from '@/hooks/useRitualStatus';
import { BottomNav } from '@/components/ui/bottom-nav';

interface Goal {
  id: string;
  title: string;
  category: string;
  progress: number;
  status: string;
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
  const [stats, setStats]           = useState({ activeGoals: 0, weeklyProgress: 0, streak: 12 });
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarConfigured, setCalendarConfigured] = useState(false);
  const [leverageGoal, setLeverageGoal] = useState<string | null>(null);
  const router                      = useRouter();

  const ritualStatuses = useRitualStatus();
  const dayType        = getDayType();

  const categoryLabel: Record<string, string> = {
    business:      'BUSINESS',
    health:        'GEZONDHEID',
    relationships: 'RELATIES',
    personal:      'PERSOONLIJK',
    marketing:     'MARKETING',
  };

  const fetchData = async (retry = 0) => {
    try {
      const [goalsRes, focusRes, winsRes, calendarRes, onboardingRes] = await Promise.allSettled([
        api.goals.getAll(),
        api.focus.getAll(),
        api.wins.getAll(),
        api.calendar.today(),
        api.onboarding.profile(),
      ]);

      if (calendarRes.status === 'fulfilled') {
        setCalendarConfigured(calendarRes.value.configured);
        setCalendarEvents(calendarRes.value.events ?? []);
      }

      if (onboardingRes.status === 'fulfilled' && onboardingRes.value.profile) {
        setLeverageGoal(onboardingRes.value.profile.impactProfile?.quarterlyLeverageGoal ?? null);
      }

      const allGoals    = goalsRes.status === 'fulfilled' ? goalsRes.value : [];
      const activeGoals = allGoals.filter((g: any) => g.status === 'active');
      const weeklyProg  = focusRes.status === 'fulfilled'
        ? Math.min(100, (focusRes.value as any[]).length * 10) : 0;

      setGoals(activeGoals.slice(0, 4));
      setStats({ activeGoals: activeGoals.length, weeklyProgress: weeklyProg, streak: 12 });

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
  const focusGoal  = goals[0];

  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const yesterdayDay = new Date(yesterday + 'T12:00:00').getDay();
  const missedEveningYesterday =
    yesterdayDay >= 1 && yesterdayDay <= 5 && !isEveningRitualComplete(yesterday);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#00cc66] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <RitualGuard>
      <div className="min-h-screen bg-white pb-28">

        {/* ══ HEADER ══════════════════════════════════════════ */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e8e8ec]">
          <div className="max-w-lg mx-auto px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-[#0a0a14] flex items-center justify-center text-white text-[13px] font-bold select-none">
                {displayName.charAt(0)}
              </div>
              <div className="leading-tight">
                <p className="text-[13px] font-bold text-[#0a0a14]">Mijn Ondernemers OS</p>
                <p className="text-[9px] font-bold tracking-[0.18em] text-[#00cc66] uppercase">
                  Mastermind Edition
                </p>
              </div>
            </div>
            <button className="w-9 h-9 rounded-full bg-[#f4f4f7] flex items-center justify-center text-[#8a8a9a] hover:text-[#0a0a14] transition-colors">
              <Bell size={16} />
            </button>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-5">

          {/* ══ GREETING ════════════════════════════════════════ */}
          <div className="pt-7 pb-6">
            <h1 className="text-[30px] font-bold leading-tight text-[#0a0a14] tracking-tight">
              {getGreeting()}, {displayName}
            </h1>
            {leverageGoal ? (
              <div className="mt-2.5">
                <p className="text-[10px] font-bold tracking-[0.15em] text-[#00cc66] uppercase mb-1">
                  90-dagen hefboom
                </p>
                <p className="text-[13px] text-[#0a0a14] leading-relaxed">{leverageGoal}</p>
              </div>
            ) : (
              <p className="text-[13px] text-[#8a8a9a] mt-2 italic leading-relaxed">
                &ldquo;The best way to predict the future is to create it.&rdquo;
              </p>
            )}
          </div>

          {/* ══ GEMIST AVONDRITUEEL BANNER ══════════════════════ */}
          {missedEveningYesterday && (
            <Link
              href={`/evening?date=${yesterday}`}
              className="flex items-center gap-3 rounded-[16px] border border-[#6366f1]/25 bg-[#6366f1]/5 p-4 mb-5 active:scale-[0.99] transition-transform"
            >
              <div className="w-9 h-9 rounded-[10px] bg-[#6366f1]/15 flex items-center justify-center flex-shrink-0">
                <Moon size={17} className="text-[#6366f1]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#0a0a14]">Avondritueel gemist</p>
                <p className="text-[11px] text-[#6366f1]">Tik om gisteren alsnog in te vullen →</p>
              </div>
            </Link>
          )}

          {/* ══ FOCUS CARD ══════════════════════════════════════ */}
          {focusGoal ? (
            <div className="rounded-[20px] bg-[#0a0a14] p-5 mb-6">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="live-dot w-2 h-2 rounded-full bg-[#00cc66] inline-block" />
                <span className="text-[9px] font-bold tracking-[0.2em] text-[#00cc66] uppercase">
                  Focus van de dag
                </span>
              </div>
              <h2 className="text-[19px] font-bold text-white leading-snug mb-1.5">
                {focusGoal.title}
              </h2>
              <p className="text-[12px] text-[#5a5a6a] mb-5">
                Prioriteit: Hoog &mdash; blijf gefocust op wat écht telt.
              </p>
              <Link
                href="/focus"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[14px] bg-[#00cc66] text-[#0a0a14] font-bold text-[14px] active:scale-[0.98] transition-transform shadow-[0_4px_20px_rgba(0,204,102,0.35)]"
              >
                <Play size={14} fill="currentColor" />
                Start Focus Timer
              </Link>
            </div>
          ) : (
            <Link
              href="/goals"
              className="block rounded-[20px] bg-[#0a0a14] p-5 mb-6"
            >
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#8a8a9a] inline-block" />
                <span className="text-[9px] font-bold tracking-[0.2em] text-[#8a8a9a] uppercase">
                  Geen actief doel
                </span>
              </div>
              <p className="text-[16px] font-bold text-white mb-1">Stel je focus in</p>
              <p className="text-[12px] text-[#5a5a6a]">Voeg een doel toe om te starten →</p>
            </Link>
          )}

          {/* ══ MIJN ROUTINES ═══════════════════════════════════ */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[15px] font-bold text-[#0a0a14]">Mijn Routines</h2>
              <Link href="/morning" className="text-[12px] font-semibold text-[#00cc66]">
                Beheer alles
              </Link>
            </div>

            {/* Horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory">
              {/* Ochtend */}
              <Link
                href="/morning"
                className="flex-none w-[168px] snap-start rounded-[16px] border border-[#e8e8ec] bg-white p-4 hover:border-[#00cc66]/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-9 h-9 rounded-[10px] bg-[#fff8eb] flex items-center justify-center">
                    <Sunrise size={17} className="text-[#f59e0b]" />
                  </div>
                  {ritualStatuses.morning.isComplete && (
                    <span className="text-[9px] font-bold text-[#00cc66] bg-[#f0fdf4] px-1.5 py-0.5 rounded-full">✓ Klaar</span>
                  )}
                </div>
                <p className="text-[10px] text-[#8a8a9a] mb-0.5 tabular-nums">07:00 – 08:30</p>
                <p className="text-[13px] font-bold text-[#0a0a14] mb-0.5">Ochtend Routine</p>
                <p className="text-[10px] text-[#8a8a9a] mb-3 leading-snug">Meditatie, Schrijven, Sport</p>
                <div className="h-1 rounded-full bg-[#f4f4f7] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#00cc66] transition-all duration-700"
                    style={{ width: ritualStatuses.morning.isComplete ? '100%' : '65%' }}
                  />
                </div>
                <p className="text-[10px] text-[#8a8a9a] mt-1.5 font-medium">
                  {ritualStatuses.morning.isComplete ? '100%' : '65%'}
                </p>
              </Link>

              {/* Avond */}
              <Link
                href="/evening"
                className="flex-none w-[168px] snap-start rounded-[16px] border border-[#e8e8ec] bg-white p-4 hover:border-[#6366f1]/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-9 h-9 rounded-[10px] bg-[#f0f0ff] flex items-center justify-center">
                    <Moon size={17} className="text-[#6366f1]" />
                  </div>
                  {ritualStatuses.evening.isComplete && (
                    <span className="text-[9px] font-bold text-[#00cc66] bg-[#f0fdf4] px-1.5 py-0.5 rounded-full">✓ Klaar</span>
                  )}
                </div>
                <p className="text-[10px] text-[#8a8a9a] mb-0.5 tabular-nums">20:00 – 21:00</p>
                <p className="text-[13px] font-bold text-[#0a0a14] mb-0.5">Avond Routine</p>
                <p className="text-[10px] text-[#8a8a9a] mb-3 leading-snug">Reflectie, Planning</p>
                <div className="h-1 rounded-full bg-[#f4f4f7] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#6366f1] transition-all duration-700"
                    style={{ width: ritualStatuses.evening.isComplete ? '100%' : '0%' }}
                  />
                </div>
                <p className="text-[10px] text-[#8a8a9a] mt-1.5 font-medium">
                  {ritualStatuses.evening.isComplete ? '100%' : 'Vanaf 17:00'}
                </p>
              </Link>

              {/* Week Start */}
              {canStillDoWeeklyStart() && !ritualStatuses.weeklyStart.isComplete && (
                <Link
                  href="/weekly-start"
                  className="flex-none w-[168px] snap-start rounded-[16px] border border-[#e8e8ec] bg-white p-4"
                >
                  <div className="mb-3.5">
                    <div className="w-9 h-9 rounded-[10px] bg-[#f0fdf4] flex items-center justify-center">
                      <CalendarDays size={17} className="text-[#00cc66]" />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#8a8a9a] mb-0.5">Maandag</p>
                  <p className="text-[13px] font-bold text-[#0a0a14] mb-0.5">Week Start</p>
                  <p className="text-[10px] text-[#8a8a9a] mb-3">Plan je week</p>
                  <div className="h-1 rounded-full bg-[#f4f4f7]" />
                  <p className="text-[10px] text-[#8a8a9a] mt-1.5">Niet gestart</p>
                </Link>
              )}

              {/* Weekend review */}
              {dayType === 'weekend' && (
                <Link
                  href="/weekly-review"
                  className="flex-none w-[168px] snap-start rounded-[16px] border border-[#e8e8ec] bg-white p-4"
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-9 h-9 rounded-[10px] bg-[#fdf4ff] flex items-center justify-center">
                      <BookOpen size={17} className="text-[#a855f7]" />
                    </div>
                    {ritualStatuses.weeklyReview.isComplete && (
                      <span className="text-[9px] font-bold text-[#00cc66] bg-[#f0fdf4] px-1.5 py-0.5 rounded-full">✓</span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8a8a9a] mb-0.5">Weekend</p>
                  <p className="text-[13px] font-bold text-[#0a0a14] mb-0.5">Week Review</p>
                  <p className="text-[10px] text-[#8a8a9a] mb-3">Evalueer je week</p>
                  <div className="h-1 rounded-full bg-[#f4f4f7] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#a855f7]"
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

            // Synergie coach ↔ PA, zonder de bestaande ImpactOS-review-gate te omzeilen: geen
            // automatische agenda-schrijfactie, wél een concrete, één-klik-voorstel dat Google
            // Calendar's eigen "nieuw event"-scherm opent — Vincent bevestigt en bewaart zelf.
            const toGCal = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const timedEvents = calendarEvents.filter((ev) => !ev.isAllDay && ev.end);
            const lastEventEnd = timedEvents.length > 0
              ? new Date(Math.max(...timedEvents.map((ev) => new Date(ev.end!).getTime())))
              : new Date();
            const recoveryStart = new Date(lastEventEnd.getTime() + 15 * 60000);
            const recoveryEnd = new Date(recoveryStart.getTime() + 60 * 60000);
            const recoveryUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Hersteltijd (voorgesteld door Aipa)')}&dates=${toGCal(recoveryStart)}/${toGCal(recoveryEnd)}&details=${encodeURIComponent('Voorgesteld na een drukke dag met veel vergaderingen — even geen scherm, even geen taak.')}`;

            return (
            <div className="rounded-[16px] border border-[#e8e8ec] p-5 mb-6">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[10px] bg-[#00cc66]/10 flex items-center justify-center">
                    <CalendarDays size={15} className="text-[#00cc66]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#0a0a14]">Vandaag in je agenda</p>
                </div>
                {meetingMinutes > 0 && (
                  <span className="text-[10px] font-medium text-[#8a8a9a] bg-[#f4f4f7] rounded-full px-2.5 py-1 whitespace-nowrap">
                    {druk} &middot; {hours}u
                  </span>
                )}
              </div>
              <div className="space-y-2.5">
                {calendarEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3">
                    <span className="text-[12px] font-medium text-[#8a8a9a] w-12 flex-shrink-0 tabular-nums">
                      {ev.isAllDay || !ev.start
                        ? 'Hele dag'
                        : new Date(ev.start).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[13px] text-[#0a0a14] truncate">{ev.summary}</span>
                  </div>
                ))}
              </div>
              {isDrukkeDag && (
                <a
                  href={recoveryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2.5 rounded-[12px] bg-[#00cc66]/10 px-4 py-3 hover:bg-[#00cc66]/15 transition-colors"
                >
                  <Sparkles size={14} className="text-[#00cc66] flex-shrink-0" />
                  <span className="text-[12px] font-medium text-[#0a0a14] flex-1">
                    Drukke dag — Aipa stelt een uur hersteltijd voor na je laatste afspraak
                  </span>
                  <ChevronRight size={14} className="text-[#00cc66] flex-shrink-0" />
                </a>
              )}
            </div>
            );
          })()}

          {/* ══ DE SPARRINGPARTNER ══════════════════════════════ */}
          <Link
            href="/coach"
            className="block rounded-[16px] bg-[#0a0a14] p-4 mb-6 hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#00cc66]/15 flex items-center justify-center flex-shrink-0">
                <Sparkles size={18} className="text-[#00cc66]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white">De Sparringpartner</p>
                <p className="text-[11px] text-white/50 leading-snug">Business- en welzijnscoach — vraag een reflectie op je dag</p>
              </div>
              <ChevronRight size={16} className="text-white/40 flex-shrink-0" />
            </div>
          </Link>

          {/* Insights kreeg zijn plek in de bottom-nav af aan Coach — houd hem bereikbaar */}
          <Link
            href="/insights"
            className="flex items-center gap-2 text-[12px] text-[#8a8a9a] hover:text-[#0a0a14] transition-colors mb-6 -mt-3"
          >
            <TrendingUp size={14} />
            Bekijk je insights en trends
            <ChevronRight size={13} />
          </Link>

          {/* ══ ACTUELE DOELEN ══════════════════════════════════ */}
          {goals.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[15px] font-bold text-[#0a0a14]">Actuele Doelen</h2>
                <Link href="/goals">
                  <TrendingUp size={17} className="text-[#8a8a9a] hover:text-[#00cc66] transition-colors" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {goals.map((goal) => (
                  <Link
                    key={goal.id}
                    href="/goals"
                    className="block rounded-[14px] border border-[#e8e8ec] bg-white px-4 py-3.5 hover:border-[#00cc66]/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[13px] font-semibold text-[#0a0a14] leading-snug flex-1 pr-3">
                        {goal.title}
                      </p>
                      <span className="text-[14px] font-bold text-[#00cc66] tabular-nums shrink-0">
                        {goal.progress ?? 0}%
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-[#8a8a9a] tracking-[0.15em] uppercase mb-2">
                      {categoryLabel[goal.category] ?? goal.category}
                    </p>
                    <div className="h-1 rounded-full bg-[#f4f4f7] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#00cc66] transition-all duration-700"
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
              <div className="rounded-[14px] bg-[#f4f4f7] px-3 py-4">
                <p className="text-[9px] font-bold text-[#8a8a9a] uppercase tracking-[0.12em] mb-1.5">Doelen</p>
                <p className="text-[26px] font-bold text-[#0a0a14] leading-none">{stats.activeGoals}</p>
                <p className="text-[9px] text-[#8a8a9a] mt-1">actief</p>
              </div>
              <div className="rounded-[14px] bg-[#fef3c7] border border-[#fde68a] px-3 py-4">
                <p className="text-[9px] font-bold text-[#f59e0b] uppercase tracking-[0.12em] mb-1.5">Streak</p>
                <p className="text-[26px] font-bold text-[#0a0a14] leading-none">{stats.streak}</p>
                <p className="text-[9px] text-[#f59e0b] mt-1">dagen</p>
              </div>
              <div className="rounded-[14px] bg-[#f4f4f7] px-3 py-4">
                <p className="text-[9px] font-bold text-[#8a8a9a] uppercase tracking-[0.12em] mb-1.5">Week</p>
                <p className="text-[26px] font-bold text-[#0a0a14] leading-none">{stats.weeklyProgress}</p>
                <p className="text-[9px] text-[#8a8a9a] mt-1">procent</p>
              </div>
            </div>
          </section>

          {/* ══ RECENTE WINS ════════════════════════════════════ */}
          {recentWins.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[15px] font-bold text-[#0a0a14]">Recente Wins</h2>
                <Link href="/wins" className="text-[12px] font-semibold text-[#00cc66]">
                  Alles bekijken
                </Link>
              </div>
              <div className="space-y-2">
                {recentWins.map((win) => (
                  <div
                    key={win.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-[14px] border border-[#e8e8ec] bg-white"
                  >
                    <div className="w-8 h-8 rounded-[10px] bg-[#f0fdf4] flex items-center justify-center flex-none">
                      <Zap size={14} className="text-[#00cc66]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0a0a14] truncate">{win.title}</p>
                      <p className="text-[11px] text-[#8a8a9a]">
                        {new Date(win.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < win.impact_level ? 'bg-[#00cc66]' : 'bg-[#e8e8ec]'}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ══ QUICK ACTIONS ═══════════════════════════════════ */}
          <section className="mb-6">
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/identity"
                className="rounded-[16px] bg-[#0a0a14] p-4 flex items-center gap-3 group hover:bg-[#111118] transition-colors"
              >
                <div className="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-base">🛡️</div>
                <div>
                  <p className="text-[12px] font-bold text-white">Identiteit</p>
                  <p className="text-[10px] text-[#5a5a6a]">Claim wie je bent</p>
                </div>
              </Link>
              <Link
                href="/controle-cirkel"
                className="rounded-[16px] border border-[#e8e8ec] bg-white p-4 flex items-center gap-3 hover:border-[#00cc66]/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#f0fdf4] flex items-center justify-center text-base">⭕</div>
                <div>
                  <p className="text-[12px] font-bold text-[#0a0a14]">Controle</p>
                  <p className="text-[10px] text-[#8a8a9a]">Cirkel oefening</p>
                </div>
              </Link>
              <Link
                href="/dagboek"
                className="rounded-[16px] border border-[#e8e8ec] bg-white p-4 flex items-center gap-3 hover:border-[#00cc66]/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#fdf4ff] flex items-center justify-center">
                  <BookHeart size={17} className="text-[#a855f7]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#0a0a14]">Dagboek</p>
                  <p className="text-[10px] text-[#8a8a9a]">Hoe voel je je?</p>
                </div>
              </Link>
              <Link
                href="/aca"
                className="col-span-2 rounded-[16px] bg-[#f0fdf4] border border-[#bbf7d0] p-4 flex items-center justify-between group active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-[#00cc66]/20 flex items-center justify-center text-base">💚</div>
                  <div>
                    <p className="text-[13px] font-bold text-[#0a0a14]">ACA Herstelpad</p>
                    <p className="text-[10px] text-[#00cc66] font-medium">7 weken naar de Liefdevolle Ouder</p>
                  </div>
                </div>
                <ChevronRight size={17} className="text-[#00cc66]/60 group-hover:text-[#00cc66] transition-colors" />
              </Link>
              <Link
                href="/adhd"
                className="col-span-2 rounded-[16px] bg-[#f5f3ff] border border-[#e9d5ff] p-4 flex items-center justify-between group active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-[#a78bfa]/20 flex items-center justify-center text-base">🧠</div>
                  <div>
                    <p className="text-[13px] font-bold text-[#0a0a14]">ADHD Klachten</p>
                    <p className="text-[10px] text-[#a78bfa] font-medium">Meting voor medicatiestart · 3 weken</p>
                  </div>
                </div>
                <ChevronRight size={17} className="text-[#a78bfa]/60 group-hover:text-[#a78bfa] transition-colors" />
              </Link>
              <Link
                href="/courses"
                className="col-span-2 rounded-[16px] bg-gradient-to-r from-[#ff6b35] to-[#e83e3e] p-4 flex items-center justify-between group active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-white/20 flex items-center justify-center text-base">🔥</div>
                  <div>
                    <p className="text-[13px] font-bold text-white">Tony Robbins Cursussen</p>
                    <p className="text-[10px] text-white/70">Unleash Your Power · 12 weken</p>
                  </div>
                </div>
                <ChevronRight size={17} className="text-white/60 group-hover:text-white transition-colors" />
              </Link>
            </div>
          </section>

        </main>

        {/* ══ BOTTOM NAV ══════════════════════════════════════ */}
        <BottomNav />
      </div>
    </RitualGuard>
  );
}
