'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Moon, Star, BookOpen, Lightbulb, TrendingDown, Calendar, Heart, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { TimeGateScreen } from '@/components/weekflow/time-gate-screen';
import { isAfter5PM, isEveningRitualComplete } from '@/lib/weekflow.service';

interface EveningRitualData {
  whatWentWell: string;
  biggestWin: string;
  whatLearned: string;
  challenges: string;
  energyLevel: number;
  tomorrowTop3: string[];
  gratitude: string;
}

export default function EveningPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

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

        // Load today's evening ritual from localStorage if exists
        const today = new Date().toISOString().split('T')[0];
        const savedRitual = localStorage.getItem(`eveningRitual_${today}`);
        if (savedRitual) {
          setFormData(JSON.parse(savedRitual));
        }
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const updateTop3Item = (index: number, value: string) => {
    const newTop3 = [...formData.tomorrowTop3];
    newTop3[index] = value;
    setFormData({ ...formData, tomorrowTop3: newTop3 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Save to localStorage
      localStorage.setItem(`eveningRitual_${today}`, JSON.stringify(formData));

      // Save to backend
      await api.logs.create({
        type: 'evening',
        date: today,
        data: formData,
        createdAt: new Date().toISOString()
      });

      // Show success message
      setShowSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Failed to save evening ritual:', error);
      // Still show success since localStorage saved
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent" />
      </div>
    );
  }

  // Check time gate - evening ritual only available after 17:00
  if (!isAfter5PM()) {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="text-white" size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Avondritueel Voltooid!</h2>
          <p className="text-purple-200">Rust goed uit en tot morgen...</p>
        </div>
      </div>
    );
  }

  const isAlreadyComplete = isEveningRitualComplete();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-purple-800/30 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-purple-800/20 rounded-lg transition-all duration-300"
            >
              <ArrowLeft size={20} className="text-purple-200" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Moon className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Avondritueel</h1>
              <p className="text-sm text-purple-200">Reflecteer op je dag</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-purple-200">
            <Star size={16} className="animate-pulse" />
            <span className="text-sm">Dag afsluiten</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Completion Banner */}
          {isAlreadyComplete && (
            <div className="bg-gradient-to-r from-emerald-900/40 to-green-900/40 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-emerald-700/30 flex items-center gap-3">
              <CheckCircle className="text-emerald-400" size={24} />
              <div className="flex-1">
                <p className="text-white font-semibold">Je hebt dit ritueel al voltooid vandaag</p>
                <p className="text-emerald-200 text-sm">Je kunt het opnieuw doen om te overschrijven</p>
              </div>
            </div>
          )}

          {/* Intro Card */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-purple-700/30 shadow-2xl">
            <div className="text-center">
              <div className="flex justify-center gap-2 mb-4">
                <Star className="text-purple-300 animate-pulse" size={24} />
                <Moon className="text-indigo-300 animate-pulse" size={24} style={{ animationDelay: '0.5s' }} />
                <Star className="text-purple-300 animate-pulse" size={24} style={{ animationDelay: '1s' }} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welkom bij je Avondritueel</h2>
              <p className="text-purple-200">
                Neem even de tijd om te reflecteren op je dag. Wat ging goed? Wat heb je geleerd?
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* What Went Well */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-700/30 shadow-xl transition-all duration-300 hover:shadow-purple-500/10 hover:border-purple-600/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="text-white" size={20} />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-white">
                    Wat ging goed vandaag?
                  </label>
                  <p className="text-sm text-purple-200">Vier je successen, groot of klein</p>
                </div>
              </div>
              <textarea
                value={formData.whatWentWell}
                onChange={(e) => setFormData({ ...formData, whatWentWell: e.target.value })}
                className="w-full p-4 rounded-xl bg-slate-900/50 border border-purple-600/30 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-purple-300/50 resize-none transition-all duration-300"
                rows={4}
                placeholder="Schrijf hier wat er vandaag goed ging..."
                required
              />
            </div>

            {/* Biggest Win */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-700/30 shadow-xl transition-all duration-300 hover:shadow-purple-500/10 hover:border-purple-600/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="text-white" size={20} />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-white">
                    Belangrijkste overwinning
                  </label>
                  <p className="text-sm text-purple-200">Je grootste prestatie van vandaag</p>
                </div>
              </div>
              <input
                type="text"
                value={formData.biggestWin}
                onChange={(e) => setFormData({ ...formData, biggestWin: e.target.value })}
                className="w-full p-4 rounded-xl bg-slate-900/50 border border-purple-600/30 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-purple-300/50 transition-all duration-300"
                placeholder="Wat was je grootste overwinning?"
                required
              />
            </div>

            {/* What Learned */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-700/30 shadow-xl transition-all duration-300 hover:shadow-purple-500/10 hover:border-purple-600/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Lightbulb className="text-white" size={20} />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-white">
                    Wat leerde je?
                  </label>
                  <p className="text-sm text-purple-200">Inzichten en lessen van vandaag</p>
                </div>
              </div>
              <textarea
                value={formData.whatLearned}
                onChange={(e) => setFormData({ ...formData, whatLearned: e.target.value })}
                className="w-full p-4 rounded-xl bg-slate-900/50 border border-purple-600/30 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-purple-300/50 resize-none transition-all duration-300"
                rows={3}
                placeholder="Wat zijn je belangrijkste inzichten?"
                required
              />
            </div>

            {/* Challenges */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-700/30 shadow-xl transition-all duration-300 hover:shadow-purple-500/10 hover:border-purple-600/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingDown className="text-white" size={20} />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-white">
                    Uitdagingen en hoe je ze oploste
                  </label>
                  <p className="text-sm text-purple-200">Obstakels en je creatieve oplossingen</p>
                </div>
              </div>
              <textarea
                value={formData.challenges}
                onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                className="w-full p-4 rounded-xl bg-slate-900/50 border border-purple-600/30 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-purple-300/50 resize-none transition-all duration-300"
                rows={4}
                placeholder="Welke uitdagingen kwam je tegen en hoe loste je ze op?"
              />
            </div>

            {/* Energy Level */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-700/30 shadow-xl transition-all duration-300 hover:shadow-purple-500/10 hover:border-purple-600/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingDown className="text-white" size={20} />
                </div>
                <div className="flex-1">
                  <label className="block text-lg font-semibold text-white">
                    Energie level aan het eind van de dag
                  </label>
                  <p className="text-sm text-purple-200">Hoe energiek voel je je nu? (1-10)</p>
                </div>
                <div className="text-3xl font-bold text-purple-300 min-w-[3rem] text-center">
                  {formData.energyLevel}
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-slate-900/50 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 h-3 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/50"
                    style={{ width: `${(formData.energyLevel / 10) * 100}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.energyLevel}
                  onChange={(e) => setFormData({ ...formData, energyLevel: parseInt(e.target.value) })}
                  className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-purple-300 mt-2">
                  <span>Uitgeput</span>
                  <span>Energiek</span>
                </div>
              </div>
            </div>

            {/* Tomorrow Top 3 */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-700/30 shadow-xl transition-all duration-300 hover:shadow-purple-500/10 hover:border-purple-600/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="text-white" size={20} />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-white">
                    Morgen voorbereiden - Top 3
                  </label>
                  <p className="text-sm text-purple-200">Wat zijn je 3 prioriteiten voor morgen?</p>
                </div>
              </div>
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={formData.tomorrowTop3[index]}
                      onChange={(e) => updateTop3Item(index, e.target.value)}
                      className="flex-1 p-3 rounded-xl bg-slate-900/50 border border-purple-600/30 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-purple-300/50 transition-all duration-300"
                      placeholder={`Prioriteit ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Gratitude */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-700/30 shadow-xl transition-all duration-300 hover:shadow-purple-500/10 hover:border-purple-600/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="text-white" size={20} />
                </div>
                <div>
                  <label className="block text-lg font-semibold text-white">
                    Dankbaarheid voor vandaag
                  </label>
                  <p className="text-sm text-purple-200">Waar ben je dankbaar voor?</p>
                </div>
              </div>
              <textarea
                value={formData.gratitude}
                onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
                className="w-full p-4 rounded-xl bg-slate-900/50 border border-purple-600/30 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-purple-300/50 resize-none transition-all duration-300"
                rows={3}
                placeholder="Waar ben je vandaag dankbaar voor?"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Link
                href="/dashboard"
                className="flex-1 py-4 bg-slate-800/50 backdrop-blur-sm text-white rounded-xl font-medium border border-purple-700/30 hover:bg-slate-700/50 transition-all duration-300 text-center"
              >
                Annuleren
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <BookOpen size={20} />
                    Ritueel Voltooien
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Note */}
          <div className="text-center mt-8 text-purple-300/60 text-sm">
            <p>Neem de tijd voor zelfreflectie. Elke dag is een kans om te groeien.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
