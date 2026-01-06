'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { TrendChart, DonutChart, ProgressRing } from '@/components/insights/trend-chart';

interface AnalyticsData {
  summary: {
    thisWeek: { avgEnergy: number; avgSleep: number; totalWins: number; ritualsCompleted: number };
    lastWeek: { avgEnergy: number; avgSleep: number; totalWins: number; ritualsCompleted: number };
    changes: { energy: number; sleep: number; wins: number };
  };
  streaks: { current: number; longest: number; totalDays: number };
  trends: {
    energy: { date: string; value: number }[];
    sleep: { date: string; value: number }[];
  };
  wins: {
    total: number;
    byCategory: Record<string, number>;
    recent: any[];
    avgImpact: number;
  };
  patterns: {
    bestDays: { day: string; avgEnergy: number }[];
    wakeTimeImpact: { earlyAvgEnergy: number; lateAvgEnergy: number };
  };
  goals: any[];
  focusSessions: { total: number; completed: number };
  insights: string[];
}

const categoryColors: Record<string, string> = {
  business: '#374151',
  personal: '#6b7280',
  health: '#9ca3af',
  learning: '#d1d5db',
};

const categoryLabels: Record<string, string> = {
  business: 'Business',
  personal: 'Persoonlijk',
  health: 'Gezondheid',
  learning: 'Leren',
};

export default function InsightsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics?days=30', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch analytics');
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      console.error('Analytics error:', err);
      setError('Kon analytics niet laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!AuthService.isAuthenticated()) {
        router.push('/auth/login');
        return;
      }
      await fetchAnalytics();
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-900 dark:border-white border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{error || 'Er ging iets mis'}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg"
          >
            Opnieuw
          </button>
        </div>
      </div>
    );
  }

  const winCategories = Object.entries(data.wins.byCategory).map(([key, value]) => ({
    label: categoryLabels[key] || key,
    value: value as number,
    color: categoryColors[key] || '#6b7280',
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-semibold text-slate-900 dark:text-white">Insights</h1>
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Insights */}
        {data.insights.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Inzichten
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
              {data.insights.map((insight, i) => (
                <div key={i} className="p-4 text-sm text-slate-700 dark:text-slate-300">
                  {insight}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Week Stats */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Deze week
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Energie"
              value={data.summary.thisWeek.avgEnergy.toFixed(1)}
              change={data.summary.changes.energy}
              previousValue={data.summary.lastWeek.avgEnergy.toFixed(1)}
            />
            <StatCard
              label="Slaap"
              value={data.summary.thisWeek.avgSleep.toFixed(1)}
              change={data.summary.changes.sleep}
              previousValue={data.summary.lastWeek.avgSleep.toFixed(1)}
            />
            <StatCard
              label="Wins"
              value={data.summary.thisWeek.totalWins.toString()}
              change={data.summary.changes.wins}
              previousValue={data.summary.lastWeek.totalWins.toString()}
            />
            <StatCard
              label="Streak"
              value={`${data.streaks.current}d`}
              subtext={`Record: ${data.streaks.longest}d`}
            />
          </div>
        </section>

        {/* Trends */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Trends (14 dagen)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Energie</p>
              <TrendChart data={data.trends.energy} color="#374151" height={120} />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Slaap</p>
              <TrendChart data={data.trends.sleep} color="#6b7280" height={120} />
            </div>
          </div>
        </section>

        {/* Patterns */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Patronen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Best Days */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Beste dagen</p>
              <div className="space-y-3">
                {data.patterns.bestDays.slice(0, 4).map((day, i) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{day.day}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 dark:bg-white rounded-full"
                          style={{ width: `${(day.avgEnergy / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white w-6">{day.avgEnergy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wake Time */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Opstaan impact</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Voor 07:00</span>
                    <span className="font-medium text-slate-900 dark:text-white">{data.patterns.wakeTimeImpact.earlyAvgEnergy.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 dark:bg-white rounded-full"
                      style={{ width: `${(data.patterns.wakeTimeImpact.earlyAvgEnergy / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Na 07:00</span>
                    <span className="font-medium text-slate-900 dark:text-white">{data.patterns.wakeTimeImpact.lateAvgEnergy.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-400 dark:bg-slate-600 rounded-full"
                      style={{ width: `${(data.patterns.wakeTimeImpact.lateAvgEnergy / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Wins by Category */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Wins per categorie</p>
              {winCategories.length > 0 ? (
                <div className="space-y-3">
                  {winCategories.map((cat) => (
                    <div key={cat.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{cat.label}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{cat.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Geen wins</p>
              )}
            </div>
          </div>
        </section>

        {/* Summary */}
        <section>
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Totaal
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{data.streaks.totalDays}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">dagen gelogd</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{data.wins.total}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">wins behaald</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{data.streaks.longest}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">langste streak</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{data.focusSessions.completed}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">focus sessies</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  previousValue,
  subtext,
}: {
  label: string;
  value: string;
  change?: number;
  previousValue?: string;
  subtext?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          {change > 0 ? (
            <TrendingUp size={12} className="text-emerald-500" />
          ) : change < 0 ? (
            <TrendingDown size={12} className="text-red-500" />
          ) : null}
          <span className={`text-xs ${change > 0 ? 'text-emerald-500' : change < 0 ? 'text-red-500' : 'text-slate-400'}`}>
            {change > 0 ? '+' : ''}{change} vs {previousValue}
          </span>
        </div>
      )}
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  );
}
