'use client';

import { useEffect, useState } from 'react';
import { Target, TrendingUp } from 'lucide-react';

interface Lead {
  id: number;
  email: string;
  name: string | null;
  level: string;
  score: number;
  profile_key: string;
  weekly_hours_lost: number;
  monthly_hours_lost: number;
  created_at: string;
  unsubscribed: boolean;
}

interface Stats {
  total: number;
  new_7d: number;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/leads')
      .then((r) => r.json())
      .then((data) => {
        setLeads(data.leads ?? []);
        setStats(data.stats ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Totaal leads', value: stats?.total ?? 0, icon: Target },
    { label: 'Nieuw (7 dagen)', value: stats?.new_7d ?? 0, icon: TrendingUp },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">Leads</h1>
      <p className="text-sm text-ink-soft mb-6">Prospects uit de publieke Executive Reality Check.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-md">
        {cards.map((c) => (
          <div key={c.label} className="bg-surface-card border border-line rounded-xl p-5">
            <div className="flex items-center gap-2 text-ink-soft text-sm mb-3">
              <c.icon size={16} />
              {c.label}
            </div>
            <div className="text-xl font-bold text-ink">{c.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-soft">Laden...</p>
      ) : leads.length === 0 ? (
        <div className="bg-surface-card border border-line rounded-xl p-10 text-center text-ink-soft">
          <Target size={32} className="mx-auto mb-3 text-outline" />
          Nog geen leads.
        </div>
      ) : (
        <div className="bg-surface-card border border-line rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                <th className="px-5 py-3 font-medium">Naam</th>
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">Niveau</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Profiel</th>
                <th className="px-5 py-3 font-medium">Urenverlies/mnd</th>
                <th className="px-5 py-3 font-medium">Datum</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-3 font-medium text-ink">{l.name || '—'}</td>
                  <td className="px-5 py-3 text-ink-soft">{l.email}</td>
                  <td className="px-5 py-3 text-ink-soft">{l.level}</td>
                  <td className="px-5 py-3 text-ink-soft">{l.score}</td>
                  <td className="px-5 py-3 text-ink-soft">{l.profile_key}</td>
                  <td className="px-5 py-3 text-ink-soft">{l.monthly_hours_lost} uur</td>
                  <td className="px-5 py-3 text-ink-soft">{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
