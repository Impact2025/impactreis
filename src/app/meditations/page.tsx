'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Flame, Waves } from 'lucide-react';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { MeditationPlayer } from '@/components/meditations/MeditationPlayer';
import {
  MEDITATIONS,
  MEDITATION_CATEGORY_LABELS,
  MeditationCategory,
} from '@/lib/meditations/catalog';

const CATEGORY_ORDER: MeditationCategory[] = ['ochtend', 'focus', 'avond', 'reset'];

export default function MeditationsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ streak: number; totalCompleted: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const user = AuthService.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      try {
        const data = await api.meditations.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load meditation stats:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-card flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-line border-t-transparent" />
      </div>
    );
  }

  const categoriesWithContent = CATEGORY_ORDER.filter(
    (cat) => MEDITATIONS.filter((m) => m.category === cat).length > 0
  );

  return (
    <div className="min-h-screen bg-surface-card">
      <header className="bg-white border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="p-2 -ml-2 text-ink-soft hover:text-ink transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
              <Waves className="text-white" size={16} />
            </div>
            <span className="font-semibold text-ink">Meditaties</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink mb-1">Rust op maat</h1>
          <p className="text-ink-soft max-w-xl">
            Korte, rustgevende sessies om vóór de dagstart, tussen taken door of aan het einde
            van de dag even te resetten.
          </p>
        </div>

        {stats && stats.totalCompleted > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
            <div className="bg-white rounded-xl p-4 border border-line">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tertiary-soft rounded-lg flex items-center justify-center">
                  <Flame className="text-tertiary" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ink">{stats.streak}</p>
                  <p className="text-xs text-ink-soft">Dagen op rij</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-line">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-muted rounded-lg flex items-center justify-center">
                  <Waves className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ink">{stats.totalCompleted}</p>
                  <p className="text-xs text-ink-soft">Sessies voltooid</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {categoriesWithContent.map((category) => (
          <section key={category} className="mb-10">
            <h2 className="text-lg font-semibold text-ink mb-4">
              {MEDITATION_CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MEDITATIONS.filter((m) => m.category === category).map((meditation) => (
                <MeditationPlayer key={meditation.id} meditation={meditation} />
              ))}
            </div>
          </section>
        ))}

        {MEDITATIONS.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface-sunken rounded-full flex items-center justify-center mx-auto mb-4">
              <Waves className="text-ink-soft" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-ink mb-2">Nog geen meditaties</h3>
            <p className="text-ink-soft">Meditaties worden binnenkort toegevoegd.</p>
          </div>
        )}
      </main>
    </div>
  );
}
