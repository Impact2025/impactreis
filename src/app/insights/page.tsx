'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { TrendChart, DonutChart, ProgressRing } from '@/components/insights/trend-chart';
import { BottomNav } from '@/components/ui/bottom-nav';

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

const categoryLabels: Record<string, string> = {
  business: 'Business',
  personal: 'Persoonlijk',
  health: 'Gezondheid',
  learning: 'Leren',
};

function StatCard({ label, value, change, previousValue, subtext }: {
  label: string;
  value: string;
  change?: number;
  previousValue?: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-[16px] border border-[#e8e8ec] bg-[#ffffff] p-4">
      <p className="text-[11px] font-medium text-[#8a8a9a] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-[24px] font-semibold text-[#0a0a14] leading-none mb-1">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-1.5">
          {change > 0 ? (
            <TrendingUp size={11} className="text-[#00cc66]" />
          ) : change < 0 ? (
            <TrendingDown size={11} className="text-red-500" />
          ) : null}
          <span className={`text-[11px] font-medium ${change > 0 ? 'text-[#00cc66]' : change < 0 ? 'text-red-500' : 'text-[#8a8a9a]'}`}>
            {change > 0 ? '+' : ''}{change}
            {previousValue && <span className="text-[#8a8a9a] font-normal"> vs {previousValue}</span>}
          </span>
        </div>
      )}
      {subtext && <p className="text-[11px] text-[#8a8a9a] mt-1">{subtext}</p>}
    </div>
  );
}

export default function InsightsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/analytics?days=30', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      setData(await response.json());
    } catch (err) {
      console.error('Analytics error:', err);
      setError('Kon analytics niet laden');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
  };

  useEffect(() => {
    if (!AuthService.isAuthenticated()) { router.push('/auth/login'); return; }
    fetchAnalytics();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#00cc66] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center pb-28">
        <div className="text-center px-5">
          <p className="text-[14px] text-[#8a8a9a] mb-4">{error || 'Er ging iets mis'}</p>
          <button
            onClick={fetchAnalytics}
            className="px-6 py-3 bg-[#00cc66] text-white rounded-full text-[14px] font-semibold active:scale-95 transition-transform"
          >
            Opnieuw proberen
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const winCategories = Object.entries(data.wins.byCategory).map(([key, value]) => ({
    label: categoryLabels[key] || key,
    value: value as number,
  }));

  return (
    <div className="min-h-screen bg-[#ffffff] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#ffffff] border-b border-[#e8e8ec]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f4f4f7] transition-colors"
            >
              <ArrowLeft size={18} className="text-[#0a0a14]" />
            </Link>
            <h1 className="text-[17px] font-semibold text-[#0a0a14]">Insights</h1>
          </div>
          <button
            onClick={handleRefresh}
            className={`w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f4f4f7] transition-colors ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={16} className="text-[#8a8a9a]" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5 space-y-6">
        {/* Inzichten */}
        {data.insights.length > 0 && (
          <section>
            <p className="text-[11px] font-medium text-[#8a8a9a] uppercase tracking-wider mb-3">Inzichten</p>
            <div className="rounded-[16px] border border-[#e8e8ec] overflow-hidden">
              {data.insights.map((insight, i) => (
                <div
                  key={i}
                  className="px-5 py-3.5 text-[13px] text-[#0a0a14] leading-relaxed border-b border-[#e8e8ec] last:border-b-0"
                  style={{ borderLeftWidth: '2px', borderLeftColor: '#00cc66', paddingLeft: '16px' }}
                >
                  {insight}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Deze week — 2x2 grid */}
        <section>
          <p className="text-[11px] font-medium text-[#8a8a9a] uppercase tracking-wider mb-3">Deze week</p>
          <div className="grid grid-cols-2 gap-3">
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

        {/* Trends charts */}
        <section>
          <p className="text-[11px] font-medium text-[#8a8a9a] uppercase tracking-wider mb-3">Trends (14 dagen)</p>
          <div className="space-y-3">
            <div className="rounded-[16px] border border-[#e8e8ec] bg-[#ffffff] p-5">
              <p className="text-[12px] font-medium text-[#8a8a9a] mb-4">Energie</p>
              <TrendChart data={data.trends.energy} color="#00cc66" height={100} />
            </div>
            <div className="rounded-[16px] border border-[#e8e8ec] bg-[#ffffff] p-5">
              <p className="text-[12px] font-medium text-[#8a8a9a] mb-4">Slaap</p>
              <TrendChart data={data.trends.sleep} color="#0a0a14" height={100} />
            </div>
          </div>
        </section>

        {/* Wins breakdown */}
        {winCategories.length > 0 && (
          <section>
            <p className="text-[11px] font-medium text-[#8a8a9a] uppercase tracking-wider mb-3">Wins per categorie</p>
            <div className="rounded-[16px] border border-[#e8e8ec] overflow-hidden">
              {winCategories.map((cat) => (
                <div
                  key={cat.label}
                  className="px-5 py-3.5 flex items-center justify-between border-b border-[#e8e8ec] last:border-b-0"
                >
                  <span className="text-[13px] font-medium text-[#0a0a14]">{cat.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-1.5 bg-[#f4f4f7] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00cc66] rounded-full"
                        style={{ width: `${Math.min(100, (cat.value / (data.wins.total || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[13px] font-semibold text-[#0a0a14] w-5 text-right">{cat.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Patronen */}
        {data.patterns.bestDays.length > 0 && (
          <section>
            <p className="text-[11px] font-medium text-[#8a8a9a] uppercase tracking-wider mb-3">Patronen</p>
            <div className="rounded-[16px] border border-[#e8e8ec] p-5">
              <p className="text-[12px] font-medium text-[#8a8a9a] mb-3">Beste dagen op energie</p>
              <div className="space-y-3">
                {data.patterns.bestDays.slice(0, 4).map((day) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <span className="text-[13px] text-[#0a0a14] capitalize w-20">{day.day}</span>
                    <div className="flex-1 mx-3">
                      <div className="h-1.5 bg-[#f4f4f7] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00cc66] rounded-full"
                          style={{ width: `${(day.avgEnergy / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold text-[#0a0a14] w-6 text-right">{day.avgEnergy}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Streak section */}
        <section>
          <p className="text-[11px] font-medium text-[#8a8a9a] uppercase tracking-wider mb-3">Streaks</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[16px] bg-[#fef3c7] border border-[#fef3c7] p-4 text-center">
              <p className="text-[22px] font-bold text-[#92400e]">{data.streaks.current}</p>
              <p className="text-[10px] font-medium text-[#92400e] mt-0.5">Huidige streak</p>
            </div>
            <div className="rounded-[16px] border border-[#e8e8ec] p-4 text-center">
              <p className="text-[22px] font-bold text-[#0a0a14]">{data.streaks.longest}</p>
              <p className="text-[10px] font-medium text-[#8a8a9a] mt-0.5">Langste streak</p>
            </div>
            <div className="rounded-[16px] border border-[#e8e8ec] p-4 text-center">
              <p className="text-[22px] font-bold text-[#0a0a14]">{data.streaks.totalDays}</p>
              <p className="text-[10px] font-medium text-[#8a8a9a] mt-0.5">Dagen gelogd</p>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
