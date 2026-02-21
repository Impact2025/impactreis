'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Brain, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { AuthService } from '@/lib/auth';

type FlowStep = 'verhaal' | 'feiten' | 'inzicht' | 'opgeslagen';

interface ReflectieEntry {
  id: string;
  date_string: string;
  timestamp: string;
  data: {
    situatie: string;
    verhaal?: string;
    feiten?: string;
    inzicht?: string;
  };
}

const HELPER_VRAGEN = [
  'Is dit wat echt is gebeurd, of wat ik denk dat het betekent?',
  'Kan ik dit bewijzen?',
  'Wat is het feit, zonder mijn emotie?',
];

export default function ReflectiePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<FlowStep>('verhaal');
  const [entries, setEntries] = useState<ReflectieEntry[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const [situatie, setSituatie] = useState('');
  const [feiten, setFeiten] = useState('');
  const [inzicht, setInzicht] = useState('');

  useEffect(() => {
    const user = AuthService.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchEntries();
  }, [router]);

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/reflectie', {
        headers: { Authorization: `Bearer ${AuthService.getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!situatie.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/reflectie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AuthService.getToken()}`,
        },
        body: JSON.stringify({
          situatie,
          verhaal: situatie,
          feiten,
          inzicht,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      if (res.ok) {
        await fetchEntries();
        setSituatie('');
        setFeiten('');
        setInzicht('');
        setStep('verhaal');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/reflectie/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${AuthService.getToken()}` },
      });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <Brain className="text-indigo-600 dark:text-indigo-400" size={16} />
            </div>
            <h1 className="font-semibold text-slate-900 dark:text-white">Feiten vs. Verhalen</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* New Entry Flow */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Step 1: Verhaal */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center">V</span>
              <h2 className="font-medium text-slate-900 dark:text-white">Verhaal-modus</h2>
              <span className="text-xs text-slate-400 ml-auto">Emoties mogen hier</span>
            </div>
            <textarea
              value={situatie}
              onChange={(e) => setSituatie(e.target.value)}
              placeholder="Wat speelt er? Schrijf het op zoals het voelt..."
              rows={4}
              className="w-full resize-none bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-800 text-sm leading-relaxed"
            />
            {situatie.trim() && step === 'verhaal' && (
              <button
                onClick={() => setStep('feiten')}
                className="mt-3 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Door de feitenfilter →
              </button>
            )}
          </div>

          {/* Step 2: Feiten */}
          {(step === 'feiten' || step === 'inzicht') && (
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">F</span>
                <h2 className="font-medium text-slate-900 dark:text-white">Feiten-filter</h2>
              </div>

              <div className="mb-4 space-y-1">
                {HELPER_VRAGEN.map((v, i) => (
                  <p key={i} className="text-xs text-slate-500 dark:text-slate-400 flex gap-2">
                    <span className="text-blue-400">→</span> {v}
                  </p>
                ))}
              </div>

              <textarea
                value={feiten}
                onChange={(e) => setFeiten(e.target.value)}
                placeholder="Herschrijf dit als feiten. Geen interpretaties, geen oordelen..."
                rows={4}
                className="w-full resize-none bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl px-4 py-3 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-800 text-sm leading-relaxed"
              />
              {feiten.trim() && step === 'feiten' && (
                <button
                  onClick={() => setStep('inzicht')}
                  className="mt-3 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Inzicht toevoegen →
                </button>
              )}
            </div>
          )}

          {/* Step 3: Inzicht */}
          {step === 'inzicht' && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center">I</span>
                <h2 className="font-medium text-slate-900 dark:text-white">Inzicht</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Wat voel je nu je de feiten ziet?
              </p>
              <textarea
                value={inzicht}
                onChange={(e) => setInzicht(e.target.value)}
                placeholder="Kort, eerlijk, helder..."
                rows={3}
                className="w-full resize-none bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl px-4 py-3 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-800 text-sm leading-relaxed"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-3 w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Opslaan...' : 'Opslaan & Afsluiten'}
              </button>
            </div>
          )}
        </div>

        {/* History */}
        {entries.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Eerdere Reflecties
            </h2>
            <div className="space-y-3">
              {entries.map((entry) => {
                const d = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data;
                const isExpanded = expandedEntry === entry.id;
                const firstSentence = d.situatie?.split(/[.!?]/)[0] ?? '';

                return (
                  <div
                    key={entry.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">
                          {firstSentence}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(entry.timestamp).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {d.feiten && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                            gefilterd
                          </span>
                        )}
                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div>
                          <p className="text-xs text-red-500 font-medium mb-1">Verhaal</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{d.situatie}</p>
                        </div>
                        {d.feiten && (
                          <div>
                            <p className="text-xs text-blue-500 font-medium mb-1">Feiten</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{d.feiten}</p>
                          </div>
                        )}
                        {d.inzicht && (
                          <div>
                            <p className="text-xs text-emerald-500 font-medium mb-1">Inzicht</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{d.inzicht}</p>
                          </div>
                        )}
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                          Verwijderen
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
