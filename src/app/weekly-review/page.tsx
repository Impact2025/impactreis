'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Heart,
  BarChart,
  Award,
  Trash2,
  ArrowLeft,
  Plus,
  X,
  HelpCircle,
  Gift,
  BookOpen,
  Sunrise,
  Moon,
  Timer,
  Mountain,
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { getCurrentQuarter } from '@/lib/weekflow.service';
import { BottomNav } from '@/components/ui/bottom-nav';

type RockStatus = 'on-track' | 'at-risk' | 'done';

interface Rock {
  id: string;
  title: string;
  progress: number;
}

const ROCK_STATUS_LABELS: Record<RockStatus, string> = {
  'on-track': 'Op koers',
  'at-risk': 'Loopt risico',
  'done': 'Klaar',
};

interface WeeklyReviewData {
  wins: string[];
  challenges: string;
  learnings: string;
  productivityScore: number;
  energyScore: number;
  carryForward: string;
  leaveBehing: string;
  growthMoment: string;
  gratitude: string;
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  whatGave: string;
  whatLearned: string;
  howContributed: string;
  howMakeBetter: string;
}

export default function WeeklyReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newWin, setNewWin] = useState('');

  const getWeekInfo = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + start.getDay() + 1) / 7);
    const currentDay = now.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const toDateString = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    return {
      weekNumber,
      weekStart: monday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      weekEnd: sunday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      weekStartISO: monday.toISOString(),
      weekEndISO: sunday.toISOString(),
      weekStartDate: toDateString(monday),
      weekEndDate: toDateString(sunday),
    };
  };

  const weekInfo = getWeekInfo();

  const [formData, setFormData] = useState<WeeklyReviewData>({
    wins: [],
    challenges: '',
    learnings: '',
    productivityScore: 7,
    energyScore: 7,
    carryForward: '',
    leaveBehing: '',
    growthMoment: '',
    gratitude: '',
    weekNumber: weekInfo.weekNumber,
    weekStart: weekInfo.weekStartISO,
    weekEnd: weekInfo.weekEndISO,
    whatGave: '',
    whatLearned: '',
    howContributed: '',
    howMakeBetter: ''
  });

  const [stats, setStats] = useState({
    averageProductivity: 0,
    averageEnergy: 0,
    totalReviews: 0
  });

  const [weekSummary, setWeekSummary] = useState<Awaited<ReturnType<typeof api.weeklySummary.get>> | null>(null);
  const [isAlreadyComplete, setIsAlreadyComplete] = useState(false);
  const [rocks, setRocks] = useState<Rock[]>([]);
  const [rockStatuses, setRockStatuses] = useState<Record<string, RockStatus>>({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.getUser();
        if (!currentUser) { router.push('/auth/login'); return; }
        api.weeklyReviews.getByWeekNumber(weekInfo.weekNumber)
          .then((reviews: any[]) => {
            setIsAlreadyComplete(reviews.some((r) => r?.data?.type === 'weekly-review'));
          })
          .catch(() => {});
        setLoading(false);
      } catch (err) {
        router.push('/auth/login');
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    // Vult de week met echte data i.p.v. alles blanco te laten: voltooide rituelen,
    // focus-minuten en de wins die al deze week zijn gelogd (via /api/wins).
    api.weeklySummary.get(weekInfo.weekStartDate, weekInfo.weekEndDate)
      .then((summary) => {
        setWeekSummary(summary);
        setFormData((prev) => {
          const next = { ...prev };
          if (prev.wins.length === 0 && summary.wins.length > 0) {
            next.wins = summary.wins.map((w) => w.title);
          }
          // Alleen de ongewijzigde default (7) vervangen door een op echte data gebaseerde suggestie
          if (prev.energyScore === 7 && summary.averageEveningEnergy !== null) {
            next.energyScore = Math.round(summary.averageEveningEnergy);
          }
          return next;
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Actieve Rocks van dit kwartaal ophalen zodat de week-review teruggrijpt op de
    // kwartaalprioriteiten i.p.v. alleen losse vrije-tekst wins te verzamelen.
    const currentQuarter = getCurrentQuarter();
    api.goals.getAll()
      .then((allGoals: any[]) => {
        const activeRocks = allGoals.filter((g) => g.isRock && g.quarter === currentQuarter && !g.completed);
        setRocks(activeRocks.map((g) => ({ id: g.id, title: g.title, progress: g.progress ?? 0 })));
      })
      .catch(() => {});
  }, []);

  const handleAddWin = () => {
    if (newWin.trim()) {
      setFormData({ ...formData, wins: [...formData.wins, newWin.trim()] });
      setNewWin('');
    }
  };

  const handleRemoveWin = (index: number) => {
    setFormData({ ...formData, wins: formData.wins.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.weeklyReviews.create({
        type: 'weekly-review',
        weekNumber: weekInfo.weekNumber,
        data: formData,
      });

      if (rocks.length > 0) {
        const rockCheckins = rocks.map((rock) => ({
          goalId: rock.id,
          title: rock.title,
          status: rockStatuses[rock.id] ?? 'on-track',
        }));
        await api.weeklyGoals.create({ weekNumber: weekInfo.weekNumber, goals: rockCheckins });

        await Promise.all(rocks.map((rock) => {
          const status = rockStatuses[rock.id] ?? 'on-track';
          const nextProgress = status === 'done' ? 100
            : status === 'on-track' ? Math.min(90, rock.progress + 15)
            : rock.progress; // at-risk: ongewijzigd
          if (nextProgress === rock.progress) return Promise.resolve();
          return api.goals.update(rock.id, { progress: nextProgress, completed: status === 'done' });
        }));
      }

      setShowCelebration(true);
      setTimeout(() => { router.push('/dashboard'); }, 3000);
    } catch (error) {
      console.error('Failed to save weekly review:', error);
      alert('Er ging iets mis bij het opslaan. Probeer het opnieuw.');
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

  if (showCelebration) {
    return (
      <div className="min-h-screen bg-surface-inverse flex items-center justify-center">
        <div className="text-center px-5">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Award className="text-primary" size={48} />
          </div>
          <h2 className="text-[28px] font-bold text-white mb-3">Fantastisch werk!</h2>
          <p className="text-[15px] text-white/60">Je reflectie is opgeslagen.</p>
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
              <h1 className="text-[18px] font-bold text-ink tracking-tight">Week Review</h1>
              <p className="text-[11px] text-ink-soft">{weekInfo.weekStart} — {weekInfo.weekEnd}</p>
            </div>
          </div>
          <span className="text-[12px] font-semibold text-primary bg-primary-muted px-3 py-1 rounded-full">
            W{weekInfo.weekNumber}
          </span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-5">
        {/* Already complete banner */}
        {isAlreadyComplete && (
          <div className="rounded-[16px] border border-primary/20 bg-primary/5 p-4 mb-5 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-ink">Je hebt deze week review al voltooid</p>
              <p className="text-[12px] text-ink-soft">Je kunt het opnieuw doen om te overschrijven</p>
            </div>
          </div>
        )}

        {/* Week in cijfers — echte data uit ochtend/avond/focus/energie, geen invoer */}
        {weekSummary && (
          <div className="rounded-[16px] border border-line bg-surface-sunken p-4 mb-5">
            <p className="text-[12px] font-semibold text-ink uppercase tracking-wide mb-3">Deze week in cijfers</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <Sunrise size={14} className="text-tertiary mx-auto mb-1" />
                <p className="text-[15px] font-bold text-ink">{weekSummary.morningRitualDays}/7</p>
                <p className="text-[10px] text-ink-soft">Ochtend</p>
              </div>
              <div>
                <Moon size={14} className="text-accent mx-auto mb-1" />
                <p className="text-[15px] font-bold text-ink">{weekSummary.eveningRitualDays}/7</p>
                <p className="text-[10px] text-ink-soft">Avond</p>
              </div>
              <div>
                <Timer size={14} className="text-primary mx-auto mb-1" />
                <p className="text-[15px] font-bold text-ink">{weekSummary.focusMinutes}</p>
                <p className="text-[10px] text-ink-soft">Focus-min</p>
              </div>
            </div>
            {weekSummary.averageEveningEnergy !== null && (
              <p className="text-[12px] text-ink-soft text-center mt-3">
                Gemiddelde avond-energie: <span className="font-semibold text-ink">{weekSummary.averageEveningEnergy}/10</span>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rocks van dit kwartaal — hoe staat het ervoor? */}
          {rocks.length > 0 && (
            <div className="rounded-[16px] border border-line p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-[10px] bg-tertiary-soft flex items-center justify-center">
                  <Mountain size={15} className="text-tertiary" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-ink">Rocks van dit kwartaal</h3>
                  <p className="text-[11px] text-ink-soft">Hoe staat het ervoor?</p>
                </div>
              </div>
              <div className="space-y-3">
                {rocks.map((rock) => (
                  <div key={rock.id}>
                    <p className="text-[13px] font-medium text-ink mb-2">{rock.title}</p>
                    <div className="flex gap-2">
                      {(['on-track', 'at-risk', 'done'] as RockStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setRockStatuses((prev) => ({ ...prev, [rock.id]: status }))}
                          className={`flex-1 py-2 rounded-[10px] text-[12px] font-semibold transition-colors ${
                            (rockStatuses[rock.id] ?? 'on-track') === status
                              ? 'bg-surface-inverse text-white'
                              : 'bg-surface-sunken text-ink-soft hover:bg-line'
                          }`}
                        >
                          {ROCK_STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Biggest Wins */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-tertiary-soft flex items-center justify-center">
                <Award size={15} className="text-tertiary" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-ink">Grootste Overwinningen</h3>
                <p className="text-[11px] text-ink-soft">Wat ging er geweldig deze week?</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {formData.wins.map((win, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary-muted text-ink text-[12px] font-medium"
                >
                  <CheckCircle2 size={11} className="text-primary" />
                  {win}
                  <button
                    type="button"
                    onClick={() => handleRemoveWin(index)}
                    className="ml-0.5"
                  >
                    <X size={12} className="text-ink-soft hover:text-red-500 transition-colors" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newWin}
                onChange={(e) => setNewWin(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddWin(); } }}
                placeholder="Voeg een overwinning toe..."
                className="flex-1 px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft transition-colors"
              />
              <button
                type="button"
                onClick={handleAddWin}
                className="w-11 h-11 bg-primary text-white rounded-[12px] flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Challenges */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-accent-soft flex items-center justify-center">
                <TrendingUp size={15} className="text-accent" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-ink">Wat ging niet zoals gepland?</h3>
                <p className="text-[11px] text-ink-soft">Elke uitdaging is een kans om te leren</p>
              </div>
            </div>
            <textarea
              value={formData.challenges}
              onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
              placeholder="Schrijf over uitdagingen en obstakels..."
              rows={4}
              className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft resize-none transition-colors"
            />
          </div>

          {/* Key Learnings */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-tertiary-soft flex items-center justify-center">
                <Lightbulb size={15} className="text-tertiary" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-ink">Belangrijkste Lessen</h3>
                <p className="text-[11px] text-ink-soft">Welke inzichten heb je opgedaan?</p>
              </div>
            </div>
            <textarea
              value={formData.learnings}
              onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
              placeholder="Deel je belangrijkste lessen en inzichten..."
              rows={4}
              className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft resize-none transition-colors"
            />
          </div>

          {/* Scores — 2-col */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[16px] border border-line p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart size={14} className="text-primary" />
                <h3 className="text-[13px] font-semibold text-ink">Productiviteit</h3>
              </div>
              <div className="text-center mb-3">
                <span className="text-[36px] font-bold text-ink">{formData.productivityScore}</span>
                <span className="text-[16px] text-ink-soft">/10</span>
              </div>
              <div className="relative h-2 bg-surface-sunken rounded-full">
                <div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full"
                  style={{ width: `${(formData.productivityScore / 10) * 100}%` }}
                />
                <input
                  type="range" min="1" max="10" value={formData.productivityScore}
                  onChange={(e) => setFormData({ ...formData, productivityScore: parseInt(e.target.value) })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="rounded-[16px] border border-line p-5">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={14} className="text-tertiary" />
                <h3 className="text-[13px] font-semibold text-ink">Energie</h3>
              </div>
              <div className="text-center mb-3">
                <span className="text-[36px] font-bold text-ink">{formData.energyScore}</span>
                <span className="text-[16px] text-ink-soft">/10</span>
              </div>
              <div className="relative h-2 bg-surface-sunken rounded-full">
                <div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full"
                  style={{ width: `${(formData.energyScore / 10) * 100}%` }}
                />
                <input
                  type="range" min="1" max="10" value={formData.energyScore}
                  onChange={(e) => setFormData({ ...formData, energyScore: parseInt(e.target.value) })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Carry Forward */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-surface-sunken flex items-center justify-center">
                <TrendingUp size={15} className="text-ink" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-ink">Wat neem je mee?</h3>
                <p className="text-[11px] text-ink-soft">Naar de volgende week</p>
              </div>
            </div>
            <textarea
              value={formData.carryForward}
              onChange={(e) => setFormData({ ...formData, carryForward: e.target.value })}
              placeholder="Welke momentum, gewoontes of energie neem je mee..."
              rows={3}
              className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft resize-none transition-colors"
            />
          </div>

          {/* Leave Behind */}
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-red-50 flex items-center justify-center">
                <Trash2 size={15} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-ink">Wat laat je achter?</h3>
                <p className="text-[11px] text-ink-soft">Tijd om los te laten</p>
              </div>
            </div>
            <textarea
              value={formData.leaveBehing}
              onChange={(e) => setFormData({ ...formData, leaveBehing: e.target.value })}
              placeholder="Welke zorgen, gewoontes of gedachten laat je achter..."
              rows={3}
              className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft resize-none transition-colors"
            />
          </div>

          {/* Quality Questions — dark card */}
          <div className="rounded-[16px] bg-surface-inverse p-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-[10px] bg-tertiary-soft flex items-center justify-center">
                <HelpCircle size={15} className="text-tertiary" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white">Quality Questions</h3>
                <p className="text-[11px] text-white/40">Tony Robbins Evening Power Questions</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'whatGave', icon: Gift, label: 'Wat heb ik deze week GEGEVEN?', placeholder: 'Welke waarde, liefde, hulp of inspiratie heb je anderen gegeven?' },
                { key: 'whatLearned', icon: BookOpen, label: 'Wat heb ik deze week GELEERD?', placeholder: 'Nieuwe inzichten, vaardigheden of perspectieven?' },
                { key: 'howContributed', icon: TrendingUp, label: 'Hoe heeft deze week bijgedragen?', placeholder: 'In welke gebieden ben je gegroeid of vooruitgegaan?' },
                { key: 'howMakeBetter', icon: Award, label: 'Hoe kan ik volgende week beter maken?', placeholder: 'Welke kleine aanpassing zou een groot verschil maken?' },
              ].map(({ key, icon: Icon, label, placeholder }) => (
                <div key={key}>
                  <label className="flex items-center gap-2 text-[13px] font-medium text-white mb-2">
                    <Icon size={13} className="text-tertiary" />
                    {label}
                  </label>
                  <textarea
                    value={(formData as any)[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={placeholder}
                    rows={2}
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 focus:border-primary outline-none rounded-[12px] text-[13px] text-white placeholder-white/30 resize-none transition-colors"
                  />
                </div>
              ))}
            </div>

            <p className="text-center text-white/30 text-[11px] mt-5 italic">
              "Quality questions create a quality life." — Tony Robbins
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || formData.wins.length === 0}
            className="w-full py-4 bg-primary text-white text-[15px] font-semibold rounded-[16px] flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform disabled:opacity-40 shadow-[0_4px_20px_rgba(81,96,80,0.35)]"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Award size={18} />
                Week Voltooien
              </>
            )}
          </button>

          {formData.wins.length === 0 && (
            <p className="text-center text-[12px] text-ink-soft">Voeg minimaal 1 overwinning toe om door te gaan</p>
          )}
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
