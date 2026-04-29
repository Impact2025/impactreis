'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Target, Book, AlertCircle, Trophy,
  Rocket, CheckCircle, Plus, X
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { isWeeklyStartComplete } from '@/lib/weekflow.service';
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
        const savedData = localStorage.getItem(`weeklyStart_${currentYear}_${currentWeek}`);
        if (savedData) setFormData(JSON.parse(savedData));
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router, currentYear, currentWeek]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      localStorage.setItem(`weeklyStart_${currentYear}_${currentWeek}`, JSON.stringify(formData));
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
      setTimeout(() => setSaved(false), 3000);
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
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#00cc66] border-t-transparent animate-spin" />
      </div>
    );
  }

  const isAlreadyComplete = isWeeklyStartComplete();

  return (
    <div className="min-h-screen bg-[#ffffff] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#ffffff] border-b border-[#e8e8ec]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f4f4f7] transition-colors"
            >
              <ArrowLeft size={18} className="text-[#0a0a14]" />
            </Link>
            <h1 className="text-[17px] font-semibold text-[#0a0a14]">Week Start</h1>
          </div>
          <span className="text-[12px] font-semibold text-[#00cc66] bg-[#00cc66]/10 px-3 py-1 rounded-full">
            Week {currentWeek}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">
        {/* Already complete banner */}
        {isAlreadyComplete && (
          <div className="rounded-[16px] border border-[#00cc66]/20 bg-[#00cc66]/5 p-4 flex items-center gap-3">
            <CheckCircle size={18} className="text-[#00cc66] flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-[#0a0a14]">Week start al voltooid</p>
              <p className="text-[12px] text-[#8a8a9a]">Je kunt het opnieuw doen om te overschrijven</p>
            </div>
          </div>
        )}

        {/* Week Intentie */}
        <div className="rounded-[16px] border border-[#e8e8ec] p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-[#0a0a14] flex items-center justify-center">
              <Calendar size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0a0a14]">Week Intentie</h3>
              <p className="text-[11px] text-[#8a8a9a]">Overkoepelende focus deze week</p>
            </div>
          </div>
          <textarea
            value={formData.weekIntention}
            onChange={(e) => setFormData({ ...formData, weekIntention: e.target.value })}
            placeholder="Bijvoorbeeld: Deze week focus ik op het afmaken van project X..."
            rows={3}
            className="w-full resize-none bg-[#f4f4f7] border border-[#e8e8ec] rounded-[12px] px-4 py-3 text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] transition-colors"
          />
        </div>

        {/* Hoofd Doelen */}
        <div className="rounded-[16px] border border-[#e8e8ec] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[10px] bg-[#0a0a14] flex items-center justify-center">
                <Target size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#0a0a14]">Hoofd Doelen</h3>
                <p className="text-[11px] text-[#8a8a9a]">3-5 concrete doelen</p>
              </div>
            </div>
            <button
              onClick={loadContentTemplate}
              className="text-[11px] font-medium text-[#00cc66] border border-[#00cc66]/30 rounded-full px-3 py-1.5 hover:bg-[#00cc66]/5 transition-colors flex items-center gap-1"
            >
              <Rocket size={11} />
              Content template
            </button>
          </div>
          <div className="space-y-2.5">
            {formData.mainGoals.map((goal, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#0a0a14] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => updateMainGoal(index, e.target.value)}
                  placeholder={`Doel ${index + 1}`}
                  className="flex-1 px-3.5 py-2.5 bg-[#f4f4f7] border border-[#e8e8ec] rounded-[12px] text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] transition-colors"
                />
                {formData.mainGoals.length > 1 && (
                  <button onClick={() => removeMainGoal(index)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f4f4f7]">
                    <X size={13} className="text-[#8a8a9a]" />
                  </button>
                )}
              </div>
            ))}
            {formData.mainGoals.length < 5 && (
              <button
                onClick={addMainGoal}
                className="w-full py-2.5 border border-dashed border-[#e8e8ec] rounded-[12px] text-[13px] text-[#8a8a9a] hover:border-[#00cc66] hover:text-[#00cc66] transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={13} />
                Doel toevoegen
              </button>
            )}
          </div>
        </div>

        {/* Focus Verdeling */}
        <div className="rounded-[16px] border border-[#e8e8ec] p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-[10px] bg-[#0a0a14] flex items-center justify-center">
              <Target size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0a0a14]">Focus Verdeling</h3>
              <p className="text-[11px] text-[#8a8a9a]">Verdeel je aandacht (1-10)</p>
            </div>
          </div>
          <div className="space-y-5">
            {(Object.entries(formData.focusAreas) as [keyof typeof formData.focusAreas, number][]).map(([area, value]) => (
              <div key={area}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-[#0a0a14]">{FOCUS_LABELS[area]}</span>
                  <span className="text-[13px] font-semibold text-[#00cc66]">{value}</span>
                </div>
                <div className="relative h-2 bg-[#f4f4f7] rounded-full">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#00cc66] rounded-full transition-all duration-200"
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
        <div className="rounded-[16px] border border-[#e8e8ec] p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-[#0a0a14] flex items-center justify-center">
              <Book size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0a0a14]">Leer Doel</h3>
              <p className="text-[11px] text-[#8a8a9a]">Wat wil je deze week leren?</p>
            </div>
          </div>
          <input
            type="text"
            value={formData.learningGoal}
            onChange={(e) => setFormData({ ...formData, learningGoal: e.target.value })}
            placeholder="Kennis of vaardigheden die je wilt ontwikkelen..."
            className="w-full px-4 py-3 bg-[#f4f4f7] border border-[#e8e8ec] rounded-[12px] text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] transition-colors"
          />
        </div>

        {/* Obstakels */}
        <div className="rounded-[16px] border border-[#e8e8ec] p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-[#0a0a14] flex items-center justify-center">
              <AlertCircle size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0a0a14]">Obstakels</h3>
              <p className="text-[11px] text-[#8a8a9a]">Wat kan je tegenhouden?</p>
            </div>
          </div>
          <textarea
            value={formData.obstacles}
            onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
            placeholder="Potentiële uitdagingen en hoe je ermee omgaat..."
            rows={3}
            className="w-full resize-none bg-[#f4f4f7] border border-[#e8e8ec] rounded-[12px] px-4 py-3 text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] transition-colors"
          />
        </div>

        {/* Succes Metrics */}
        <div className="rounded-[16px] border border-[#e8e8ec] p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-[10px] bg-[#0a0a14] flex items-center justify-center">
              <Trophy size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0a0a14]">Succes Metrics</h3>
              <p className="text-[11px] text-[#8a8a9a]">Hoe weet je dat de week succesvol was?</p>
            </div>
          </div>
          <input
            type="text"
            value={formData.successMetrics}
            onChange={(e) => setFormData({ ...formData, successMetrics: e.target.value })}
            placeholder="Alle 3 doelen afgerond, dagelijks 30 min beweging..."
            className="w-full px-4 py-3 bg-[#f4f4f7] border border-[#e8e8ec] rounded-[12px] text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-[#00cc66] text-white rounded-[16px] text-[15px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform shadow-[0_4px_20px_rgba(0,204,102,0.35)] flex items-center justify-center gap-2.5"
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
