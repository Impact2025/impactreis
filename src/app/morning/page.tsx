'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
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

        const today = new Date().toISOString().split('T')[0];

        const defaultData: MorningRitualData = {
          wakeTime: '',
          sleepQuality: 7,
          energyLevel: 7,
          gratitude: '',
          todayTop3: ['', '', ''],
          intention: '',
          affirmation: ''
        };

        try {
          const dbLogs = await api.logs.getByTypeAndDate('morning', today);
          if (dbLogs && dbLogs.length > 0) {
            const rawData = dbLogs[0].data;
            const dbData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
            const mergedData = { ...defaultData, ...dbData, todayTop3: dbData.todayTop3 || defaultData.todayTop3 };
            setFormData(mergedData);
            localStorage.setItem(`morningRitual_${today}`, JSON.stringify(mergedData));
            setLoading(false);
            return;
          }
        } catch (dbError) {
          console.log('Could not fetch from database, checking localStorage');
        }

        const savedRitual = localStorage.getItem(`morningRitual_${today}`);
        if (savedRitual) {
          const parsed = JSON.parse(savedRitual);
          setFormData({ ...defaultData, ...parsed, todayTop3: parsed.todayTop3 || defaultData.todayTop3 });
        } else {
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
    const currentTop3 = formData.todayTop3 || ['', '', ''];
    const newTop3 = [...currentTop3];
    newTop3[index] = value;
    setFormData({ ...formData, todayTop3: newTop3 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`morningRitual_${today}`, JSON.stringify(formData));

      await api.logs.create({
        type: 'morning',
        date: today,
        data: formData,
        createdAt: new Date().toISOString()
      });

      setShowSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Failed to save morning ritual:', error);
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-900 dark:border-white border-t-transparent" />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Opgeslagen</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Succes vandaag</p>
        </div>
      </div>
    );
  }

  const isAlreadyComplete = isMorningRitualComplete();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-semibold text-slate-900 dark:text-white">Ochtend</h1>
          <div className="w-8" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {isAlreadyComplete && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-6 border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              Al voltooid vandaag. Aanpassingen overschrijven het vorige.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Wake & Energy */}
          <section>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Status
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
              <div className="p-4">
                <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Wakker</label>
                <input
                  type="time"
                  value={formData.wakeTime}
                  onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                  className="w-full px-0 py-1 bg-transparent border-none text-slate-900 dark:text-white text-lg focus:outline-none"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-500 dark:text-slate-400">Slaap</label>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.sleepQuality}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.sleepQuality}
                  onChange={(e) => setFormData({ ...formData, sleepQuality: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-500 dark:text-slate-400">Energie</label>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{formData.energyLevel}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.energyLevel}
                  onChange={(e) => setFormData({ ...formData, energyLevel: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                />
              </div>
            </div>
          </section>

          {/* Gratitude */}
          <section>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Dankbaarheid
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <textarea
                value={formData.gratitude}
                onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
                rows={2}
                placeholder="Waar ben je dankbaar voor?"
                className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none"
              />
            </div>
          </section>

          {/* Top 3 */}
          <section>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Top 3 vandaag
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-3 p-4">
                  <span className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={(formData.todayTop3 || ['', '', ''])[index] || ''}
                    onChange={(e) => updateTop3Item(index, e.target.value)}
                    placeholder={`Prioriteit ${index + 1}`}
                    className="flex-1 bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Intention */}
          <section>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Intentie
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <input
                type="text"
                value={formData.intention}
                onChange={(e) => setFormData({ ...formData, intention: e.target.value })}
                placeholder="Hoe wil je vandaag zijn?"
                className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </section>

          {/* Affirmation */}
          <section>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
              Affirmatie
            </h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <input
                type="text"
                value={formData.affirmation}
                onChange={(e) => setFormData({ ...formData, affirmation: e.target.value })}
                placeholder="Ik ben..."
                className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : 'Voltooien'}
          </button>
        </form>
      </main>
    </div>
  );
}
