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
  Sparkles
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { isWeeklyReviewComplete } from '@/lib/weekflow.service';

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
}

export default function WeeklyReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [newWin, setNewWin] = useState('');

  // Calculate week number and date range
  const getWeekInfo = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + start.getDay() + 1) / 7);

    // Get Monday of current week
    const currentDay = now.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust for Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);

    // Get Sunday of current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      weekNumber,
      weekStart: monday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      weekEnd: sunday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
      weekStartISO: monday.toISOString(),
      weekEndISO: sunday.toISOString()
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
    weekEnd: weekInfo.weekEndISO
  });

  const [stats, setStats] = useState({
    averageProductivity: 0,
    averageEnergy: 0,
    totalReviews: 0
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.getUser();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }
        setLoading(false);
      } catch (err) {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleAddWin = () => {
    if (newWin.trim()) {
      setFormData({
        ...formData,
        wins: [...formData.wins, newWin.trim()]
      });
      setNewWin('');
    }
  };

  const handleRemoveWin = (index: number) => {
    setFormData({
      ...formData,
      wins: formData.wins.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.weeklyReviews.create(formData);

      // Show celebration animation
      setShowCelebration(true);

      // Redirect after animation
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Failed to save weekly review:', error);
      alert('Er ging iets mis bij het opslaan. Probeer het opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (showCelebration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 overflow-hidden">
        <div className="text-center animate-bounce">
          <div className="relative">
            <Sparkles className="text-yellow-300 w-24 h-24 mx-auto mb-6 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Award className="text-white w-16 h-16 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Fantastisch werk!
          </h2>
          <p className="text-xl text-white/80">
            Je reflectie is opgeslagen. Trots op je vooruitgang!
          </p>
        </div>

        {/* Confetti effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  const isAlreadyComplete = isWeeklyReviewComplete();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/10 border-b border-white/20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </Link>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
              <Award className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Wekelijkse Reflectie</h1>
              <p className="text-white/70">Week {weekInfo.weekNumber} | {weekInfo.weekStart} - {weekInfo.weekEnd}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {stats.totalReviews > 0 && (
        <div className="backdrop-blur-md bg-white/10 border-b border-white/20 px-6 py-4">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{stats.averageProductivity}</div>
              <div className="text-sm text-white/70">Gem. Productiviteit</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{stats.averageEnergy}</div>
              <div className="text-sm text-white/70">Gem. Energie</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{stats.totalReviews}</div>
              <div className="text-sm text-white/70">Totaal Reviews</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Completion Banner */}
          {isAlreadyComplete && (
            <div className="backdrop-blur-md bg-emerald-500/20 rounded-2xl p-4 mb-6 border-2 border-emerald-400/50 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-300" size={24} />
              <div className="flex-1">
                <p className="text-white font-semibold">Je hebt deze week review al voltooid</p>
                <p className="text-emerald-200 text-sm">Je kunt het opnieuw doen om te overschrijven</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">

          {/* Biggest Wins */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Award className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Grootste Overwinningen</h2>
                <p className="text-white/70">Wat ging er geweldig deze week?</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {formData.wins.map((win, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white/10 rounded-xl p-4 group hover:bg-white/20 transition-all"
                >
                  <CheckCircle2 className="text-green-400 flex-shrink-0" size={20} />
                  <span className="flex-1 text-white">{win}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWin(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newWin}
                onChange={(e) => setNewWin(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWin())}
                placeholder="Voeg een overwinning toe..."
                className="flex-1 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/40 transition-all"
              />
              <button
                type="button"
                onClick={handleAddWin}
                className="px-6 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Challenges */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Wat ging niet zoals gepland?</h2>
                <p className="text-white/70">Elke uitdaging is een kans om te leren</p>
              </div>
            </div>
            <textarea
              value={formData.challenges}
              onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
              placeholder="Schrijf over uitdagingen en obstakels..."
              rows={4}
              className="w-full p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/40 transition-all resize-none"
            />
          </div>

          {/* Key Learnings */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                <Lightbulb className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Belangrijkste Lessen</h2>
                <p className="text-white/70">Welke inzichten heb je opgedaan?</p>
              </div>
            </div>
            <textarea
              value={formData.learnings}
              onChange={(e) => setFormData({ ...formData, learnings: e.target.value })}
              placeholder="Deel je belangrijkste lessen en inzichten..."
              rows={4}
              className="w-full p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/40 transition-all resize-none"
            />
          </div>

          {/* Scores */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Productivity Score */}
            <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center">
                  <BarChart className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Productiviteit</h2>
                  <p className="text-white/70">Hoe productief was je?</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <span className="text-6xl font-bold text-white">{formData.productivityScore}</span>
                  <span className="text-3xl text-white/50 mt-auto">/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.productivityScore}
                  onChange={(e) => setFormData({ ...formData, productivityScore: parseInt(e.target.value) })}
                  className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-green-400 [&::-webkit-slider-thumb]:to-teal-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="flex justify-between text-sm text-white/50">
                  <span>Laag</span>
                  <span>Gemiddeld</span>
                  <span>Hoog</span>
                </div>
              </div>
            </div>

            {/* Energy Score */}
            <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center">
                  <Heart className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Energie & Balans</h2>
                  <p className="text-white/70">Hoe voel je je?</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <span className="text-6xl font-bold text-white">{formData.energyScore}</span>
                  <span className="text-3xl text-white/50 mt-auto">/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.energyScore}
                  onChange={(e) => setFormData({ ...formData, energyScore: parseInt(e.target.value) })}
                  className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-pink-400 [&::-webkit-slider-thumb]:to-rose-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                />
                <div className="flex justify-between text-sm text-white/50">
                  <span>Uitgeput</span>
                  <span>Balans</span>
                  <span>Energiek</span>
                </div>
              </div>
            </div>
          </div>

          {/* Carry Forward */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Wat neem je mee?</h2>
                <p className="text-white/70">Naar de volgende week</p>
              </div>
            </div>
            <textarea
              value={formData.carryForward}
              onChange={(e) => setFormData({ ...formData, carryForward: e.target.value })}
              placeholder="Welke momentum, gewoontes of energie neem je mee..."
              rows={3}
              className="w-full p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/40 transition-all resize-none"
            />
          </div>

          {/* Leave Behind */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center">
                <Trash2 className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Wat laat je achter?</h2>
                <p className="text-white/70">Tijd om los te laten</p>
              </div>
            </div>
            <textarea
              value={formData.leaveBehing}
              onChange={(e) => setFormData({ ...formData, leaveBehing: e.target.value })}
              placeholder="Welke zorgen, gewoontes of gedachten laat je achter..."
              rows={3}
              className="w-full p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/40 transition-all resize-none"
            />
          </div>

          {/* Growth Moment */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Persoonlijk Groeimoment</h2>
                <p className="text-white/70">Een moment waarop je jezelf voorbij ging</p>
              </div>
            </div>
            <textarea
              value={formData.growthMoment}
              onChange={(e) => setFormData({ ...formData, growthMoment: e.target.value })}
              placeholder="Beschrijf een moment van persoonlijke groei of doorbraak..."
              rows={4}
              className="w-full p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/40 transition-all resize-none"
            />
          </div>

          {/* Gratitude */}
          <div className="backdrop-blur-md bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Heart className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Dankbaarheid</h2>
                <p className="text-white/70">Waar ben je dankbaar voor?</p>
              </div>
            </div>
            <textarea
              value={formData.gratitude}
              onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
              placeholder="Deel waar je deze week dankbaar voor bent..."
              rows={4}
              className="w-full p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 outline-none focus:border-white/40 transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={saving || formData.wins.length === 0}
              className="px-12 py-5 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white text-xl font-bold rounded-2xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Award size={24} />
                  Voltooien & Reflectie Opslaan
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
