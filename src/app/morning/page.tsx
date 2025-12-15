'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sunrise, Star, Target, Zap, Heart, TrendingUp, ArrowLeft, CheckCircle, Coffee } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { isMorningRitualComplete } from '@/lib/weekflow.service';

interface MorningRitualData {
  wakeTime: string;
  sleepQuality: number;
  energyLevel: number;
  gratitude: string;
  todayTop3: string[];
  intention: string;
  affirmation: string;
}

export default function MorningPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<MorningRitualData>({
    wakeTime: '',
    sleepQuality: 7,
    energyLevel: 7,
    gratitude: '',
    todayTop3: ['', '', ''],
    intention: '',
    affirmation: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        // Load today's morning ritual from localStorage if exists
        const today = new Date().toISOString().split('T')[0];
        const savedRitual = localStorage.getItem(`morningRitual_${today}`);
        if (savedRitual) {
          setFormData(JSON.parse(savedRitual));
        } else {
          // Set default wake time to current time
          const now = new Date();
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          setFormData(prev => ({ ...prev, wakeTime: `${hours}:${minutes}` }));
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
    const newTop3 = [...formData.todayTop3];
    newTop3[index] = value;
    setFormData({ ...formData, todayTop3: newTop3 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Save to localStorage
      localStorage.setItem(`morningRitual_${today}`, JSON.stringify(formData));

      // Save to backend
      await api.logs.create({
        type: 'morning',
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
      console.error('Failed to save morning ritual:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Ochtend Ritueel Voltooid! ☀️
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Veel succes vandaag!
          </p>
        </div>
      </div>
    );
  }

  const isAlreadyComplete = isMorningRitualComplete();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-orange-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Dashboard</span>
            </Link>
            <div className="flex items-center gap-3">
              <Sunrise className="text-orange-500" size={28} />
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Ochtend Ritueel</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Start je dag met intentie</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Completion Banner */}
        {isAlreadyComplete && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-4 mb-6 border-2 border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
            <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={24} />
            <div className="flex-1">
              <p className="text-slate-800 dark:text-white font-semibold">Je hebt dit ritueel al voltooid vandaag</p>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm">Je kunt het opnieuw doen om te overschrijven</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wake Time & Sleep Quality */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-orange-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <Coffee className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Wakker worden</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Hoe voel je je?</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Wake Time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Wakker tijd
                </label>
                <input
                  type="time"
                  value={formData.wakeTime}
                  onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border-2 border-transparent focus:border-orange-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* Sleep Quality */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Slaap kwaliteit: {formData.sleepQuality}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.sleepQuality}
                  onChange={(e) => setFormData({ ...formData, sleepQuality: parseInt(e.target.value) })}
                  className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>Slecht</span>
                  <span>Perfect</span>
                </div>
              </div>
            </div>

            {/* Energy Level */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Energie niveau: {formData.energyLevel}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.energyLevel}
                onChange={(e) => setFormData({ ...formData, energyLevel: parseInt(e.target.value) })}
                className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>Moe</span>
                <span>Vol energie</span>
              </div>
            </div>
          </div>

          {/* Gratitude */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-orange-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-xl flex items-center justify-center">
                <Heart className="text-pink-600 dark:text-pink-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dankbaarheid</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Waar ben je vandaag dankbaar voor?</p>
              </div>
            </div>
            <textarea
              value={formData.gratitude}
              onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
              rows={3}
              placeholder="Ik ben dankbaar voor..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border-2 border-transparent focus:border-pink-500 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Today's Top 3 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-orange-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Target className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Top 3 Prioriteiten</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Wat MOET er vandaag gebeuren?</p>
              </div>
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={formData.todayTop3[index]}
                    onChange={(e) => updateTop3Item(index, e.target.value)}
                    placeholder={`Prioriteit ${index + 1}...`}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border-2 border-transparent focus:border-blue-500 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Intention */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-orange-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                <Star className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Intentie</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Hoe wil je vandaag zijn?</p>
              </div>
            </div>
            <input
              type="text"
              value={formData.intention}
              onChange={(e) => setFormData({ ...formData, intention: e.target.value })}
              placeholder="Vandaag kies ik ervoor om..."
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border-2 border-transparent focus:border-purple-500 focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Affirmation */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Affirmatie</h2>
                <p className="text-sm text-white/80">Jouw krachtige statement</p>
              </div>
            </div>
            <input
              type="text"
              value={formData.affirmation}
              onChange={(e) => setFormData({ ...formData, affirmation: e.target.value })}
              placeholder="Ik ben..."
              className="w-full px-4 py-3 rounded-xl bg-white/20 border-2 border-transparent focus:border-white focus:bg-white/30 focus:outline-none text-white placeholder:text-white/60"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Opslaan...' : '✨ Ritueel Voltooien'}
          </button>
        </form>
      </main>
    </div>
  );
}
