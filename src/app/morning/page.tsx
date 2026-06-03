'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sunrise, ArrowLeft, ArrowRight, CheckCircle, Heart, Target, Zap } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { isMorningRitualComplete } from '@/lib/weekflow.service';
import { BottomNav } from '@/components/ui/bottom-nav';

type Step = 'intentie' | 'status' | 'dankbaarheid' | 'affirmatie' | 'done';

const STEPS: Step[] = ['intentie', 'status', 'dankbaarheid', 'affirmatie'];

const STEP_LABELS: Record<Step, string> = {
  intentie: 'Intentie',
  status: 'Status',
  dankbaarheid: 'Dankbaarheid',
  affirmatie: 'Affirmatie',
  done: 'Klaar',
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

  const [formData, setFormData] = useState<MorningData>({
    intentie: '',
    affirmatie: '',
    dankbaarheid: ['', '', ''],
    energyLevel: 7,
    sleepQuality: 7,
    wakeTime: '06:30',
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) { router.push('/auth/login'); return; }
        const todayStr = new Date().toISOString().split('T')[0];
        const saved = localStorage.getItem(`morningRitual_${todayStr}`);
        if (saved) setFormData(JSON.parse(saved));
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const updateDankbaarheid = (index: number, value: string) => {
    const updated = [...formData.dankbaarheid];
    updated[index] = value;
    setFormData({ ...formData, dankbaarheid: updated });
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
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

      // Fire-and-forget: sessie analyse email
      const token = localStorage.getItem('token');
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
  const isLastStep = step === 'affirmatie';

  const canGoNext = () => {
    if (step === 'intentie') return formData.intentie.trim().length > 0;
    if (step === 'dankbaarheid') return formData.dankbaarheid.some(d => d.trim().length > 0);
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
          {/* Progress bar */}
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
                    placeholder={`Ik ben dankbaar voor...`}
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
                Tip: Schrijf in de tegenwoordige tijd. Bijv: "Ik ben een krachtige, impactvolle ondernemer."
              </p>
            </div>
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
