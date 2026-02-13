'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Target, Calendar, LogOut, Sunrise, Moon, CalendarDays, BookOpen, Trophy, BarChart3, Settings, ChevronRight, Shield, Zap, Flame, GraduationCap } from 'lucide-react';
import { VisionCard } from '@/components/dashboard/vision-card';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { Win } from '@/types';
import { RitualGuard } from '@/components/weekflow/ritual-guard';
import { getDayType } from '@/lib/weekflow.service';
import { initializeNotifications } from '@/lib/notifications.service';
import { canStillDoWeeklyStart } from '@/lib/ritual-recovery.service';
import { useRitualStatus } from '@/hooks/useRitualStatus';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentWins, setRecentWins] = useState<Win[]>([]);
  const [stats, setStats] = useState({
    activeGoals: 0,
    weeklyProgress: 0,
    streak: 0
  });
  const router = useRouter();

  const ritualStatuses = useRitualStatus();
  const dayType = getDayType();

  const fetchDashboardData = async (retryCount = 0) => {
    try {
      const fetchWithTimeout = (promise: Promise<any>, timeout = 5000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      const [goalsResponse, focusResponse, winsResponse] = await Promise.allSettled([
        fetchWithTimeout(api.goals.getAll()),
        fetchWithTimeout(api.focus.getAll()),
        fetchWithTimeout(api.wins.getAll())
      ]);

      const activeGoals = goalsResponse.status === 'fulfilled'
        ? goalsResponse.value.filter((g: any) => g.status === 'active').length
        : 0;

      const weeklyProgress = focusResponse.status === 'fulfilled'
        ? Math.min(100, focusResponse.value.length * 10)
        : 0;

      setStats({
        activeGoals,
        weeklyProgress,
        streak: 12
      });

      if (winsResponse.status === 'fulfilled') {
        const sortedWins = winsResponse.value
          .sort((a: Win, b: Win) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);
        setRecentWins(sortedWins);
      }

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      if (retryCount < 2) {
        setTimeout(() => fetchDashboardData(retryCount + 1), 1000 * (retryCount + 1));
      }
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.getUser();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }
        setUser(currentUser);
        await fetchDashboardData();
        initializeNotifications().catch(console.error);
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Goedemorgen';
    if (hour < 18) return 'Goedemiddag';
    return 'Goedenavond';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-900 dark:border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <RitualGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Minimal Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                <Brain className="text-white dark:text-slate-900" size={16} />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">Mijn OS</span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/settings"
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Settings size={18} />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">
          {/* Welcome */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {getGreeting()}, {user?.email?.split('@')[0]}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Vision Card */}
          <div className="mb-8">
            <VisionCard />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Doelen</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{stats.activeGoals}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Week</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{stats.weeklyProgress}%</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Streak</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{stats.streak}d</p>
            </div>
          </div>

          {/* Rituals Section */}
          <section className="mb-8">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Rituelen
            </h2>
            <div className="space-y-2">
              {/* Weekly Start - show on Mon/Tue/Wed if not complete */}
              {!ritualStatuses.weeklyStart.isComplete && canStillDoWeeklyStart() && (
                <Link
                  href="/weekly-start"
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                      <CalendarDays className="text-emerald-600 dark:text-emerald-400" size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Week Start</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Plan je week</p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" size={18} />
                </Link>
              )}

              {/* Morning */}
              <Link
                href="/morning"
                className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border transition-colors group ${
                  ritualStatuses.morning.isComplete
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    ritualStatuses.morning.isComplete
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-amber-50 dark:bg-amber-900/20'
                  }`}>
                    <Sunrise className={ritualStatuses.morning.isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Ochtend</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {ritualStatuses.morning.isComplete ? 'Afgerond' : 'Start je dag'}
                    </p>
                  </div>
                </div>
                {ritualStatuses.morning.isComplete ? (
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <ChevronRight className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" size={18} />
                )}
              </Link>

              {/* Evening */}
              <Link
                href="/evening"
                className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border transition-colors group ${
                  ritualStatuses.evening.isComplete
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                    : !ritualStatuses.evening.isAvailable
                    ? 'border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    ritualStatuses.evening.isComplete
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-indigo-50 dark:bg-indigo-900/20'
                  }`}>
                    <Moon className={ritualStatuses.evening.isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'} size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Avond</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {ritualStatuses.evening.isComplete ? 'Afgerond' : !ritualStatuses.evening.isAvailable ? 'Vanaf 17:00' : 'Reflectie'}
                    </p>
                  </div>
                </div>
                {ritualStatuses.evening.isComplete ? (
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <ChevronRight className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" size={18} />
                )}
              </Link>

              {/* Weekend: Week Review */}
              {dayType === 'weekend' && (
                <Link
                  href="/weekly-review"
                  className={`flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border transition-colors group ${
                    ritualStatuses.weeklyReview.isComplete
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      ritualStatuses.weeklyReview.isComplete
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-purple-50 dark:bg-purple-900/20'
                    }`}>
                      <BookOpen className={ritualStatuses.weeklyReview.isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'} size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Week Review</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {ritualStatuses.weeklyReview.isComplete ? 'Afgerond' : 'Evalueer je week'}
                      </p>
                    </div>
                  </div>
                  {ritualStatuses.weeklyReview.isComplete ? (
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <ChevronRight className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" size={18} />
                  )}
                </Link>
              )}
            </div>
          </section>

          {/* Recent Wins */}
          {recentWins.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Recente Wins
                </h2>
                <Link href="/wins" className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Alles bekijken
                </Link>
              </div>
              <div className="space-y-2">
                {recentWins.map((win) => (
                  <div
                    key={win.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{win.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(win.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: win.impact_level }).map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-slate-900 dark:bg-white rounded-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quick Links */}
          <section className="mb-8">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Tools
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                href="/goals"
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-center"
              >
                <Target className="mx-auto text-slate-600 dark:text-slate-400 mb-2" size={20} />
                <p className="text-sm font-medium text-slate-900 dark:text-white">Doelen</p>
              </Link>
              <Link
                href="/focus"
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-center"
              >
                <Calendar className="mx-auto text-slate-600 dark:text-slate-400 mb-2" size={20} />
                <p className="text-sm font-medium text-slate-900 dark:text-white">Focus</p>
              </Link>
              <Link
                href="/wins"
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-center"
              >
                <Trophy className="mx-auto text-slate-600 dark:text-slate-400 mb-2" size={20} />
                <p className="text-sm font-medium text-slate-900 dark:text-white">Wins</p>
              </Link>
              <Link
                href="/insights"
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-center"
              >
                <BarChart3 className="mx-auto text-slate-600 dark:text-slate-400 mb-2" size={20} />
                <p className="text-sm font-medium text-slate-900 dark:text-white">Insights</p>
              </Link>
            </div>
          </section>

          {/* Courses Section */}
          <section className="mb-8">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Leren & Groeien
            </h2>
            <Link
              href="/courses"
              className="block p-4 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Flame className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Tony Robbins Cursussen</p>
                    <p className="text-sm text-white/80">Unleash Your Power - Transformeer je leven</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-white/20 rounded-full text-xs text-white">
                    <GraduationCap size={14} className="inline mr-1" />
                    12 weken
                  </div>
                  <ChevronRight className="text-white/70 group-hover:text-white transition-colors" size={18} />
                </div>
              </div>
            </Link>
          </section>

          {/* Identity Section */}
          <section className="mb-8">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Identiteit & State
            </h2>
            <Link
              href="/identity"
              className="block p-4 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-700 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <Shield className="text-amber-400" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Mijn Identiteit</p>
                    <p className="text-sm text-white/70">Claim wie je bent. Bewijs het.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">
                    Tony Robbins
                  </div>
                  <ChevronRight className="text-white/50 group-hover:text-white/80 transition-colors" size={18} />
                </div>
              </div>
            </Link>
          </section>
        </main>
      </div>
    </RitualGuard>
  );
}
