'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Target, Book, AlertCircle, Trophy,
  Rocket, CheckCircle, Plus, X, Mountain
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { getCurrentQuarter } from '@/lib/weekflow.service';
import { BottomNav } from '@/components/ui/bottom-nav';

interface WeeklyStartData {
  weekNumber: number;
  year: number;
  weekIntention: string;
  mainGoals: string[];
  focusAreas: {
    work: number;
    health: number;
    relationships: number;
    personal: number;
  };
  learningGoal: string;
  supportNetwork: string;
  obstacles: string;
  successMetrics: string;
  createdAt: string;
}

const FOCUS_LABELS: Record<string, string> = {
  work: 'Werk',
  health: 'Gezondheid',
  relationships: 'Relaties',
  personal: 'Persoonlijke groei',
};

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export default function WeeklyStartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [carryForward, setCarryForward] = useState<string | null>(null);
  const [isAlreadyComplete, setIsAlreadyComplete] = useState(false);
  const [activeRockTitles, setActiveRockTitles] = useState<string[]>([]);

  const today = new Date();
  const currentWeek = getWeekNumber(today);
  const currentYear = today.getFullYear();

  const [formData, setFormData] = useState<WeeklyStartData>({
    weekNumber: currentWeek,
    year: currentYear,
    weekIntention: '',
    mainGoals: ['', '', ''],
    focusAreas: { work: 5, health: 5, relationships: 5, personal: 5 },
    learningGoal: '',
    supportNetwork: '',
    obstacles: '',
    successMetrics: '',
    createdAt: new Date().toISOString(),
  });

  const loadContentTemplate = () => {
    setFormData(prev => ({
      ...prev,
      weekIntention: '7 dagen consistent content posten - geen uitzonderingen. Marketing > nieuwe ideeën.',
      mainGoals: [
        'Ma: Instagram Story + Post (08:00) - Motivatie & Mindset',
        'Di: LinkedIn + Nieuwsbrief (10:00) - Autoriteit & Leads',
        'Wo: TikTok/Reel (19:30) - Viraal & Herkenbaar',
      ],
      focusAreas: { work: 8, health: 6, relationships: 4, personal: 5 },
      learningGoal: 'Welke content formats werken het best voor leads? Test & meet!',
      supportNetwork: 'Accountability buddy voor dagelijkse content check-ins',
      obstacles: 'Verveling, nieuwe ideeën, perfectionism. Reminder: Done > Perfect',
      successMetrics: '7/7 dagen gepost, 5+ nieuwe leads, 1 klantgesprek',
    }));
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) { router.push('/auth/login'); return; }

        api.weeklyReviews.getByWeekNumber(currentWeek)
          .then((reviews: any[]) => {
            const existing = reviews.find((r) => r?.data?.type === 'weekly-start');
            if (existing?.data?.data) {
              setFormData(existing.data.data);
              setIsAlreadyComplete(true);
            }
          })
          .catch(() => {});

        // Vorige week se "wat neem je mee" (weekly-review) als suggestie tonen, i.p.v. de week
        // blanco te starten los van wat er net is afgesloten.
        api.weeklyReviews.getByWeekNumber(currentWeek - 1)
          .then((reviews: any[]) => {
            const review = reviews.find((r) => r?.data?.carryForward);
            if (review?.data?.carryForward) setCarryForward(review.data.carryForward);
          })
          .catch(() => {});
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    const currentQuarter = getCurrentQuarter();
    api.goals.getAll()
      .then((allGoals: any[]) => {
        const titles = allGoals
          .filter((g) => g.isRock && g.quarter === currentQuarter && !g.completed)
          .map((g) => g.title);
        setActiveRockTitles(titles);
      })
      .catch(() => {});
  }, [router, currentYear, currentWeek]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      try {
        await api.weeklyReviews.create({
          type: 'weekly-start',
          weekNumber: currentWeek,
          year: currentYear,
          data: formData,
        });
      } catch (apiError) {
        console.error('Failed to save to backend:', apiError);
      }
      setSaved(true);
      // Redirect to dashboard after a brief success confirmation
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error saving weekly start:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateMainGoal = (index: number, value: string) => {
    const newGoals = [...formData.mainGoals];
    newGoals[index] = value;
    setFormData({ ...formData, mainGoals: newGoals });
  };

  const addMainGoal = () => {
    if (formData.mainGoals.length < 5) {
      setFormData({ ...formData, mainGoals: [...formData.mainGoals, ''] });
    }
  };

  const removeMainGoal = (index: number) => {
    if (formData.mainGoals.length > 1) {
      setFormData({ ...formData, mainGoals: formData.mainGoals.filter((_, i) => i !== index) });
    }
  };

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
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-sunken transition-colors"
            >
              <ArrowLeft size={18} className="text-ink" />
            </Link>
            <h1 className="text-[17px] font-semibold text-ink">Week Start</h1>
          </div>
          <span className="text-[12px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
            Week {currentWeek}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">
        {/* Already complete banner */}
        {isAlreadyComplete && (
          <div className="rounded-[16px] border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
            <CheckCircle size={18} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-ink">Week start al voltooid</p>
              <p className="text-[12px] text-ink-soft">Je kunt het opnieuw doen om te overschrijven</p>
            </div>
          </div>
        )}

        {/* Kwartaal-Rocks, ter herinnering — geen invoer, puur context */}
        {activeRockTitles.length > 0 && (
          <div className="rounded-[16px] border border-tertiary/20 bg-tertiary-soft p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Mountain size={13} className="text-tertiary" />
              <p className="text-[12px] font-semibold text-ink uppercase tracking-wide">Dit kwartaal focus je op</p>
            </div>
            <ul className="space-y-0.5">
              {activeRockTitles.map((title, i) => (
                <li key={i} className="text-[13px] text-ink">• {title}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Vorige week se carry-forward, als suggestie */}
        {carryForward && (
          <div className="rounded-[16px] border border-line bg-surface-sunken p-4">
            <p className="text-[12px] font-semibold text-ink uppercase tracking-wide mb-1.5">Vorige week nam je dit mee</p>
            <p className="text-[13px] text-ink">{carryForward}</p>
          </div>
        )}

        {/* Week Intentie */}
        <div className="rounded-[16px] border border-line p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-surface-inverse flex items-center justify-center">
              <Calendar size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Week Intentie</h3>
              <p className="text-[11px] text-ink-soft">Overkoepelende focus deze week</p>
            </div>
          </div>
          <textarea
            value={formData.weekIntention}
            onChange={(e) => setFormData({ ...formData, weekIntention: e.target.value })}
            placeholder="Bijvoorbeeld: Deze week focus ik op het afmaken van project X..."
            rows={3}
            className="w-full resize-none bg-surface-sunken border border-line rounded-[12px] px-4 py-3 text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Hoofd Doelen */}
        <div className="rounded-[16px] border border-line p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-surface-inverse flex items-center justify-center">
                <Target size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-ink">Hoofd Doelen</h3>
                <p className="text-[11px] text-ink-soft">3-5 concrete doelen</p>
              </div>
            </div>
            <button
              onClick={loadContentTemplate}
              className="text-[11px] font-medium text-primary border border-primary/30 rounded-full px-3 py-1.5 hover:bg-primary/5 transition-colors flex items-center gap-1"
            >
              <Rocket size={11} />
              Content template
            </button>
          </div>
          <div className="space-y-2.5">
            {formData.mainGoals.map((goal, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-surface-inverse text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => updateMainGoal(index, e.target.value)}
                  placeholder={`Doel ${index + 1}`}
                  className="flex-1 px-3.5 py-2.5 bg-surface-sunken border border-line rounded-[12px] text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary transition-colors"
                />
                {formData.mainGoals.length > 1 && (
                  <button onClick={() => removeMainGoal(index)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-sunken">
                    <X size={13} className="text-ink-soft" />
                  </button>
                )}
              </div>
            ))}
            {formData.mainGoals.length < 5 && (
              <button
                onClick={addMainGoal}
                className="w-full py-2.5 border border-dashed border-line rounded-[12px] text-[13px] text-ink-soft hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={13} />
                Doel toevoegen
              </button>
            )}
          </div>
        </div>

        {/* Focus Verdeling */}
        <div className="rounded-[16px] border border-line p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-[10px] bg-surface-inverse flex items-center justify-center">
              <Target size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Focus Verdeling</h3>
              <p className="text-[11px] text-ink-soft">Verdeel je aandacht (1-10)</p>
            </div>
          </div>
          <div className="space-y-5">
            {(Object.entries(formData.focusAreas) as [keyof typeof formData.focusAreas, number][]).map(([area, value]) => (
              <div key={area}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-ink">{FOCUS_LABELS[area]}</span>
                  <span className="text-[13px] font-semibold text-primary">{value}</span>
                </div>
                <div className="relative h-2 bg-surface-sunken rounded-full">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${value * 10}%` }}
                  />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={value}
                    onChange={(e) => setFormData({
                      ...formData,
                      focusAreas: { ...formData.focusAreas, [area]: parseInt(e.target.value) }
                    })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leer Doel */}
        <div className="rounded-[16px] border border-line p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-surface-inverse flex items-center justify-center">
              <Book size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Leer Doel</h3>
              <p className="text-[11px] text-ink-soft">Wat wil je deze week leren?</p>
            </div>
          </div>
          <input
            type="text"
            value={formData.learningGoal}
            onChange={(e) => setFormData({ ...formData, learningGoal: e.target.value })}
            placeholder="Kennis of vaardigheden die je wilt ontwikkelen..."
            className="w-full px-4 py-3 bg-surface-sunken border border-line rounded-[12px] text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Obstakels */}
        <div className="rounded-[16px] border border-line p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-surface-inverse flex items-center justify-center">
              <AlertCircle size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Obstakels</h3>
              <p className="text-[11px] text-ink-soft">Wat kan je tegenhouden?</p>
            </div>
          </div>
          <textarea
            value={formData.obstacles}
            onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
            placeholder="Potentiële uitdagingen en hoe je ermee omgaat..."
            rows={3}
            className="w-full resize-none bg-surface-sunken border border-line rounded-[12px] px-4 py-3 text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Succes Metrics */}
        <div className="rounded-[16px] border border-line p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-surface-inverse flex items-center justify-center">
              <Trophy size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Succes Metrics</h3>
              <p className="text-[11px] text-ink-soft">Hoe weet je dat de week succesvol was?</p>
            </div>
          </div>
          <input
            type="text"
            value={formData.successMetrics}
            onChange={(e) => setFormData({ ...formData, successMetrics: e.target.value })}
            placeholder="Alle 3 doelen afgerond, dagelijks 30 min beweging..."
            className="w-full px-4 py-3 bg-surface-sunken border border-line rounded-[12px] text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-primary text-white rounded-[16px] text-[15px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform shadow-[0_4px_20px_rgba(81,96,80,0.35)] flex items-center justify-center gap-2.5"
        >
          {saved ? (
            <>
              <CheckCircle size={18} />
              Week ingepland!
            </>
          ) : (
            <>
              <Rocket size={18} />
              {saving ? 'Opslaan...' : 'Start je week'}
            </>
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
