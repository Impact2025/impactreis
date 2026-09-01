'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Brain, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { BottomNav } from '@/components/ui/bottom-nav';

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

const HELPER_FEITEN = [
  'Is dit wat echt is gebeurd?',
  'Kan ik dit bewijzen?',
  'Wat is het feit, zonder emotie?',
  'Wat denk ik dat het betekent?',
];

const STEP_ORDER: FlowStep[] = ['verhaal', 'feiten', 'inzicht'];

function stepIndex(step: FlowStep): number {
  return STEP_ORDER.indexOf(step);
}

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
    if (!user) { router.push('/auth/login'); return; }
    fetchEntries();
  }, [router]);

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/reflectie', {
        headers: { Authorization: `Bearer ${AuthService.getToken()}` },
      });
      if (res.ok) setEntries(await res.json());
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AuthService.getToken()}` },
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
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const currentIndex = step === 'opgeslagen' ? 3 : stepIndex(step);
  const progressPct = ((currentIndex + 1) / 3) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-card flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
              <h1 className="text-[17px] font-semibold text-ink">Reflectie</h1>
            </div>
            {step !== 'opgeslagen' && (
              <span className="text-[12px] font-medium text-ink-soft bg-surface-sunken px-3 py-1 rounded-full">
                {currentIndex + 1}/3
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
        {/* Step 1: Verhaal */}
        {(step === 'verhaal' || step === 'feiten' || step === 'inzicht') && (
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 'verhaal' ? 'bg-surface-inverse text-white' : 'bg-primary text-white'}`}>
                {step === 'verhaal' ? '1' : '✓'}
              </div>
              <span className="text-[13px] font-semibold text-ink">Verhaal</span>
              <span className="text-[11px] text-ink-soft ml-auto">Emoties mogen hier</span>
            </div>
            <textarea
              value={situatie}
              onChange={(e) => setSituatie(e.target.value)}
              placeholder="Beschrijf de situatie... Wat speelt er? Schrijf het op zoals het voelt."
              rows={step === 'verhaal' ? 5 : 3}
              disabled={step !== 'verhaal'}
              className={`w-full resize-none rounded-[12px] px-4 py-3 text-[14px] placeholder-ink-soft outline-none transition-colors ${
                step === 'verhaal'
                  ? 'bg-surface-sunken border border-line text-ink focus:border-primary'
                  : 'bg-surface-sunken/50 border border-transparent text-ink-soft cursor-default'
              }`}
            />
            {step === 'verhaal' && situatie.trim() && (
              <button
                onClick={() => setStep('feiten')}
                className="mt-3 w-full py-3 bg-primary text-white rounded-[12px] text-[14px] font-semibold active:scale-[0.98] transition-transform"
              >
                Door de feitenfilter
              </button>
            )}
          </div>
        )}

        {/* Step 2: Feiten */}
        {(step === 'feiten' || step === 'inzicht') && (
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 'feiten' ? 'bg-surface-inverse text-white' : 'bg-primary text-white'}`}>
                {step === 'feiten' ? '2' : '✓'}
              </div>
              <span className="text-[13px] font-semibold text-ink">Feiten</span>
            </div>

            {step === 'feiten' && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {HELPER_FEITEN.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setFeiten(prev => prev ? `${prev} ${v}` : v)}
                    className="bg-surface-sunken text-ink-soft text-[11px] rounded-full px-3 py-1 hover:bg-line transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}

            <textarea
              value={feiten}
              onChange={(e) => setFeiten(e.target.value)}
              placeholder="Wat zijn de feiten? Geen interpretaties, geen oordelen..."
              rows={step === 'feiten' ? 4 : 3}
              disabled={step !== 'feiten'}
              className={`w-full resize-none rounded-[12px] px-4 py-3 text-[14px] placeholder-ink-soft outline-none transition-colors ${
                step === 'feiten'
                  ? 'bg-surface-sunken border border-line text-ink focus:border-primary'
                  : 'bg-surface-sunken/50 border border-transparent text-ink-soft cursor-default'
              }`}
            />
            {step === 'feiten' && (
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setStep('verhaal')}
                  className="flex-1 py-3 rounded-[12px] border border-line text-[14px] font-medium text-ink-soft"
                >
                  Terug
                </button>
                <button
                  onClick={() => setStep('inzicht')}
                  disabled={!feiten.trim()}
                  className="flex-1 py-3 bg-primary text-white rounded-[12px] text-[14px] font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
                >
                  Inzicht
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Inzicht */}
        {step === 'inzicht' && (
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-surface-inverse text-white flex items-center justify-center text-[11px] font-bold">3</div>
              <span className="text-[13px] font-semibold text-ink">Inzicht</span>
            </div>
            <p className="text-[12px] text-ink-soft mb-3">Wat neem je hieruit mee?</p>
            <textarea
              value={inzicht}
              onChange={(e) => setInzicht(e.target.value)}
              placeholder="Wat voel je nu je de feiten ziet? Kort, eerlijk, helder..."
              rows={4}
              className="w-full resize-none bg-surface-sunken border border-line rounded-[12px] px-4 py-3 text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary transition-colors"
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setStep('feiten')}
                className="flex-1 py-3 rounded-[12px] border border-line text-[14px] font-medium text-ink-soft"
              >
                Terug
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-primary text-white rounded-[12px] text-[14px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {saving ? 'Opslaan...' : 'Opslaan & afsluiten'}
              </button>
            </div>
          </div>
        )}

        {/* Previous entries */}
        {entries.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-[11px] font-medium text-ink-soft uppercase tracking-wider">Eerdere reflecties</p>
            {entries.map((entry) => {
              const d = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data;
              const isExpanded = expandedEntry === entry.id;
              const preview = d.situatie?.split(/[.!?]/)[0] ?? '';
              return (
                <div key={entry.id} className="rounded-[16px] border border-line overflow-hidden">
                  <button
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-ink truncate">{preview}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-ink-soft">
                          {new Date(entry.timestamp).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {d.feiten && (
                          <span className="text-[10px] px-2 py-0.5 bg-surface-sunken text-ink-soft rounded-full">gefilterd</span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={15} className="text-ink-soft flex-shrink-0" /> : <ChevronDown size={15} className="text-ink-soft flex-shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4 border-t border-line pt-3 space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-1">Verhaal</p>
                        <p className="text-[13px] text-ink leading-relaxed">{d.situatie}</p>
                      </div>
                      {d.feiten && (
                        <div>
                          <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Feiten</p>
                          <p className="text-[13px] text-ink leading-relaxed">{d.feiten}</p>
                        </div>
                      )}
                      {d.inzicht && (
                        <div>
                          <p className="text-[10px] font-semibold text-ink uppercase tracking-wider mb-1">Inzicht</p>
                          <p className="text-[13px] text-ink leading-relaxed">{d.inzicht}</p>
                        </div>
                      )}
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="flex items-center gap-1.5 text-[12px] text-ink-soft hover:text-red-500 transition-colors"
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
        )}
      </div>

      <BottomNav />
    </div>
  );
}
