'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Target, Calendar, TrendingUp, Users, LogOut, LucideIcon, Sunrise, Moon, CalendarDays, BookOpen } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';

interface ActivityItem {
  id: number;
  type: string;
  title: string;
  timestamp: string;
  icon: LucideIcon;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({
    activeGoals: 0,
    weeklyProgress: 0,
    productivity: 0
  });
  const router = useRouter();

  // Utility functions
  const calculateWeeklyProgress = (focusSessions: any[]) => {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekSessions = focusSessions.filter(session =>
      new Date(session.createdAt) >= weekStart
    );

    const totalPlanned = thisWeekSessions.reduce((sum, session) => sum + (session.duration || 25), 0);
    const totalCompleted = thisWeekSessions
      .filter(session => session.status === 'completed')
      .reduce((sum, session) => sum + (session.duration || 25), 0);

    return totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
  };

  const calculateProductivity = (logs: any[]) => {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekLogs = logs.filter(log =>
      new Date(log.createdAt) >= weekStart
    );

    if (thisWeekLogs.length === 0) return 0;

    const avgProductivity = thisWeekLogs.reduce((sum, log) => sum + (log.productivity || 0), 0) / thisWeekLogs.length;
    return Math.round(avgProductivity);
  };

  const processRecentActivity = (logs: any[]): ActivityItem[] => {
    return logs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(log => ({
        id: log.id,
        type: log.type || 'goal',
        title: log.title || log.description || 'Activiteit',
        timestamp: new Date(log.createdAt).toLocaleString('nl-NL'),
        icon: log.type === 'goal' ? Target : log.type === 'focus' ? Calendar : TrendingUp
      }));
  };

  const fetchDashboardData = async (retryCount = 0) => {
    try {
      setStatsLoading(true);

      // Fetch all data in parallel with timeout
      const fetchWithTimeout = (promise: Promise<any>, timeout = 5000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
      };

      const [goalsResponse, focusResponse, logsResponse] = await Promise.allSettled([
        fetchWithTimeout(api.goals.getAll()),
        fetchWithTimeout(api.focus.getAll()),
        fetchWithTimeout(api.logs.getAll())
      ]);

      // Process goals
      const activeGoals = goalsResponse.status === 'fulfilled'
        ? goalsResponse.value.filter((g: any) => g.status === 'active').length
        : 0;

      // Process focus sessions for weekly progress
      const weeklyProgress = focusResponse.status === 'fulfilled'
        ? calculateWeeklyProgress(focusResponse.value)
        : 0;

      // Process logs for productivity
      const productivity = logsResponse.status === 'fulfilled'
        ? calculateProductivity(logsResponse.value)
        : 0;

      setStats({
        activeGoals,
        weeklyProgress,
        productivity
      });

      // Process recent activity
      if (logsResponse.status === 'fulfilled') {
        setRecentActivity(processRecentActivity(logsResponse.value));
      }

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);

      // Retry logic
      if (retryCount < 2) {
        console.log(`Retrying dashboard data fetch (${retryCount + 1}/2)...`);
        setTimeout(() => fetchDashboardData(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }

      // Fallback to default values
      setStats({
        activeGoals: 0,
        weeklyProgress: 0,
        productivity: 0
      });
      setRecentActivity([]);
    } finally {
      setStatsLoading(false);
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

        // Fetch dashboard data
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
              Hier is je persoonlijke dashboard voor optimale productiviteit.
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
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">+12%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Recente Activiteit</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                    <Target size={14} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">Doel bereikt: Website lancering</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">2 uur geleden</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Calendar size={14} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">Focus sessie voltooid</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Vandaag 14:30</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Rituals */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Dagelijkse Rituelen</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/morning" className="p-4 bg-gradient-to-br from-orange-500 to-yellow-500 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 block text-center">
                  <Sunrise size={20} className="mb-2 mx-auto" />
                  Ochtend
                </Link>
                <Link href="/evening" className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 block text-center">
                  <Moon size={20} className="mb-2 mx-auto" />
                  Avond
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
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
  );
}