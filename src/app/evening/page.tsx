'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Moon, Lightbulb, TrendingDown, Calendar, Heart, ArrowLeft, CheckCircle, Brain } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { TimeGateScreen } from '@/components/weekflow/time-gate-screen';
import { isAfter5PM, isEveningRitualComplete, getToday } from '@/lib/weekflow.service';
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

const SCORE_COLORS: Record<number, { selected: string; text: string }> = {
  0: { selected: 'bg-[#e8e8ec] text-[#0a0a14]', text: 'geen' },
  1: { selected: 'bg-[#fef3c7] text-[#92400e]', text: 'soms' },
  2: { selected: 'bg-[#fed7aa] text-[#9a3412]', text: 'vaak' },
  3: { selected: 'bg-[#fee2e2] text-[#991b1b]', text: 'continu' },
};

const defaultAdhdScores = () =>
  Object.fromEntries(SYMPTOMS.map((s) => [s, 0])) as Record<string, number>;

interface EveningRitualData {
  whatWentWell: string;
  biggestWin: string;
  whatLearned: string;
  challenges: string;
  energyLevel: number;
  tomorrowTop3: string[];
  gratitude: string;
}

function EveningContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [adhdScores, setAdhdScores] = useState<Record<string, number>>(defaultAdhdScores());
  const router = useRouter();
  const searchParams = useSearchParams();

  // Support ?date=YYYY-MM-DD for filling in a past evening ritual
  const dateParam = searchParams.get('date');
  const targetDate = dateParam || getToday();
  const isRecovery = dateParam !== null && dateParam !== getToday();

  const [formData, setFormData] = useState<EveningRitualData>({
    whatWentWell: '',
    biggestWin: '',
    whatLearned: '',
    challenges: '',
    energyLevel: 5,
    tomorrowTop3: ['', '', ''],
    gratitude: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }
        const savedRitual = localStorage.getItem(`eveningRitual_${targetDate}`);
        if (savedRitual) {
          setFormData(JSON.parse(savedRitual));
        }
        const savedAdhd = localStorage.getItem(`adhdLog_${targetDate}`);
        if (savedAdhd) {
          try { setAdhdScores(JSON.parse(savedAdhd)); } catch { /* ignore */ }
        }
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router, targetDate]);

  const setScore = (symptom: string, score: number) => {
    setAdhdScores((prev) => {
      const updated = { ...prev, [symptom]: score };
      localStorage.setItem(`adhdLog_${targetDate}`, JSON.stringify(updated));
      return updated;
    });
  };

  const updateTop3Item = (index: number, value: string) => {
    const newTop3 = [...formData.tomorrowTop3];
    newTop3[index] = value;
    setFormData({ ...formData, tomorrowTop3: newTop3 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem(`eveningRitual_${targetDate}`, JSON.stringify(formData));
      localStorage.setItem(`adhdLog_${targetDate}`, JSON.stringify(adhdScores));
      await api.logs.create({
        type: 'evening',
        date: targetDate,
        data: formData,
        createdAt: new Date().toISOString()
      });
      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/adhd-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ date: targetDate, scores: adhdScores }),
        }).catch(() => {});
      }
      setShowSuccess(true);
      setTimeout(() => { router.push('/dashboard'); }, 2000);
    } catch (error) {
      console.error('Failed to save evening ritual:', error);
      setShowSuccess(true);
      setTimeout(() => { router.push('/dashboard'); }, 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#00cc66] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isRecovery && !isAfter5PM()) {
    return (
      <TimeGateScreen
        title="Avond Ritueel"
        message="Het avond ritueel is beschikbaar na 17:00 uur"
        availableTime="17:00"
      />
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="text-center px-5">
          <div className="w-20 h-20 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-[#00cc66]" size={40} />
          </div>
          <h2 className="text-[24px] font-bold text-[#0a0a14] mb-2">Avondritueel Voltooid!</h2>
          <p className="text-[14px] text-[#8a8a9a]">Rust goed uit en tot morgen...</p>
        </div>
      </div>
    );
  }

  const isAlreadyComplete = isEveningRitualComplete(targetDate);

  return (
    <div className="min-h-screen bg-[#ffffff] pb-28">
      {/* Header */}
      <header className="bg-[#ffffff] border-b border-[#e8e8ec] px-5 py-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[#f4f4f7] text-[#0a0a14] active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </Link>
            <div>
              <h1 className="text-[18px] font-bold text-[#0a0a14] tracking-tight">Avond Ritueel</h1>
              {isRecovery && (
                <p className="text-[11px] text-[#8a8a9a]">Inhalen van gisteren</p>
              )}
            </div>
          </div>
          <div className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[#f4f4f7]">
            <Moon size={18} className="text-[#0a0a14]" />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-5">
        {/* Recovery banner */}
        {isRecovery && !isAlreadyComplete && (
          <div className="rounded-[16px] border border-[#6366f1]/20 bg-[#6366f1]/5 p-4 mb-5 flex items-center gap-3">
            <Moon size={18} className="text-[#6366f1] flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-[#0a0a14]">Avondritueel van gisteren inhalen</p>
              <p className="text-[12px] text-[#8a8a9a]">Reflecteer alsnog op {new Date(targetDate + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
        )}

        {/* Already complete banner */}
        {isAlreadyComplete && (
          <div className="rounded-[16px] border border-[#00cc66]/20 bg-[#00cc66]/5 p-4 mb-5 flex items-center gap-3">
            <CheckCircle size={18} className="text-[#00cc66] flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-[#0a0a14]">Je hebt dit ritueel al voltooid vandaag</p>
              <p className="text-[12px] text-[#8a8a9a]">Je kunt het opnieuw doen om te overschrijven</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* What went well */}
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-[#00cc66]/10 flex items-center justify-center">
                <CheckCircle size={15} className="text-[#00cc66]" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[#0a0a14]">Wat ging goed vandaag?</label>
                <p className="text-[11px] text-[#8a8a9a]">Vier je successen, groot of klein</p>
              </div>
            </div>
            <textarea
              value={formData.whatWentWell}
              onChange={(e) => setFormData({ ...formData, whatWentWell: e.target.value })}
              className="w-full px-4 py-3 bg-[#f4f4f7] border border-[#e8e8ec] focus:border-[#00cc66] outline-none rounded-[12px] text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] resize-none transition-colors"
              rows={4}
              placeholder="Schrijf hier wat er vandaag goed ging..."
              required
            />
          </div>

          {/* Biggest Win */}
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-[#fef3c7] flex items-center justify-center">
                <span className="text-[14px]">🏆</span>
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[#0a0a14]">Belangrijkste overwinning</label>
                <p className="text-[11px] text-[#8a8a9a]">Je grootste prestatie van vandaag</p>
              </div>
            </div>
            <input
              type="text"
              value={formData.biggestWin}
              onChange={(e) => setFormData({ ...formData, biggestWin: e.target.value })}
              className="w-full px-4 py-3 bg-[#f4f4f7] border border-[#e8e8ec] focus:border-[#00cc66] outline-none rounded-[12px] text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] transition-colors"
              placeholder="Wat was je grootste overwinning?"
              required
            />
          </div>

          {/* What Learned */}
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-[#eff6ff] flex items-center justify-center">
                <Lightbulb size={15} className="text-[#1d4ed8]" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[#0a0a14]">Wat leerde je?</label>
                <p className="text-[11px] text-[#8a8a9a]">Inzichten en lessen van vandaag</p>
              </div>
            </div>
            <textarea
              value={formData.whatLearned}
              onChange={(e) => setFormData({ ...formData, whatLearned: e.target.value })}
              className="w-full px-4 py-3 bg-[#f4f4f7] border border-[#e8e8ec] focus:border-[#00cc66] outline-none rounded-[12px] text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] resize-none transition-colors"
              rows={3}
              placeholder="Wat zijn je belangrijkste inzichten?"
              required
            />
          </div>

          {/* Challenges */}
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-red-50 flex items-center justify-center">
                <TrendingDown size={15} className="text-red-500" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[#0a0a14]">Uitdagingen</label>
                <p className="text-[11px] text-[#8a8a9a]">Obstakels en je creatieve oplossingen</p>
              </div>
            </div>
            <textarea
              value={formData.challenges}
              onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
              className="w-full px-4 py-3 bg-[#f4f4f7] border border-[#e8e8ec] focus:border-[#00cc66] outline-none rounded-[12px] text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] resize-none transition-colors"
              rows={3}
              placeholder="Welke uitdagingen kwam je tegen en hoe loste je ze op?"
            />
          </div>

          {/* Energy Level */}
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[14px] font-semibold text-[#0a0a14]">Energie niveau</p>
                <p className="text-[11px] text-[#8a8a9a]">Hoe energiek voel je je nu? (1-10)</p>
              </div>
              <span className="text-[28px] font-bold text-[#0a0a14]">{formData.energyLevel}</span>
            </div>
            <div className="relative h-2 bg-[#f4f4f7] rounded-full">
              <div
                className="absolute inset-y-0 left-0 bg-[#00cc66] rounded-full transition-all duration-200"
                style={{ width: `${(formData.energyLevel / 10) * 100}%` }}
              />
              <input
                type="range"
                min="1"
                max="10"
                value={formData.energyLevel}
                onChange={(e) => setFormData({ ...formData, energyLevel: parseInt(e.target.value) })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#8a8a9a] mt-2">
              <span>Uitgeput</span>
              <span>Energiek</span>
            </div>
          </div>

          {/* Tomorrow Top 3 */}
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-[#f4f4f7] flex items-center justify-center">
                <Calendar size={15} className="text-[#0a0a14]" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[#0a0a14]">Morgen voorbereiden</label>
                <p className="text-[11px] text-[#8a8a9a]">Wat zijn je 3 prioriteiten voor morgen?</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#0a0a14] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={formData.tomorrowTop3[index]}
                    onChange={(e) => updateTop3Item(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#f4f4f7] border border-[#e8e8ec] focus:border-[#00cc66] outline-none rounded-[12px] text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] transition-colors"
                    placeholder={`Prioriteit ${index + 1}`}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Gratitude */}
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-[#fdf2f8] flex items-center justify-center">
                <Heart size={15} className="text-[#be185d]" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[#0a0a14]">Dankbaarheid voor vandaag</label>
                <p className="text-[11px] text-[#8a8a9a]">Waar ben je dankbaar voor?</p>
              </div>
            </div>
            <textarea
              value={formData.gratitude}
              onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
              className="w-full px-4 py-3 bg-[#f4f4f7] border border-[#e8e8ec] focus:border-[#00cc66] outline-none rounded-[12px] text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] resize-none transition-colors"
              rows={3}
              placeholder="Waar ben je vandaag dankbaar voor?"
              required
            />
          </div>

          {/* ADHD Klachten */}
          <div className="rounded-[16px] border border-[#e8e8ec] overflow-hidden">
            <div className="bg-[#0a0a14] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={18} className="text-[#a78bfa]" />
                <span className="text-[11px] text-white/40 uppercase tracking-widest">Dagelijkse meting</span>
              </div>
              <p className="text-[17px] text-white font-semibold">ADHD Klachten</p>
              <p className="text-[13px] text-white/50 mt-1">Hoe was je vandaag?</p>
              <div className="flex gap-3 mt-3">
                {([0, 1, 2, 3] as const).map((n) => (
                  <div key={n} className="flex items-center gap-1.5">
                    <span className={`w-6 h-6 rounded-[6px] text-[11px] font-bold flex items-center justify-center ${SCORE_COLORS[n].selected}`}>{n}</span>
                    <span className="text-[10px] text-white/40">{SCORE_COLORS[n].text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-0.5">
                {SYMPTOMS.map((symptom) => (
                  <div key={symptom} className="flex items-center justify-between py-2.5 border-b border-[#f4f4f7] last:border-0">
                    <span className="text-[13px] text-[#0a0a14] flex-1 pr-3 leading-tight">{symptom}</span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {([0, 1, 2, 3] as const).map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setScore(symptom, score)}
                          className={`w-10 h-10 rounded-[10px] text-[13px] font-bold transition-all active:scale-95 ${
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
              <p className="text-[11px] text-[#8a8a9a] text-center mt-4">
                Deze meting wordt 14 dagen bijgehouden voor de start van medicatie.
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-[#0a0a14] text-white text-[15px] font-semibold rounded-[16px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Moon size={18} />
                Ritueel Voltooien
              </>
            )}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}

export default function EveningPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#00cc66] border-t-transparent animate-spin" />
      </div>
    }>
      <EveningContent />
    </Suspense>
  );
}
