'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { BottomNav } from '@/components/ui/bottom-nav';

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

const STEP_ORDER: FlowStep[] = ['probleem', 'analyse', 'actie', 'loslaten'];

function stepIndex(step: FlowStep): number {
  return STEP_ORDER.indexOf(step);
}

export default function ControleCircelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<FlowStep>('probleem');
  const [entries, setEntries] = useState<ControleEntry[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

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
    if (!user) { router.push('/auth/login'); return; }
    fetchEntries();
  }, [router]);

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/controle-cirkel', {
        headers: { Authorization: `Bearer ${AuthService.getToken()}` },
      });
      if (res.ok) setEntries(await res.json());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMijn = () => {
    if (!newMijn.trim()) return;
    setMijnKant(prev => [...prev, newMijn.trim()]);
    setNewMijn('');
  };

  const addNiet = () => {
    if (!newNiet.trim()) return;
    setNietMijnKant(prev => [...prev, newNiet.trim()]);
    setNewNiet('');
  };

  const handleSaveAndCommit = async () => {
    if (!gekozenActie.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/controle-cirkel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AuthService.getToken()}` },
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AuthService.getToken()}` },
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
    }, 2000);
  };

  const currentIndex = stepIndex(step);
  const totalSteps = STEP_ORDER.length;
  const progressPct = step === 'opgeslagen' ? 100 : ((currentIndex + 1) / totalSteps) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-card flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (step === 'loslaten') {
    return (
      <div className="min-h-screen bg-surface-inverse flex items-center justify-center px-5 pb-28">
        <div className="max-w-lg w-full text-center space-y-8">
          {!loslatenDone ? (
            <>
              <div className="space-y-3">
                <p className="text-[11px] text-white/40 uppercase tracking-widest">Jouw gekozen actie</p>
                <p className="text-[18px] text-white font-semibold leading-snug">&ldquo;{gekozenActie}&rdquo;</p>
              </div>
              {nietMijnKant.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[13px] text-white/40">Dit laat je los:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {nietMijnKant.map((item, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white/10 text-white/60 rounded-full text-[13px]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={handleLoslaten}
                className="w-full py-4 bg-primary text-white rounded-[16px] font-semibold text-[15px] active:scale-[0.98] transition-transform shadow-[0_4px_20px_rgba(81,96,80,0.4)]"
              >
                Commit &amp; Laat los
              </button>
            </>
          ) : (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-primary" />
              </div>
              <p className="text-[22px] text-white font-light">Je hebt gedaan wat je kon.</p>
              <p className="text-white/40 text-[16px]">De rest is niet van jou.</p>
              {nietMijnKant.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {nietMijnKant.map((item, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white/5 text-white/20 rounded-full text-[13px]">
                      {item}
                    </span>
                  ))}
                </div>
              )}
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-card pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-card border-b border-line">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-sunken transition-colors"
              >
                <ArrowLeft size={18} className="text-ink" />
              </Link>
              <h1 className="text-[17px] font-semibold text-ink">Controle Cirkel</h1>
            </div>
            {step !== 'opgeslagen' && (
              <span className="text-[12px] font-medium text-ink-soft bg-surface-sunken px-3 py-1 rounded-full">
                {currentIndex + 1}/{totalSteps}
              </span>
            )}
          </div>
          {step !== 'opgeslagen' && (
            <div className="h-1 w-full bg-surface-sunken rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">
        {/* Saved banner */}
        {step === 'opgeslagen' && (
          <div className="rounded-[16px] bg-primary/10 border border-primary/20 p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-ink">Analyse opgeslagen.</p>
              <button
                onClick={() => setStep('probleem')}
                className="text-[13px] text-primary font-medium mt-0.5"
              >
                Nieuwe analyse starten
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Probleem */}
        {step === 'probleem' && (
          <div className="space-y-3">
            <div className="rounded-[16px] bg-surface-inverse p-4">
              <p className="text-[13px] text-white/50 leading-relaxed">
                Schrijf op wat nu energie kost. Geen filter, geen oordeel. Gewoon eerlijk.
              </p>
            </div>
            <div className="rounded-[16px] border border-line p-5">
              <h2 className="text-[15px] font-semibold text-ink mb-1">Wat kost je energie?</h2>
              <p className="text-[12px] text-ink-soft mb-4">Beschrijf de situatie zo concreet mogelijk.</p>
              <textarea
                value={probleem}
                onChange={(e) => setProbleem(e.target.value)}
                placeholder="Beschrijf de situatie..."
                rows={5}
                className="w-full resize-none bg-surface-sunken border border-line rounded-[12px] px-4 py-3 text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary transition-colors"
              />
              {probleem.trim() && (
                <button
                  onClick={() => setStep('analyse')}
                  className="mt-4 w-full py-3 bg-primary text-white rounded-[12px] text-[14px] font-semibold active:scale-[0.98] transition-transform"
                >
                  Analyseer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Analyse */}
        {step === 'analyse' && (
          <div className="space-y-4">
            <div className="rounded-[12px] bg-surface-sunken px-4 py-3">
              <p className="text-[11px] text-ink-soft uppercase tracking-wider mb-1">Situatie</p>
              <p className="text-[13px] text-ink">{probleem}</p>
            </div>

            <div className="flex flex-col gap-3">
              {/* Mijn controle */}
              <div className="rounded-[16px] border border-primary/30 bg-primary/5 p-4">
                <p className="text-[14px] font-semibold text-primary mb-0.5">Mijn controle</p>
                <p className="text-[12px] text-ink-soft mb-3">Wat kan ik beïnvloeden?</p>
                <div className="flex gap-2 mb-3">
                  <input
                    value={newMijn}
                    onChange={(e) => setNewMijn(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addMijn()}
                    placeholder="Voeg toe..."
                    className="flex-1 min-w-0 px-3 py-3 bg-white border border-line rounded-[10px] text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary"
                  />
                  <button
                    onClick={addMijn}
                    className="w-11 h-11 bg-primary text-white rounded-[10px] flex items-center justify-center flex-shrink-0"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mijnKant.map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 text-ink rounded-full text-[12px] font-medium">
                      {item}
                      <button onClick={() => setMijnKant(prev => prev.filter((_, j) => j !== i))} className="flex items-center">
                        <X size={11} className="text-ink-soft" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Niet mijn controle */}
              <div className="rounded-[16px] border border-line bg-surface-sunken p-4">
                <p className="text-[14px] font-semibold text-ink-soft mb-0.5">Niet mijn controle</p>
                <p className="text-[12px] text-ink-soft mb-3">Wat is buiten mijn controle?</p>
                <div className="flex gap-2 mb-3">
                  <input
                    value={newNiet}
                    onChange={(e) => setNewNiet(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNiet()}
                    placeholder="Voeg toe..."
                    className="flex-1 min-w-0 px-3 py-3 bg-white border border-line rounded-[10px] text-[14px] text-ink placeholder-ink-soft outline-none focus:border-ink-soft"
                  />
                  <button
                    onClick={addNiet}
                    className="w-11 h-11 bg-ink-soft text-white rounded-[10px] flex items-center justify-center flex-shrink-0"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {nietMijnKant.map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-line text-ink-soft rounded-full text-[12px] font-medium">
                      {item}
                      <button onClick={() => setNietMijnKant(prev => prev.filter((_, j) => j !== i))} className="flex items-center">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('probleem')}
                className="flex-1 py-3 rounded-[12px] border border-line text-[14px] font-medium text-ink-soft active:scale-[0.98] transition-transform"
              >
                Terug
              </button>
              <button
                onClick={() => mijnKant.length > 0 && setStep('actie')}
                disabled={mijnKant.length === 0}
                className="flex-1 py-3 bg-primary text-white rounded-[12px] text-[14px] font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                Kies actie
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Actie */}
        {step === 'actie' && (
          <div className="space-y-4">
            <div className="rounded-[16px] border border-line p-5">
              <h2 className="text-[15px] font-semibold text-ink mb-1">Kies één actie van jouw kant.</h2>
              <p className="text-[12px] text-ink-soft mb-5">Focus op wat je kunt doen.</p>

              <div className="space-y-2 mb-5">
                {mijnKant.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setGekozenActie(item)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] border text-left transition-all ${
                      gekozenActie === item ? 'border-primary bg-primary/5' : 'border-line hover:border-primary/40'
                    }`}
                  >
                    {gekozenActie === item
                      ? <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                      : <Circle size={16} className="text-line flex-shrink-0" />
                    }
                    <span className="text-[13px] text-ink">{item}</span>
                  </button>
                ))}
              </div>

              <div className="mb-5">
                <label className="text-[11px] text-ink-soft mb-1.5 block">Of schrijf een eigen actie:</label>
                <input
                  value={gekozenActie}
                  onChange={(e) => setGekozenActie(e.target.value)}
                  placeholder="Eigen actie..."
                  className="w-full px-4 py-3 bg-surface-sunken border border-line rounded-[12px] text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('analyse')}
                  className="flex-1 py-3 rounded-[12px] border border-line text-[14px] font-medium text-ink-soft active:scale-[0.98] transition-transform"
                >
                  Terug
                </button>
                <button
                  onClick={handleSaveAndCommit}
                  disabled={!gekozenActie.trim() || saving}
                  className="flex-1 py-3 bg-primary text-white rounded-[12px] text-[14px] font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
                >
                  {saving ? 'Opslaan...' : 'Commit aan actie'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {step === 'opgeslagen' && entries.length > 0 && (
          <div className="space-y-3">
            <p className="text-[11px] font-medium text-ink-soft uppercase tracking-wider">Eerdere analyses</p>
            {entries.map((entry) => {
              const d = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data;
              const isExpanded = expandedEntry === entry.id;
              return (
                <div key={entry.id} className="rounded-[16px] border border-line overflow-hidden">
                  <button
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-ink truncate">{d.probleem}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-ink-soft">
                          {new Date(entry.timestamp).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                        </p>
                        {d.losgelaten && (
                          <span className="text-[10px] px-2 py-0.5 bg-surface-sunken text-ink-soft rounded-full">losgelaten</span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={15} className="text-ink-soft flex-shrink-0" /> : <ChevronDown size={15} className="text-ink-soft flex-shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4 border-t border-line pt-3 space-y-2">
                      {d.gekozen_actie && (
                        <div>
                          <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-1">Gekozen actie</p>
                          <p className="text-[13px] text-ink">{d.gekozen_actie}</p>
                        </div>
                      )}
                      {d.mijn_kant?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-ink-soft font-semibold uppercase tracking-wider mb-1">Mijn kant</p>
                          <div className="flex flex-wrap gap-1.5">
                            {d.mijn_kant.map((item: string, i: number) => (
                              <span key={i} className="text-[11px] px-2.5 py-1 bg-primary/10 text-ink rounded-full">{item}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
