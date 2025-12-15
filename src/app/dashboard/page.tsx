'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Target, Calendar, TrendingUp, LogOut, Sunrise, Moon, CalendarDays, BookOpen, Trophy, BarChart3 } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { Win } from '@/types';
import { RitualGuard } from '@/components/weekflow/ritual-guard';
import { RitualCard } from '@/components/weekflow/ritual-card';
import { getAllRitualStatuses, getDayType } from '@/lib/weekflow.service';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentWins, setRecentWins] = useState<Win[]>([]);
  const [stats, setStats] = useState({
    activeGoals: 0,
    weeklyProgress: 0,
    productivity: 0
  });
  const router = useRouter();

  // Get ritual statuses
  const ritualStatuses = getAllRitualStatuses();
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

      // Process goals
      const activeGoals = goalsResponse.status === 'fulfilled'
        ? goalsResponse.value.filter((g: any) => g.status === 'active').length
        : 0;

      // Process weekly progress (simplified)
      const weeklyProgress = focusResponse.status === 'fulfilled'
        ? Math.min(100, focusResponse.value.length * 10)
        : 0;

      setStats({
        activeGoals,
        weeklyProgress,
        productivity: 12
      });

      // Process recent wins (top 3)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <RitualGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center">
                <Brain className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Mijn OS</h1>
                <p className="text-sm text-slate-500">Personal OS voor Hoogbegaafden</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <LogOut size={16} />
              Uitloggen
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                Welkom terug, {user?.email?.split('@')[0] || 'Gebruiker'}!
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {dayType === 'weekend' ? 'Geniet van je weekend en sluit de week goed af.' : 'Maak er een productieve dag van!'}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <Target className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Actieve Doelen</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.activeGoals}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                    <Calendar className="text-green-600 dark:text-green-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Deze Week</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.weeklyProgress}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="text-purple-600 dark:text-purple-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Productiviteit</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">+{stats.productivity}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Wins */}
            {recentWins.length > 0 && (
              <div className="mb-8">
                <div className="bg-gradient-to-br from-amber-50 to-gold-50 dark:from-amber-950/30 dark:to-gold-950/30 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center">
                        <Trophy className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Recente Wins</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Jouw laatste successen</p>
                      </div>
                    </div>
                    <Link
                      href="/wins"
                      className="text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                    >
                      Bekijk alle →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentWins.map((win) => {
                      const categoryConfig = {
                        business: { icon: '💼', color: 'emerald' },
                        personal: { icon: '⭐', color: 'amber' },
                        health: { icon: '❤️', color: 'rose' },
                        learning: { icon: '📚', color: 'indigo' },
                      };
                      const config = categoryConfig[win.category];

                      return (
                        <div
                          key={win.id}
                          className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{config.icon}</span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                                {win.title}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {new Date(win.date).toLocaleDateString('nl-NL')}
                              </p>
                              <div className="flex gap-0.5 mt-2">
                                {Array.from({ length: win.impact_level }).map((_, i) => (
                                  <span key={i} className="text-xs">⭐</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Ritual Cards - Context-Aware Layout */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                {dayType === 'weekend' ? 'Weekend Rituelen' : dayType === 'monday' ? 'Start Je Week' : 'Dagelijkse Rituelen'}
              </h3>

              {/* Weekday Layout (Monday-Friday) */}
              {(dayType === 'weekday' || dayType === 'monday') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Monday: Show Weekly Start */}
                  {dayType === 'monday' && (
                    <RitualCard
                      title="Week Start"
                      description="Plan je week met focus en intentie"
                      icon={CalendarDays}
                      path="/weekly-start"
                      isComplete={ritualStatuses.weeklyStart.isComplete}
                      isAvailable={ritualStatuses.weeklyStart.isAvailable}
                      gradient="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800"
                    />
                  )}

                  {/* Morning Ritual */}
                  <RitualCard
                    title="Ochtend Ritueel"
                    description="Begin je dag met focus en intentie"
                    icon={Sunrise}
                    path="/morning"
                    isComplete={ritualStatuses.morning.isComplete}
                    isAvailable={ritualStatuses.morning.isAvailable}
                    gradient="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800"
                  />

                  {/* Evening Ritual */}
                  <RitualCard
                    title="Avond Ritueel"
                    description="Sluit je dag af met reflectie"
                    icon={Moon}
                    path="/evening"
                    isComplete={ritualStatuses.evening.isComplete}
                    isAvailable={ritualStatuses.evening.isAvailable}
                    unavailableReason="Beschikbaar na 17:00"
                    gradient="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800"
                  />
                </div>
              )}

              {/* Weekend Layout (Saturday-Sunday) */}
              {dayType === 'weekend' && (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-xl">
                  <RitualCard
                    title="Week Review"
                    description="Sluit je week af met reflectie en inzichten"
                    icon={BarChart3}
                    path="/weekly-review"
                    isComplete={ritualStatuses.weeklyReview.isComplete}
                    isAvailable={ritualStatuses.weeklyReview.isAvailable}
                    gradient="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800"
                  />
                </div>
              )}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Productiviteit Tools */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Productiviteit</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/goals" className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 block text-center">
                    <Target size={20} className="mb-2 mx-auto" />
                    Doelen
                  </Link>
                  <Link href="/focus" className="p-4 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 block text-center">
                    <Calendar size={20} className="mb-2 mx-auto" />
                    Focus
                  </Link>
                  <Link href="/wins" className="p-4 bg-gradient-to-br from-amber-500 to-gold-600 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 block text-center col-span-2">
                    <Trophy size={20} className="mb-2 mx-auto" />
                    Wall of Wins
                  </Link>
                </div>
              </div>

              {/* Weekly Planning */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Week Planning</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/weekly-start" className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 block text-center">
                    <CalendarDays size={20} className="mb-2 mx-auto" />
                    Week Start
                  </Link>
                  <Link href="/weekly-review" className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 block text-center">
                    <BookOpen size={20} className="mb-2 mx-auto" />
                    Week Review
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RitualGuard>
  );
}
