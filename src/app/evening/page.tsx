'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Moon, Lightbulb, TrendingDown, Calendar, Heart, ArrowLeft, CheckCircle, Brain, Zap } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { TimeGateScreen } from '@/components/weekflow/time-gate-screen';
import { isAfter5PM, getToday } from '@/lib/weekflow.service';
import { buildRecoveryProposalUrl } from '@/lib/calendar-proposal';
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
  0: { selected: 'bg-line text-ink', text: 'geen' },
  1: { selected: 'bg-tertiary-soft text-tertiary', text: 'soms' },
  2: { selected: 'bg-tertiary-soft text-tertiary', text: 'vaak' },
  3: { selected: 'bg-error-soft text-error', text: 'continu' },
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
  energyGains: string;
  energyCosts: string;
  recoveryHabitDone: boolean | null;
}

function EveningContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [adhdScores, setAdhdScores] = useState<Record<string, number>>(defaultAdhdScores());
  const [recoveryHabit, setRecoveryHabit] = useState<string | null>(null);
  const [morningIntentie, setMorningIntentie] = useState<string | null>(null);
  const [focusSummary, setFocusSummary] = useState<{ completed: number; total: number; minutes: number } | null>(null);
  const [isAlreadyComplete, setIsAlreadyComplete] = useState(false);
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
    gratitude: '',
    energyGains: '',
    energyCosts: '',
    recoveryHabitDone: null
  });

  useEffect(() => {
    api.onboarding.profile()
      .then(({ profile }) => setRecoveryHabit(profile?.vitalityProfile?.nonNegotiableRecoveryHabit ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }
        api.logs.getByTypeAndDate('evening', targetDate).then((logs: any[]) => {
          if (logs?.[0]) {
            const raw = logs[0].data;
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (parsed) setFormData((prev) => ({ ...prev, ...parsed }));
            setIsAlreadyComplete(true);
          }
        }).catch(() => {});
        const savedAdhd = localStorage.getItem(`adhdLog_${targetDate}`);
        if (savedAdhd) {
          try { setAdhdScores(JSON.parse(savedAdhd)); } catch { /* ignore */ }
        }

        // Sluit de cirkel met de ochtend: toon wat vanochtend als intentie is gezet en hoeveel
        // van de focus-sessies die dag echt zijn afgerond. Puur informatief, blokkeert niets.
        api.logs.getByTypeAndDate('morning', targetDate).then((logs: any[]) => {
          const rawData = logs?.[0]?.data;
          const parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
          const intentie = parsedData?.intentie ?? logs?.[0]?.intentie;
          if (intentie && typeof intentie === 'string' && intentie.trim()) {
            setMorningIntentie(intentie.trim());
          }
        }).catch(() => {});

        api.focus.getByDate(targetDate).then((sessions) => {
          const list = (sessions as any[]) || [];
          const workSessions = list.filter((s) => s.session_type !== 'break');
          const completed = workSessions.filter((s) => s.completed).length;
          const minutes = workSessions.reduce((sum: number, s) => sum + (s.duration_minutes || 0), 0);
          if (workSessions.length > 0) {
            setFocusSummary({ completed, total: workSessions.length, minutes });
          }
        }).catch(() => {});
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
      localStorage.setItem(`adhdLog_${targetDate}`, JSON.stringify(adhdScores));
      await api.logs.create({
        type: 'evening',
        date: targetDate,
        ...formData,
      });
      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/adhd-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ date: targetDate, scores: adhdScores }),
        }).catch(() => {});

        const gains = formData.energyGains.split('\n').map((s) => s.trim()).filter(Boolean);
        const costs = formData.energyCosts.split('\n').map((s) => s.trim()).filter(Boolean);
        const entries = [
          ...gains.map((activity) => ({ activity, direction: 'gain' as const })),
          ...costs.map((activity) => ({ activity, direction: 'cost' as const })),
        ];
        if (entries.length > 0) {
          fetch('/api/energy-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ date: targetDate, entries }),
          }).catch(() => {});
        }
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
      <div className="min-h-screen bg-surface-card flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
      <div className="min-h-screen bg-surface-card flex items-center justify-center">
        <div className="text-center px-5">
          <div className="w-20 h-20 bg-primary-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-primary" size={40} />
          </div>
          <h2 className="text-[24px] font-bold text-ink mb-2">Avondritueel Voltooid!</h2>
          <p className="text-[14px] text-ink-soft">Rust goed uit en tot morgen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-card pb-28">
      {/* Header */}
      <header className="bg-surface-card border-b border-line px-5 py-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-surface-sunken text-ink active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </Link>
            <div>
              <h1 className="text-[18px] font-bold text-ink tracking-tight">Avond Ritueel</h1>
              {isRecovery && (
                <p className="text-[11px] text-ink-soft">Inhalen van gisteren</p>
              )}
            </div>
          </div>
          <div className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-surface-sunken">
            <Moon size={18} className="text-ink" />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-5">
        {/* Recovery banner */}
        {isRecovery && !isAlreadyComplete && (
          <div className="rounded-[16px] border border-accent/20 bg-accent/5 p-4 mb-5 flex items-center gap-3">
            <Moon size={18} className="text-accent flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-ink">Avondritueel van gisteren inhalen</p>
              <p className="text-[12px] text-ink-soft">Reflecteer alsnog op {new Date(targetDate + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
        )}

        {/* Already complete banner */}
        {isAlreadyComplete && (
          <div className="rounded-[16px] border border-primary/20 bg-primary/5 p-4 mb-5 flex items-center gap-3">
            <CheckCircle size={18} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-ink">Je hebt dit ritueel al voltooid vandaag</p>
              <p className="text-[12px] text-ink-soft">Je kunt het opnieuw doen om te overschrijven</p>
            </div>
          </div>
        )}

        {/* Ochtend terugblik — sluit de cirkel met de intentie en focus-sessies van vandaag */}
        {(morningIntentie || focusSummary) && (
          <div className="rounded-[16px] border border-line bg-surface-sunken p-4 mb-5">
            <div className="flex items-center gap-2 mb-2.5">
              <Zap size={14} className="text-tertiary" />
              <span className="text-[12px] font-semibold text-ink uppercase tracking-wide">Vanochtend</span>
            </div>
            {morningIntentie && (
              <p className="text-[13px] text-ink mb-1.5">
                <span className="text-ink-soft">Intentie: </span>{morningIntentie}
              </p>
            )}
            {focusSummary && (
              <p className="text-[13px] text-ink">
                <span className="text-ink-soft">Focus-sessies: </span>
                {focusSummary.completed}/{focusSummary.total} voltooid — {focusSummary.minutes} min deep work
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* What went well */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center">
                <CheckCircle size={15} className="text-primary" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-ink">Wat ging goed vandaag?</label>
                <p className="text-[11px] text-ink-soft">Vier je successen, groot of klein</p>
              </div>
            </div>
            <textarea
              value={formData.whatWentWell}
              onChange={(e) => setFormData({ ...formData, whatWentWell: e.target.value })}
              className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft resize-none transition-colors"
              rows={4}
              placeholder="Schrijf hier wat er vandaag goed ging..."
              required
            />
          </div>

          {/* Biggest Win */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-tertiary-soft flex items-center justify-center">
                <span className="text-[14px]">🏆</span>
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-ink">Belangrijkste overwinning</label>
                <p className="text-[11px] text-ink-soft">Je grootste prestatie van vandaag</p>
              </div>
            </div>
            <input
              type="text"
              value={formData.biggestWin}
              onChange={(e) => setFormData({ ...formData, biggestWin: e.target.value })}
              className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft transition-colors"
              placeholder="Wat was je grootste overwinning?"
              required
            />
          </div>

          {/* What Learned */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-accent-soft flex items-center justify-center">
                <Lightbulb size={15} className="text-accent" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-ink">Wat leerde je?</label>
                <p className="text-[11px] text-ink-soft">Inzichten en lessen van vandaag</p>
              </div>
            </div>
            <textarea
              value={formData.whatLearned}
              onChange={(e) => setFormData({ ...formData, whatLearned: e.target.value })}
              className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft resize-none transition-colors"
              rows={3}
              placeholder="Wat zijn je belangrijkste inzichten?"
              required
            />
          </div>

          {/* Challenges */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-red-50 flex items-center justify-center">
                <TrendingDown size={15} className="text-red-500" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-ink">Uitdagingen</label>
                <p className="text-[11px] text-ink-soft">Obstakels en je creatieve oplossingen</p>
              </div>
            </div>
            <textarea
              value={formData.challenges}
              onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
              className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft resize-none transition-colors"
              rows={3}
              placeholder="Welke uitdagingen kwam je tegen en hoe loste je ze op?"
            />
          </div>

          {/* Energy Level */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[14px] font-semibold text-ink">Energie niveau</p>
                <p className="text-[11px] text-ink-soft">Hoe energiek voel je je nu? (1-10)</p>
              </div>
              <span className="text-[28px] font-bold text-ink">{formData.energyLevel}</span>
            </div>
            <div className="relative h-2 bg-surface-sunken rounded-full">
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-200"
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
            <div className="flex justify-between text-[11px] text-ink-soft mt-2">
              <span>Uitgeput</span>
              <span>Energiek</span>
            </div>
            {/* Zelfde propose-nooit-schrijf patroon als het dashboard: bij lage energie een
                vooringevulde Google Calendar-link voor hersteltijd morgenochtend, geen automatische actie. */}
            {formData.energyLevel <= 3 && (() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(8, 0, 0, 0);
              const recoveryUrl = buildRecoveryProposalUrl(
                tomorrow,
                30,
                'Hersteltijd ochtend (voorgesteld door Aipa)',
                'Voorgesteld na een dag met lage energie — begin morgen rustig, geen taken.'
              );
              return (
                <a
                  href={recoveryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-2.5 rounded-[12px] bg-primary/10 px-4 py-3 hover:bg-primary/15 transition-colors"
                >
                  <Calendar size={15} className="text-primary shrink-0" />
                  <span className="text-[12px] font-medium text-ink">Plan hersteltijd voor morgenochtend</span>
                </a>
              );
            })()}
          </div>

          {/* Energie-attributie: niet alleen het cijfer, ook de bron */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center">
                <Zap size={15} className="text-primary" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-ink">Wat gaf en kostte energie?</label>
                <p className="text-[11px] text-ink-soft">Eén per regel — dit is wat de coach later kan herkennen als patroon</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-[12px] font-medium text-primary mb-1.5 block">Gaf energie</span>
                <textarea
                  value={formData.energyGains}
                  onChange={(e) => setFormData({ ...formData, energyGains: e.target.value })}
                  className="w-full px-4 py-3 bg-primary-muted border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft resize-none transition-colors"
                  rows={2}
                  placeholder={'Bijv. "Gesprek met een klant"\n"Een uur zonder telefoon werken"'}
                />
              </div>
              <div>
                <span className="text-[12px] font-medium text-red-500 mb-1.5 block">Kostte energie</span>
                <textarea
                  value={formData.energyCosts}
                  onChange={(e) => setFormData({ ...formData, energyCosts: e.target.value })}
                  className="w-full px-4 py-3 bg-red-50 border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft resize-none transition-colors"
                  rows={2}
                  placeholder={'Bijv. "Vergadering die uitliep"\n"Een lastig besluit blijven uitstellen"'}
                />
              </div>
            </div>
          </div>

          {/* Tomorrow Top 3 */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-surface-sunken flex items-center justify-center">
                <Calendar size={15} className="text-ink" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-ink">Morgen voorbereiden</label>
                <p className="text-[11px] text-ink-soft">Wat zijn je 3 prioriteiten voor morgen?</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-surface-inverse text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={formData.tomorrowTop3[index]}
                    onChange={(e) => updateTop3Item(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft transition-colors"
                    placeholder={`Prioriteit ${index + 1}`}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Herstelbewaking — alleen zichtbaar als de AIPA-intake een gewoonte heeft opgeleverd */}
          {recoveryHabit && (
            <div className="rounded-[16px] border border-line p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-[10px] bg-accent-soft flex items-center justify-center">
                  <Moon size={15} className="text-accent" />
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-ink">Herstelbewaking</label>
                  <p className="text-[11px] text-ink-soft">Ben je gelukt: {recoveryHabit.toLowerCase()}?</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[{ v: true, label: 'Ja' }, { v: false, label: 'Nee' }].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, recoveryHabitDone: opt.v })}
                    className={`flex-1 py-2.5 rounded-[12px] text-[13px] font-semibold transition-colors ${
                      formData.recoveryHabitDone === opt.v
                        ? 'bg-surface-inverse text-white'
                        : 'bg-surface-sunken text-ink-soft hover:bg-line'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Gratitude */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-tertiary-soft flex items-center justify-center">
                <Heart size={15} className="text-tertiary" />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-ink">Dankbaarheid voor vandaag</label>
                <p className="text-[11px] text-ink-soft">Waar ben je dankbaar voor?</p>
              </div>
            </div>
            <textarea
              value={formData.gratitude}
              onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
              className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft resize-none transition-colors"
              rows={3}
              placeholder="Waar ben je vandaag dankbaar voor?"
              required
            />
          </div>

          {/* ADHD Klachten */}
          <div className="rounded-[16px] border border-line overflow-hidden">
            <div className="bg-surface-inverse p-5">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={18} className="text-tertiary" />
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
                  <div key={symptom} className="flex items-center justify-between py-2.5 border-b border-surface-sunken last:border-0">
                    <span className="text-[13px] text-ink flex-1 pr-3 leading-tight">{symptom}</span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {([0, 1, 2, 3] as const).map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setScore(symptom, score)}
                          className={`w-10 h-10 rounded-[10px] text-[13px] font-bold transition-all active:scale-95 ${
                            adhdScores[symptom] === score
                              ? SCORE_COLORS[score].selected
                              : 'bg-surface-sunken text-on-surface-inverse/50'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-ink-soft text-center mt-4">
                Deze meting wordt 14 dagen bijgehouden voor de start van medicatie.
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-surface-inverse text-white text-[15px] font-semibold rounded-[16px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform disabled:opacity-50"
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
      <div className="min-h-screen bg-surface-card flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <EveningContent />
    </Suspense>
  );
}
