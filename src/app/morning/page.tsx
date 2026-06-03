'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sunrise, ArrowLeft, ArrowRight, CheckCircle, Heart, Target, Zap, Brain } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/ui/bottom-nav';

type Step = 'intentie' | 'status' | 'dankbaarheid' | 'affirmatie' | 'adhd' | 'done';

const STEPS: Step[] = ['intentie', 'status', 'dankbaarheid', 'affirmatie', 'adhd'];

const STEP_LABELS: Record<Step, string> = {
  intentie: 'Intentie',
  status: 'Status',
  dankbaarheid: 'Dankbaarheid',
  affirmatie: 'Affirmatie',
  adhd: 'ADHD Klachten',
  done: 'Klaar',
};

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

const SCORE_COLORS: Record<number, { selected: string; text: string }> = {
  0: { selected: 'bg-[#e8e8ec] text-[#0a0a14]', text: 'geen' },
  1: { selected: 'bg-[#fef3c7] text-[#92400e]', text: 'soms' },
  2: { selected: 'bg-[#fed7aa] text-[#9a3412]', text: 'vaak' },
  3: { selected: 'bg-[#fee2e2] text-[#991b1b]', text: 'continu' },
};

interface MorningData {
  intentie: string;
  affirmatie: string;
  dankbaarheid: string[];
  energyLevel: number;
  sleepQuality: number;
  wakeTime: string;
}

export default function MorningPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>('intentie');
  const router = useRouter();

  const today = new Date();
  const dayName = today.toLocaleDateString('nl-NL', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
  const todayStr = today.toISOString().split('T')[0];

  const [formData, setFormData] = useState<MorningData>({
    intentie: '',
    affirmatie: '',
    dankbaarheid: ['', '', ''],
    energyLevel: 7,
    sleepQuality: 7,
    wakeTime: '06:30',
  });

  const defaultScores = () =>
    Object.fromEntries(SYMPTOMS.map((s) => [s, 0])) as Record<string, number>;

  const [adhdScores, setAdhdScores] = useState<Record<string, number>>(defaultScores());

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) { router.push('/auth/login'); return; }
        const saved = localStorage.getItem(`morningRitual_${todayStr}`);
        if (saved) setFormData(JSON.parse(saved));
        const savedAdhd = localStorage.getItem(`adhdLog_${todayStr}`);
        if (savedAdhd) setAdhdScores(JSON.parse(savedAdhd));
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router, todayStr]);

  const updateDankbaarheid = (index: number, value: string) => {
    const updated = [...formData.dankbaarheid];
    updated[index] = value;
    setFormData({ ...formData, dankbaarheid: updated });
  };

  const setScore = (symptom: string, score: number) => {
    setAdhdScores((prev) => {
      const updated = { ...prev, [symptom]: score };
      localStorage.setItem(`adhdLog_${todayStr}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      localStorage.setItem(`morningRitual_${todayStr}`, JSON.stringify(formData));

      try {
        await api.logs.create({
          type: 'morning',
          date: todayStr,
          data: formData,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('API save error:', err);
      }

      const token = localStorage.getItem('token');

      // Save ADHD scores
      if (token) {
        fetch('/api/adhd-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ date: todayStr, scores: adhdScores }),
        }).catch(() => {});
      }

      // Fire-and-forget: sessie analyse email
      if (token) {
        fetch('/api/email/sessie-analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData),
        }).catch(() => {});
      }

      setStep('done');
      setTimeout(() => { router.push('/dashboard'); }, 2000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentIndex = STEPS.indexOf(step);
  const progressPct = step === 'done' ? 100 : ((currentIndex + 1) / STEPS.length) * 100;
  const isLastStep = step === 'adhd';

  const canGoNext = () => {
    if (step === 'intentie') return formData.intentie.trim().length > 0;
    if (step === 'dankbaarheid') return formData.dankbaarheid.some((d) => d.trim().length > 0);
    if (step === 'affirmatie') return formData.affirmatie.trim().length > 0;
    return true;
  };

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    else handleComplete();
  };

  const goPrev = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#00cc66] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="text-center px-5">
          <div className="w-20 h-20 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-[#00cc66]" size={40} />
          </div>
          <h2 className="text-[24px] font-bold text-[#0a0a14] mb-2">Ochtend Ritueel Voltooid!</h2>
          <p className="text-[14px] text-[#8a8a9a]">Je dag is goed gestart.</p>
        </div>
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
              <div>
                <h1 className="text-[17px] font-semibold text-[#0a0a14]">Ochtend Ritueel</h1>
                <p className="text-[11px] text-[#8a8a9a]">{STEP_LABELS[step]}</p>
              </div>
            </div>
            <span className="text-[12px] font-medium text-[#8a8a9a] bg-[#f4f4f7] px-3 py-1 rounded-full">
              {currentIndex + 1}/{STEPS.length}
            </span>
          </div>
          <div className="h-1 w-full bg-[#f4f4f7] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00cc66] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5">

        {/* Step: Intentie */}
        {step === 'intentie' && (
          <div className="space-y-4">
            <div className="rounded-[16px] bg-[#0a0a14] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sunrise size={18} className="text-[#00cc66]" />
                <span className="text-[11px] text-white/40 uppercase tracking-widest">
                  {dayName}, {dateStr}
                </span>
              </div>
              <p className="text-[17px] text-white font-semibold">Goedemorgen.</p>
              <p className="text-[13px] text-white/50 mt-1">Zet de toon voor een geweldige dag.</p>
            </div>
            <div className="rounded-[16px] border border-[#e8e8ec] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-[#00cc66]" />
                <span className="text-[14px] font-semibold text-[#0a0a14]">Wat is je intentie voor vandaag?</span>
              </div>
              <textarea
                value={formData.intentie}
                onChange={(e) => setFormData({ ...formData, intentie: e.target.value })}
                placeholder="Vandaag focus ik op... Ik wil bereiken dat..."
                rows={4}
                autoFocus
                className="w-full resize-none bg-[#f4f4f7] border border-[#e8e8ec] focus:border-[#00cc66] outline-none rounded-[12px] px-4 py-3 text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step: Status */}
        {step === 'status' && (
          <div className="rounded-[16px] border border-[#e8e8ec] p-5 space-y-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-[#f59e0b]" />
              <span className="text-[14px] font-semibold text-[#0a0a14]">Hoe voel je je vandaag?</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#0a0a14]">Slaap kwaliteit</span>
                <span className="text-[13px] font-semibold text-[#00cc66]">{formData.sleepQuality}/10</span>
              </div>
              <div className="relative h-2 bg-[#f4f4f7] rounded-full">
                <div
                  className="absolute inset-y-0 left-0 bg-[#00cc66] rounded-full transition-all"
                  style={{ width: `${(formData.sleepQuality / 10) * 100}%` }}
                />
                <input
                  type="range" min="1" max="10" value={formData.sleepQuality}
                  onChange={(e) => setFormData({ ...formData, sleepQuality: parseInt(e.target.value) })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#0a0a14]">Energie niveau</span>
                <span className="text-[13px] font-semibold text-[#00cc66]">{formData.energyLevel}/10</span>
              </div>
              <div className="relative h-2 bg-[#f4f4f7] rounded-full">
                <div
                  className="absolute inset-y-0 left-0 bg-[#00cc66] rounded-full transition-all"
                  style={{ width: `${(formData.energyLevel / 10) * 100}%` }}
                />
                <input
                  type="range" min="1" max="10" value={formData.energyLevel}
                  onChange={(e) => setFormData({ ...formData, energyLevel: parseInt(e.target.value) })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] text-[#0a0a14] mb-2">Hoe laat ben je wakker geworden?</label>
              <input
                type="time"
                value={formData.wakeTime}
                onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                className="px-4 py-3 bg-[#f4f4f7] border border-[#e8e8ec] focus:border-[#00cc66] outline-none rounded-[12px] text-[14px] text-[#0a0a14] transition-colors"
              />
            </div>
          </div>
        )}

        {/* Step: Dankbaarheid */}
        {step === 'dankbaarheid' && (
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={16} className="text-[#be185d]" />
              <span className="text-[14px] font-semibold text-[#0a0a14]">3 dingen waar ik dankbaar voor ben</span>
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#f4f4f7] text-[#8a8a9a] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={formData.dankbaarheid[index]}
                    onChange={(e) => updateDankbaarheid(index, e.target.value)}
                    placeholder="Ik ben dankbaar voor..."
                    className="flex-1 px-4 py-3 bg-[#f4f4f7] border border-[#e8e8ec] focus:border-[#00cc66] outline-none rounded-[12px] text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Affirmatie */}
        {step === 'affirmatie' && (
          <div className="space-y-4">
            <div className="rounded-[16px] bg-[#0a0a14] p-5">
              <p className="text-[13px] text-white/50 leading-relaxed">
                Een krachtige affirmatie zet je neurale netwerk klaar voor succes. Schrijf vanuit geloof, niet vanuit verlangen.
              </p>
            </div>
            <div className="rounded-[16px] border border-[#e8e8ec] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-[#f59e0b]" />
                <span className="text-[14px] font-semibold text-[#0a0a14]">Mijn affirmatie voor vandaag</span>
              </div>
              <textarea
                value={formData.affirmatie}
                onChange={(e) => setFormData({ ...formData, affirmatie: e.target.value })}
                placeholder="Ik ben... Ik heb... Ik bereik..."
                rows={4}
                className="w-full resize-none bg-[#f4f4f7] border border-[#e8e8ec] focus:border-[#00cc66] outline-none rounded-[12px] px-4 py-3 text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] transition-colors"
              />
              <p className="text-[11px] text-[#8a8a9a] mt-3 italic">
                Tip: Schrijf in de tegenwoordige tijd. Bijv: &quot;Ik ben een krachtige, impactvolle ondernemer.&quot;
              </p>
            </div>
          </div>
        )}

        {/* Step: ADHD Klachten */}
        {step === 'adhd' && (
          <div className="space-y-3">
            <div className="rounded-[16px] bg-[#0a0a14] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={18} className="text-[#a78bfa]" />
                <span className="text-[11px] text-white/40 uppercase tracking-widest">Dagelijkse meting</span>
              </div>
              <p className="text-[17px] text-white font-semibold">ADHD Klachten</p>
              <p className="text-[13px] text-white/50 mt-1">
                Hoe was je vandaag?
              </p>
              <div className="flex gap-3 mt-3">
                {([0, 1, 2, 3] as const).map((n) => (
                  <div key={n} className="flex items-center gap-1">
                    <span className={`w-5 h-5 rounded-[6px] text-[10px] font-bold flex items-center justify-center ${SCORE_COLORS[n].selected}`}>{n}</span>
                    <span className="text-[10px] text-white/40">{SCORE_COLORS[n].text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[16px] border border-[#e8e8ec] p-4">
              <div className="space-y-1">
                {SYMPTOMS.map((symptom) => (
                  <div
                    key={symptom}
                    className="flex items-center justify-between py-2 border-b border-[#f4f4f7] last:border-0"
                  >
                    <span className="text-[13px] text-[#0a0a14] flex-1 pr-3 leading-tight">{symptom}</span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {([0, 1, 2, 3] as const).map((score) => (
                        <button
                          key={score}
                          onClick={() => setScore(symptom, score)}
                          className={`w-9 h-9 rounded-[10px] text-[13px] font-bold transition-all active:scale-95 ${
                            adhdScores[symptom] === score
                              ? SCORE_COLORS[score].selected
                              : 'bg-[#f4f4f7] text-[#c0c0cc]'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-[#8a8a9a] text-center px-4">
              Deze meting wordt 14 dagen bijgehouden voor de start van medicatie.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="flex-1 py-3.5 rounded-[14px] border border-[#e8e8ec] text-[14px] font-medium text-[#8a8a9a] active:scale-[0.98] transition-transform"
            >
              Vorige
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!canGoNext() || saving}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#00cc66] text-white text-[14px] font-semibold rounded-[14px] active:scale-[0.98] transition-transform disabled:opacity-40 shadow-[0_2px_12px_rgba(0,204,102,0.3)]"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLastStep ? (
              <>
                <CheckCircle size={16} />
                Voltooien
              </>
            ) : (
              <>
                Volgende
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-5 bg-[#00cc66]'
                  : i < currentIndex
                  ? 'w-1.5 bg-[#00cc66]/40'
                  : 'w-1.5 bg-[#e8e8ec]'
              }`}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
