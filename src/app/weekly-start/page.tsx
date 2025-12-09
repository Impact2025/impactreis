'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  ArrowLeft,
  Calendar,
  Rocket,
  Target,
  Users,
  Book,
  AlertCircle,
  Trophy,
  Sparkles,
  Save,
  CheckCircle
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';

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

export default function WeeklyStartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Get current week number
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const today = new Date();
  const currentWeek = getWeekNumber(today);
  const currentYear = today.getFullYear();

  const [formData, setFormData] = useState<WeeklyStartData>({
    weekNumber: currentWeek,
    year: currentYear,
    weekIntention: '',
    mainGoals: ['', '', ''],
    focusAreas: {
      work: 5,
      health: 5,
      relationships: 5,
      personal: 5,
    },
    learningGoal: '',
    supportNetwork: '',
    obstacles: '',
    successMetrics: '',
    createdAt: new Date().toISOString(),
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        // Load saved data from localStorage
        const savedData = localStorage.getItem(`weeklyStart_${currentYear}_${currentWeek}`);
        if (savedData) {
          setFormData(JSON.parse(savedData));
        }
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
      // Save to localStorage
      localStorage.setItem(`weeklyStart_${currentYear}_${currentWeek}`, JSON.stringify(formData));

      // Save to backend
      try {
        await api.weeklyReviews.create({
          type: 'weekly-start',
          weekNumber: currentWeek,
          year: currentYear,
          data: formData,
        });
      } catch (apiError) {
        console.error('Failed to save to backend:', apiError);
        // Continue anyway - localStorage save succeeded
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving weekly start:', error);
      alert('Er ging iets mis bij het opslaan. Probeer het opnieuw.');
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
      const newGoals = formData.mainGoals.filter((_, i) => i !== index);
      setFormData({ ...formData, mainGoals: newGoals });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-blue-200 dark:border-slate-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Rocket className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Week Start Planning</h1>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Week {currentWeek} - {currentYear}</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saved ? (
              <>
                <CheckCircle size={18} />
                Opgeslagen!
              </>
            ) : (
              <>
                <Save size={18} />
                {saving ? 'Opslaan...' : 'Opslaan'}
              </>
            )}
          </button>
        </div>
      </header>

      {/* Motivational Banner */}
      <div className="bg-gradient-to-r from-green-500 via-blue-500 to-cyan-500 px-6 py-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Sparkles size={18} className="text-yellow-300" />
            <span className="text-white font-medium text-sm">Nieuwe Week, Nieuwe Kansen</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Maak Deze Week Legendarisch!
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Plan strategisch, blijf gefocust en transformeer je intenties in resultaten.
            Jouw succes begint met een heldere visie.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Week Intention */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-200 dark:border-slate-700 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Calendar className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Week Intentie</h3>
                <p className="text-sm text-slate-500">Wat is je overkoepelende focus deze week?</p>
              </div>
            </div>
            <textarea
              value={formData.weekIntention}
              onChange={(e) => setFormData({ ...formData, weekIntention: e.target.value })}
              placeholder="Bijvoorbeeld: Deze week focus ik op het afmaken van project X en het versterken van mijn ochtendrutine..."
              className="w-full p-4 rounded-xl bg-blue-50 dark:bg-slate-700 border border-blue-200 dark:border-slate-600 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-slate-800 dark:text-white resize-none transition-all"
              rows={4}
            />
          </div>

          {/* Main Goals */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-200 dark:border-slate-700 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Target className="text-white" size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Belangrijkste Doelen Deze Week</h3>
                <p className="text-sm text-slate-500">3-5 concrete doelen die je wilt bereiken</p>
              </div>
            </div>
            <div className="space-y-3">
              {formData.mainGoals.map((goal, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-sm font-semibold">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => updateMainGoal(index, e.target.value)}
                    placeholder={`Doel ${index + 1}`}
                    className="flex-1 p-3 rounded-xl bg-green-50 dark:bg-slate-700 border border-green-200 dark:border-slate-600 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-slate-800 dark:text-white transition-all"
                  />
                  {formData.mainGoals.length > 1 && (
                    <button
                      onClick={() => removeMainGoal(index)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {formData.mainGoals.length < 5 && (
                <button
                  onClick={addMainGoal}
                  className="w-full p-3 border-2 border-dashed border-green-300 dark:border-slate-600 rounded-xl text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                  + Doel Toevoegen
                </button>
              )}
            </div>
          </div>

          {/* Focus Areas */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-200 dark:border-slate-700 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Target className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Focus Areas</h3>
                <p className="text-sm text-slate-500">Verdeel je aandacht over verschillende levensgebieden (1-10)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(formData.focusAreas).map(([area, value]) => {
                const areaLabels: Record<string, string> = {
                  work: 'Werk',
                  health: 'Gezondheid',
                  relationships: 'Relaties',
                  personal: 'Persoonlijke Groei'
                };

                const areaColors: Record<string, string> = {
                  work: 'from-blue-500 to-cyan-500',
                  health: 'from-green-500 to-emerald-500',
                  relationships: 'from-pink-500 to-rose-500',
                  personal: 'from-purple-500 to-indigo-500'
                };

                return (
                  <div key={area} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{areaLabels[area]}</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{value}/10</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <div
                          className={`bg-gradient-to-r ${areaColors[area]} h-3 rounded-full transition-all duration-300`}
                          style={{ width: `${value * 10}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={value}
                        onChange={(e) => setFormData({
                          ...formData,
                          focusAreas: {
                            ...formData.focusAreas,
                            [area]: parseInt(e.target.value)
                          }
                        })}
                        className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning Goal */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-200 dark:border-slate-700 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Book className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Wat Wil Je Deze Week Leren?</h3>
                <p className="text-sm text-slate-500">Kennis of vaardigheden die je wilt ontwikkelen</p>
              </div>
            </div>
            <textarea
              value={formData.learningGoal}
              onChange={(e) => setFormData({ ...formData, learningGoal: e.target.value })}
              placeholder="Bijvoorbeeld: Nieuwe React patterns, effectieve communicatietechnieken, tijdmanagement..."
              className="w-full p-4 rounded-xl bg-orange-50 dark:bg-slate-700 border border-orange-200 dark:border-slate-600 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-800 dark:text-white resize-none transition-all"
              rows={3}
            />
          </div>

          {/* Support Network */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-200 dark:border-slate-700 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Users className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Wie Kan Je Helpen?</h3>
                <p className="text-sm text-slate-500">Mensen, resources of tools die je kunnen ondersteunen</p>
              </div>
            </div>
            <textarea
              value={formData.supportNetwork}
              onChange={(e) => setFormData({ ...formData, supportNetwork: e.target.value })}
              placeholder="Bijvoorbeeld: Mentor voor feedback, collega voor samenwerking, online cursus, bepaalde tools..."
              className="w-full p-4 rounded-xl bg-cyan-50 dark:bg-slate-700 border border-cyan-200 dark:border-slate-600 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-800 dark:text-white resize-none transition-all"
              rows={3}
            />
          </div>

          {/* Obstacles */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-200 dark:border-slate-700 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Potentiële Obstakels</h3>
                <p className="text-sm text-slate-500">Uitdagingen die je kunt verwachten en hoe je ermee omgaat</p>
              </div>
            </div>
            <textarea
              value={formData.obstacles}
              onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
              placeholder="Bijvoorbeeld: Te veel meetings - ik blokkeer focustijd in mijn agenda. Afleidingen - ik zet notificaties uit..."
              className="w-full p-4 rounded-xl bg-red-50 dark:bg-slate-700 border border-red-200 dark:border-slate-600 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-slate-800 dark:text-white resize-none transition-all"
              rows={3}
            />
          </div>

          {/* Success Metrics */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-200 dark:border-slate-700 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Trophy className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Success Metrics</h3>
                <p className="text-sm text-slate-500">Hoe meet je of deze week succesvol was?</p>
              </div>
            </div>
            <textarea
              value={formData.successMetrics}
              onChange={(e) => setFormData({ ...formData, successMetrics: e.target.value })}
              placeholder="Bijvoorbeeld: Alle 3 hoofddoelen afgerond, minimaal 5 uur focustijd, dagelijks 30 min beweging..."
              className="w-full p-4 rounded-xl bg-yellow-50 dark:bg-slate-700 border border-yellow-200 dark:border-slate-600 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 text-slate-800 dark:text-white resize-none transition-all"
              rows={3}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4 pb-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-12 py-4 bg-gradient-to-r from-green-500 via-blue-500 to-cyan-500 text-white rounded-2xl font-bold text-lg hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {saved ? (
                <>
                  <CheckCircle size={24} />
                  Week Planning Opgeslagen!
                </>
              ) : (
                <>
                  <Rocket size={24} />
                  {saving ? 'Opslaan...' : 'Start Je Week!'}
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
