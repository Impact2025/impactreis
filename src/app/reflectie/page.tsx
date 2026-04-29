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
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#00cc66] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#ffffff] border-b border-[#e8e8ec]">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f4f4f7] transition-colors"
              >
                <ArrowLeft size={18} className="text-[#0a0a14]" />
              </Link>
              <h1 className="text-[17px] font-semibold text-[#0a0a14]">Reflectie</h1>
            </div>
            {step !== 'opgeslagen' && (
              <span className="text-[12px] font-medium text-[#8a8a9a] bg-[#f4f4f7] px-3 py-1 rounded-full">
                {currentIndex + 1}/3
              </span>
            )}
          </div>
          {step !== 'opgeslagen' && (
            <div className="h-1 w-full bg-[#f4f4f7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00cc66] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">
        {/* Step 1: Verhaal */}
        {(step === 'verhaal' || step === 'feiten' || step === 'inzicht') && (
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 'verhaal' ? 'bg-[#0a0a14] text-white' : 'bg-[#00cc66] text-white'}`}>
                {step === 'verhaal' ? '1' : '✓'}
              </div>
              <span className="text-[13px] font-semibold text-[#0a0a14]">Verhaal</span>
              <span className="text-[11px] text-[#8a8a9a] ml-auto">Emoties mogen hier</span>
            </div>
            <textarea
              value={situatie}
              onChange={(e) => setSituatie(e.target.value)}
              placeholder="Beschrijf de situatie... Wat speelt er? Schrijf het op zoals het voelt."
              rows={step === 'verhaal' ? 5 : 3}
              disabled={step !== 'verhaal'}
              className={`w-full resize-none rounded-[12px] px-4 py-3 text-[14px] placeholder-[#8a8a9a] outline-none transition-colors ${
                step === 'verhaal'
                  ? 'bg-[#f4f4f7] border border-[#e8e8ec] text-[#0a0a14] focus:border-[#00cc66]'
                  : 'bg-[#f4f4f7]/50 border border-transparent text-[#8a8a9a] cursor-default'
              }`}
            />
            {step === 'verhaal' && situatie.trim() && (
              <button
                onClick={() => setStep('feiten')}
                className="mt-3 w-full py-3 bg-[#00cc66] text-white rounded-[12px] text-[14px] font-semibold active:scale-[0.98] transition-transform"
              >
                Door de feitenfilter
              </button>
            )}
          </div>
        )}

        {/* Step 2: Feiten */}
        {(step === 'feiten' || step === 'inzicht') && (
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 'feiten' ? 'bg-[#0a0a14] text-white' : 'bg-[#00cc66] text-white'}`}>
                {step === 'feiten' ? '2' : '✓'}
              </div>
              <span className="text-[13px] font-semibold text-[#0a0a14]">Feiten</span>
            </div>

            {step === 'feiten' && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {HELPER_FEITEN.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setFeiten(prev => prev ? `${prev} ${v}` : v)}
                    className="bg-[#f4f4f7] text-[#8a8a9a] text-[11px] rounded-full px-3 py-1 hover:bg-[#e8e8ec] transition-colors"
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
              className={`w-full resize-none rounded-[12px] px-4 py-3 text-[14px] placeholder-[#8a8a9a] outline-none transition-colors ${
                step === 'feiten'
                  ? 'bg-[#f4f4f7] border border-[#e8e8ec] text-[#0a0a14] focus:border-[#00cc66]'
                  : 'bg-[#f4f4f7]/50 border border-transparent text-[#8a8a9a] cursor-default'
              }`}
            />
            {step === 'feiten' && (
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setStep('verhaal')}
                  className="flex-1 py-3 rounded-[12px] border border-[#e8e8ec] text-[14px] font-medium text-[#8a8a9a]"
                >
                  Terug
                </button>
                <button
                  onClick={() => setStep('inzicht')}
                  disabled={!feiten.trim()}
                  className="flex-1 py-3 bg-[#00cc66] text-white rounded-[12px] text-[14px] font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
                >
                  Inzicht
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Inzicht */}
        {step === 'inzicht' && (
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-[#0a0a14] text-white flex items-center justify-center text-[11px] font-bold">3</div>
              <span className="text-[13px] font-semibold text-[#0a0a14]">Inzicht</span>
            </div>
            <p className="text-[12px] text-[#8a8a9a] mb-3">Wat neem je hieruit mee?</p>
            <textarea
              value={inzicht}
              onChange={(e) => setInzicht(e.target.value)}
              placeholder="Wat voel je nu je de feiten ziet? Kort, eerlijk, helder..."
              rows={4}
              className="w-full resize-none bg-[#f4f4f7] border border-[#e8e8ec] rounded-[12px] px-4 py-3 text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] transition-colors"
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setStep('feiten')}
                className="flex-1 py-3 rounded-[12px] border border-[#e8e8ec] text-[14px] font-medium text-[#8a8a9a]"
              >
                Terug
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-[#00cc66] text-white rounded-[12px] text-[14px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {saving ? 'Opslaan...' : 'Opslaan & afsluiten'}
              </button>
            </div>
          </div>
        )}

        {/* Previous entries */}
        {entries.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-[11px] font-medium text-[#8a8a9a] uppercase tracking-wider">Eerdere reflecties</p>
            {entries.map((entry) => {
              const d = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data;
              const isExpanded = expandedEntry === entry.id;
              const preview = d.situatie?.split(/[.!?]/)[0] ?? '';
              return (
                <div key={entry.id} className="rounded-[16px] border border-[#e8e8ec] overflow-hidden">
                  <button
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#0a0a14] truncate">{preview}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-[#8a8a9a]">
                          {new Date(entry.timestamp).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {d.feiten && (
                          <span className="text-[10px] px-2 py-0.5 bg-[#f4f4f7] text-[#8a8a9a] rounded-full">gefilterd</span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={15} className="text-[#8a8a9a] flex-shrink-0" /> : <ChevronDown size={15} className="text-[#8a8a9a] flex-shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4 border-t border-[#e8e8ec] pt-3 space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold text-[#8a8a9a] uppercase tracking-wider mb-1">Verhaal</p>
                        <p className="text-[13px] text-[#0a0a14] leading-relaxed">{d.situatie}</p>
                      </div>
                      {d.feiten && (
                        <div>
                          <p className="text-[10px] font-semibold text-[#00cc66] uppercase tracking-wider mb-1">Feiten</p>
                          <p className="text-[13px] text-[#0a0a14] leading-relaxed">{d.feiten}</p>
                        </div>
                      )}
                      {d.inzicht && (
                        <div>
                          <p className="text-[10px] font-semibold text-[#0a0a14] uppercase tracking-wider mb-1">Inzicht</p>
                          <p className="text-[13px] text-[#0a0a14] leading-relaxed">{d.inzicht}</p>
                        </div>
                      )}
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="flex items-center gap-1.5 text-[12px] text-[#8a8a9a] hover:text-red-500 transition-colors"
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
