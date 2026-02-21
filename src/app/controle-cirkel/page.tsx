'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Circle, CheckCircle2 } from 'lucide-react';
import { AuthService } from '@/lib/auth';

type FlowStep = 'probleem' | 'analyse' | 'actie' | 'loslaten' | 'opgeslagen';

interface ControleEntry {
  id: string;
  timestamp: string;
  data: {
    probleem: string;
    mijn_kant: string[];
    niet_mijn_kant: string[];
    gekozen_actie: string;
    losgelaten: boolean;
  };
}

export default function ControleCircelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<FlowStep>('probleem');
  const [entries, setEntries] = useState<ControleEntry[]>([]);

  const [probleem, setProbleem] = useState('');
  const [mijnKant, setMijnKant] = useState<string[]>([]);
  const [nietMijnKant, setNietMijnKant] = useState<string[]>([]);
  const [newMijn, setNewMijn] = useState('');
  const [newNiet, setNewNiet] = useState('');
  const [gekozenActie, setGekozenActie] = useState('');
  const [loslatenDone, setLoslatenDone] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

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
      const res = await fetch('/api/controle-cirkel', {
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

  const addMijn = () => {
    if (!newMijn.trim()) return;
    setMijnKant((prev) => [...prev, newMijn.trim()]);
    setNewMijn('');
  };

  const addNiet = () => {
    if (!newNiet.trim()) return;
    setNietMijnKant((prev) => [...prev, newNiet.trim()]);
    setNewNiet('');
  };

  const handleSaveAndCommit = async () => {
    if (!gekozenActie.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/controle-cirkel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AuthService.getToken()}`,
        },
        body: JSON.stringify({
          probleem,
          mijn_kant: mijnKant,
          niet_mijn_kant: nietMijnKant,
          gekozen_actie: gekozenActie,
          losgelaten: false,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setSavedId(saved.id);
        setStep('loslaten');
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLoslaten = async () => {
    if (!savedId) return;
    setLoslatenDone(true);
    try {
      await fetch(`/api/controle-cirkel/${savedId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AuthService.getToken()}`,
        },
        body: JSON.stringify({ losgelaten: true }),
      });
    } catch (err) {
      console.error('Loslaten error:', err);
    }

    setTimeout(async () => {
      await fetchEntries();
      setStep('opgeslagen');
      setProbleem('');
      setMijnKant([]);
      setNietMijnKant([]);
      setGekozenActie('');
      setLoslatenDone(false);
      setSavedId(null);
    }, 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  // Loslaten ceremony
  if (step === 'loslaten') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8">
          {!loslatenDone ? (
            <>
              <div className="space-y-4">
                <p className="text-white/50 text-sm uppercase tracking-widest">Jouw actie</p>
                <p className="text-xl text-white font-medium">"{gekozenActie}"</p>
              </div>

              <div className="space-y-2">
                <p className="text-slate-400">Dit laat je los:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {nietMijnKant.map((item, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleLoslaten}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-medium text-lg hover:opacity-90 transition-opacity"
              >
                Commit & Laat los
              </button>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-6xl">🌿</div>
              <p className="text-2xl text-white font-light">
                Je hebt gedaan wat je kon.
              </p>
              <p className="text-slate-400 text-lg">
                De rest is niet van jou.
              </p>
              {/* Fading out items */}
              <div className="flex flex-wrap gap-2 justify-center">
                {nietMijnKant.map((item, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-slate-700 text-slate-500 rounded-full text-sm transition-all duration-1000"
                    style={{ opacity: 0.2 }}
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent mx-auto mt-4" />
            </div>
          )}
        </div>
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
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Circle className="text-emerald-600 dark:text-emerald-400" size={16} />
            </div>
            <h1 className="font-semibold text-slate-900 dark:text-white">Controle-Cirkel</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {step === 'opgeslagen' && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <p className="text-emerald-800 dark:text-emerald-200 font-medium">✓ Analyse opgeslagen. Goed gedaan.</p>
            <button
              onClick={() => setStep('probleem')}
              className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 underline"
            >
              Nieuwe analyse starten
            </button>
          </div>
        )}

        {/* Step 1: Probleem */}
        {(step === 'probleem' || step === 'opgeslagen') && step === 'probleem' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-1">Wat kost je nu energie?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Schrijf het probleem of de situatie op.</p>
            <textarea
              value={probleem}
              onChange={(e) => setProbleem(e.target.value)}
              placeholder="Beschrijf de situatie..."
              rows={3}
              className="w-full resize-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:focus:ring-emerald-700 text-sm"
            />
            {probleem.trim() && (
              <button
                onClick={() => setStep('analyse')}
                className="mt-4 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                Analyseer →
              </button>
            )}
          </div>
        )}

        {/* Step 2: Analyse */}
        {step === 'analyse' && (
          <div className="space-y-4">
            <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="font-medium text-slate-900 dark:text-white mb-1">Situatie:</p>
              <p>{probleem}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mijn kant */}
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5">
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Mijn kant</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mb-4">Wat KAN jij beïnvloeden?</p>

                <div className="flex gap-2 mb-3">
                  <input
                    value={newMijn}
                    onChange={(e) => setNewMijn(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addMijn()}
                    placeholder="Voeg item toe..."
                    className="flex-1 px-3 py-2 bg-white dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={addMijn}
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {mijnKant.map((item, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded-full text-sm"
                    >
                      {item}
                      <button onClick={() => setMijnKant((prev) => prev.filter((_, j) => j !== i))}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Niet mijn kant */}
              <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Niet mijn kant</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Wat is BUITEN jouw controle?</p>

                <div className="flex gap-2 mb-3">
                  <input
                    value={newNiet}
                    onChange={(e) => setNewNiet(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNiet()}
                    placeholder="Voeg item toe..."
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <button
                    onClick={addNiet}
                    className="p-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {nietMijnKant.map((item, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-sm"
                    >
                      {item}
                      <button onClick={() => setNietMijnKant((prev) => prev.filter((_, j) => j !== i))}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {mijnKant.length > 0 && (
              <button
                onClick={() => setStep('actie')}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                Kies één actie →
              </button>
            )}
          </div>
        )}

        {/* Step 3: Actie */}
        {step === 'actie' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-1">Kies ÉÉN actie van jouw kant.</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Focus op wat je kunt doen.</p>

            <div className="space-y-2 mb-5">
              {mijnKant.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setGekozenActie(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    gekozenActie === item
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {gekozenActie === item ? (
                    <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-slate-400 flex-shrink-0" />
                  )}
                  <span className="text-sm text-slate-800 dark:text-white">{item}</span>
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="text-xs text-slate-500 mb-1 block">Of schrijf een eigen actie:</label>
              <input
                value={gekozenActie}
                onChange={(e) => setGekozenActie(e.target.value)}
                placeholder="Eigen actie..."
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            {gekozenActie.trim() && (
              <button
                onClick={handleSaveAndCommit}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Opslaan...' : 'Commit aan deze actie →'}
              </button>
            )}
          </div>
        )}

        {/* History */}
        {entries.length > 0 && step === 'opgeslagen' && (
          <section>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Eerdere Analyses
            </h2>
            <div className="space-y-3">
              {entries.map((entry) => {
                const d = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data;
                return (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-xl border ${
                      d.losgelaten
                        ? 'bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                          {d.probleem}
                        </p>
                        {d.gekozen_actie && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            Actie: {d.gekozen_actie}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(entry.timestamp).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      {d.losgelaten && (
                        <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-full">
                          losgelaten
                        </span>
                      )}
                    </div>
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
