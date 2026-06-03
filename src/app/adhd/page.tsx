'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Brain, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { BottomNav } from '@/components/ui/bottom-nav';

const SYMPTOMS = [
  'Moeite met concentratie',
  'Vergeetachtigheid',
  'Hyperfocus',
  'Onrust in hoofd',
  'Onrust in lichaam',
  'Beweeglijkheid',
  'Snel praten',
  'Prikkelbaarheid',
  'Somberheid',
  'Stemmingswisselingen',
  'Impulsiviteit',
  'Agressiviteit',
  'Suïcidaliteit',
  'Vreetbuien',
];

const START_DATE = '2026-06-03';
const MAX_TOTAL = SYMPTOMS.length * 3; // 42

interface AdhdLog {
  date: string;
  scores: Record<string, number>;
  notes: string;
}

function dateRange(start: string, days: number): string[] {
  const result: string[] = [];
  const d = new Date(start);
  for (let i = 0; i < days; i++) {
    result.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return result;
}

function avgColor(avg: number): string {
  if (avg < 0.5) return '#00cc66';
  if (avg < 1.5) return '#f59e0b';
  if (avg < 2.5) return '#f97316';
  return '#ef4444';
}

function avgLabel(avg: number): string {
  if (avg < 0.5) return 'geen last';
  if (avg < 1.5) return 'zo nu en dan';
  if (avg < 2.5) return 'duidelijk/vaak';
  return 'continu';
}

function ScoreBar({ avg }: { avg: number }) {
  const pct = (avg / 3) * 100;
  const color = avgColor(avg);
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-[#f4f4f7] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[12px] font-semibold w-7 text-right" style={{ color }}>
        {avg.toFixed(1)}
      </span>
    </div>
  );
}

export default function AdhdPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AdhdLog[]>([]);
  const [activeWeek, setActiveWeek] = useState<1 | 2>(1);
  const router = useRouter();

  const fetchLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/adhd-logs?days=14', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Fetch ADHD logs error:', err);
    }
  }, []);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) { router.push('/auth/login'); return; }
    fetchLogs().finally(() => setLoading(false));
  }, [router, fetchLogs]);

  const week1Dates = dateRange(START_DATE, 7);
  const week2Dates = dateRange(
    new Date(new Date(START_DATE).getTime() + 7 * 86400000).toISOString().split('T')[0],
    7
  );
  const activeDates = activeWeek === 1 ? week1Dates : week2Dates;

  const weekLogs = logs.filter((l) => activeDates.includes(l.date));
  const loggedCount = weekLogs.length;

  const symptomAvgs: Record<string, number> = {};
  SYMPTOMS.forEach((s) => {
    if (loggedCount === 0) { symptomAvgs[s] = 0; return; }
    const total = weekLogs.reduce((sum, l) => sum + (l.scores[s] ?? 0), 0);
    symptomAvgs[s] = total / loggedCount;
  });

  const top5 = [...SYMPTOMS]
    .sort((a, b) => symptomAvgs[b] - symptomAvgs[a])
    .slice(0, 5);

  // Week-over-week trend
  const week1Logs = logs.filter((l) => week1Dates.includes(l.date));
  const week2Logs = logs.filter((l) => week2Dates.includes(l.date));
  const avgTotal = (wLogs: AdhdLog[]) =>
    wLogs.length === 0
      ? null
      : wLogs.reduce((sum, l) => sum + Object.values(l.scores).reduce((a, b) => a + b, 0), 0) /
        wLogs.length;
  const w1avg = avgTotal(week1Logs);
  const w2avg = avgTotal(week2Logs);
  const trend = w1avg !== null && w2avg !== null ? w2avg - w1avg : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#a78bfa] border-t-transparent animate-spin" />
      </div>
    );
  }

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
            <div>
              <h1 className="text-[17px] font-semibold text-[#0a0a14]">ADHD Klachten</h1>
              <p className="text-[11px] text-[#8a8a9a]">Meting voor medicatiestart</p>
            </div>
          </div>
          <Brain size={20} className="text-[#a78bfa]" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">

        {/* Week tabs */}
        <div className="flex gap-2 p-1 bg-[#f4f4f7] rounded-[14px]">
          {([1, 2] as const).map((w) => (
            <button
              key={w}
              onClick={() => setActiveWeek(w)}
              className={`flex-1 py-2.5 rounded-[11px] text-[13px] font-semibold transition-all ${
                activeWeek === w
                  ? 'bg-white text-[#0a0a14] shadow-sm'
                  : 'text-[#8a8a9a]'
              }`}
            >
              Week {w}
              <span className="text-[10px] font-normal ml-1">
                {w === 1 ? '3–9 jun' : '10–17 jun'}
              </span>
            </button>
          ))}
        </div>

        {/* Summary card */}
        <div className="rounded-[16px] bg-[#0a0a14] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[13px] text-white/50">Gelogd</p>
            <p className="text-[13px] text-white/50">
              {loggedCount === 0 && activeWeek === 2 ? 'Nog niet begonnen' : `${loggedCount} / 7 dagen`}
            </p>
          </div>
          {loggedCount > 0 && (
            <div className="flex items-end gap-3 mt-2">
              <div>
                <p className="text-[28px] font-bold text-white leading-none">
                  {(weekLogs.reduce((sum, l) => sum + Object.values(l.scores).reduce((a, b) => a + b, 0), 0) / loggedCount).toFixed(1)}
                </p>
                <p className="text-[11px] text-white/40 mt-0.5">gemiddelde dagscore</p>
              </div>
              <p className="text-[14px] text-white/30 pb-0.5">/ {MAX_TOTAL}</p>
              {trend !== null && activeWeek === 2 && (
                <div className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold ${
                  trend < -1 ? 'bg-[#f0fdf4] text-[#00cc66]' :
                  trend > 1 ? 'bg-[#fee2e2] text-[#ef4444]' :
                  'bg-[#f4f4f7] text-[#8a8a9a]'
                }`}>
                  {trend < -1 ? <TrendingDown size={13} /> : trend > 1 ? <TrendingUp size={13} /> : <Minus size={13} />}
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)} t.o.v. week 1
                </div>
              )}
            </div>
          )}
          {loggedCount === 0 && (
            <p className="text-[14px] text-white/60 mt-2">
              {activeWeek === 1
                ? 'Log elke ochtend via het Ochtend Ritueel.'
                : 'Week 2 begint op 10 juni.'}
            </p>
          )}
        </div>

        {/* Symptom averages */}
        {loggedCount > 0 && (
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <h2 className="text-[14px] font-semibold text-[#0a0a14] mb-4">
              Gemiddelde per klacht
            </h2>
            <div className="space-y-3">
              {SYMPTOMS.map((s) => {
                const avg = symptomAvgs[s];
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="text-[12px] text-[#0a0a14] w-36 flex-shrink-0 leading-tight">{s}</span>
                    <ScoreBar avg={avg} />
                    <span className="text-[10px] text-[#8a8a9a] w-20 text-right hidden sm:block">
                      {avgLabel(avg)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily scores */}
        {loggedCount > 0 && (
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <h2 className="text-[14px] font-semibold text-[#0a0a14] mb-4">Dagelijkse scores</h2>
            <div className="space-y-2">
              {activeDates.map((date) => {
                const log = weekLogs.find((l) => l.date === date);
                const d = new Date(date);
                const label = d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
                const isFuture = new Date(date) > new Date();
                if (isFuture) return null;

                return (
                  <div key={date} className="flex items-center gap-3">
                    <span className="text-[12px] text-[#8a8a9a] w-20 flex-shrink-0">{label}</span>
                    {log ? (
                      <>
                        <div className="flex-1 h-2 bg-[#f4f4f7] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(Object.values(log.scores).reduce((a, b) => a + b, 0) / MAX_TOTAL) * 100}%`,
                              backgroundColor: avgColor(Object.values(log.scores).reduce((a, b) => a + b, 0) / SYMPTOMS.length),
                            }}
                          />
                        </div>
                        <span className="text-[12px] font-medium text-[#0a0a14] w-12 text-right">
                          {Object.values(log.scores).reduce((a, b) => a + b, 0)}/{MAX_TOTAL}
                        </span>
                      </>
                    ) : (
                      <span className="text-[12px] text-[#c0c0cc] italic">niet gelogd</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top 5 */}
        {loggedCount > 0 && (
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <h2 className="text-[14px] font-semibold text-[#0a0a14] mb-3">Zwaarste klachten</h2>
            <div className="space-y-2">
              {top5.map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#f4f4f7] text-[10px] font-bold text-[#8a8a9a] flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-[13px] text-[#0a0a14] flex-1">{s}</span>
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: avgColor(symptomAvgs[s]) }}
                  >
                    {symptomAvgs[s].toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA to morning ritual */}
        {loggedCount === 0 && activeWeek === 1 && (
          <Link
            href="/morning"
            className="block rounded-[16px] bg-[#f5f3ff] border border-[#e9d5ff] p-5 text-center active:scale-[0.98] transition-transform"
          >
            <Brain size={24} className="text-[#a78bfa] mx-auto mb-2" />
            <p className="text-[14px] font-semibold text-[#0a0a14]">Start je eerste meting</p>
            <p className="text-[12px] text-[#8a8a9a] mt-1">Via het Ochtend Ritueel → stap 5</p>
          </Link>
        )}

        <p className="text-[11px] text-[#c0c0cc] text-center pb-2">
          Meetperiode: 3 juni – 17 juni 2026 · Voor start Ritalin
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
