'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { getCurrentWeekNumber, getToday } from '@/lib/weekflow.service';
import { useRitualStatus } from '@/hooks/useRitualStatus';
import { queryKeys } from '@/lib/query-client';
import { BottomNav } from '@/components/ui/bottom-nav';
import { maxCorePoints, playingField } from '@/lib/rustbrenger';
import { EmergencyButton } from './ReferralCards';

const inputClass = 'w-full px-4 py-3 rounded-[14px] bg-surface-sunken border border-transparent text-[15px] outline-none focus:border-primary focus:bg-white transition-all';

function HoursField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-[12px] font-medium text-ink-soft uppercase tracking-wider">{label}</span>
      <input type="number" min={0} max={80} value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} className={inputClass} />
    </label>
  );
}

// Weekstart van de Rustbrenger-editie: reele speelruimte en maximaal 2 kernpunten (1 na een lage
// energiescore in de vorige weekreview). Slaat op als `weekly-start` met dezelfde velden als de
// commerciele versie, zodat ritual-status de week als gestart herkent.
export function RustbrengerWeeklyStart() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings } = useRitualStatus();
  const currentWeek = getCurrentWeekNumber(settings.timezone);
  const currentYear = Number(getToday(settings.timezone).slice(0, 4));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previousEnergy, setPreviousEnergy] = useState<number | null>(null);
  const [available, setAvailable] = useState(24);
  const [meetings, setMeetings] = useState(6);
  const [noise, setNoise] = useState(4);
  const [corePoints, setCorePoints] = useState<string[]>(['', '']);

  const limit = maxCorePoints(previousEnergy);
  const field = playingField(available, meetings, noise);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) { router.push('/auth/login'); return; }
    api.weeklyReviews.getByWeekNumber(currentWeek - 1)
      .then((reviews: { data?: { balance?: { energy?: number } } }[]) => {
        const review = reviews.find((r) => typeof r?.data?.balance?.energy === 'number');
        if (review?.data?.balance) setPreviousEnergy(review.data.balance.energy ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router, currentWeek]);

  const filled = corePoints.slice(0, limit).map((p) => p.trim()).filter(Boolean);

  const save = async () => {
    if (filled.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.weeklyReviews.create({
        type: 'weekly-start',
        weekNumber: currentWeek,
        year: currentYear,
        data: {
          weekNumber: currentWeek,
          year: currentYear,
          weekIntention: filled[0],
          mainGoals: filled,
          focusAreas: { work: 5, health: 5, relationships: 5, personal: 5 },
          learningGoal: '',
          supportNetwork: '',
          obstacles: '',
          successMetrics: '',
          speelruimte: { availableHours: available, meetingHours: meetings, noiseHours: noise, freeHours: field },
          createdAt: new Date().toISOString(),
        },
      });
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: queryKeys.ritualStatus });
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch {
      setSaveError('Opslaan is mislukt. Probeer het opnieuw.');
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

  if (saved) {
    return (
      <div className="min-h-screen bg-surface-card flex flex-col items-center justify-center gap-3 px-5">
        <CheckCircle size={40} className="text-primary" />
        <p className="text-[16px] font-semibold text-ink">Je week heeft een rustige start.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-card pb-28">
      <div className="sticky top-0 z-10 bg-surface-card border-b border-line">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-sunken transition-colors">
            <ArrowLeft size={18} className="text-ink" />
          </Link>
          <h1 className="text-[17px] font-semibold text-ink">Weekstart</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-6 space-y-7">
        {previousEnergy !== null && previousEnergy <= 3 && (
          <div className="rounded-[16px] border border-line bg-surface-sunken p-5" role="status">
            <p className="text-[13px] text-ink leading-relaxed">
              Je energie was vorige week laag. Daarom plan je deze week maar 1 kernpunt. Minder is nu genoeg.
            </p>
          </div>
        )}

        <section className="space-y-3">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Je reele speelruimte</h2>
            <p className="text-[13px] text-ink-soft mt-1">Hoeveel uur heb je echt, als je vaste afspraken en ruis eraf haalt?</p>
          </div>
          <HoursField label="Uren die je beschikbaar hebt" value={available} onChange={setAvailable} />
          <HoursField label="Vaste overleggen" value={meetings} onChange={setMeetings} />
          <HoursField label="Ruis (administratie, verantwoording)" value={noise} onChange={setNoise} />
          <div className="rounded-[16px] bg-primary-muted border border-primary-light p-4">
            <p className="text-[13px] text-ink">Speelruimte deze week: <span className="font-semibold">{field} uur</span></p>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">{limit === 1 ? 'Je kernpunt' : 'Je kernpunten (maximaal 2)'}</h2>
            <p className="text-[13px] text-ink-soft mt-1">Alleen wat deze week echt telt. De rest mag wachten.</p>
          </div>
          {corePoints.slice(0, limit).map((p, i) => (
            <input
              key={i}
              type="text"
              value={p}
              onChange={(e) => setCorePoints((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
              placeholder={`Kernpunt ${i + 1}`}
              maxLength={200}
              className={inputClass}
            />
          ))}
        </section>

        {saveError && <p className="text-[13px] text-red-600">{saveError}</p>}

        <button
          type="button"
          onClick={save}
          disabled={filled.length === 0 || saving}
          className="w-full py-3 rounded-[14px] bg-primary text-white font-bold text-[14px] disabled:opacity-40"
        >
          {saving ? 'Bezig...' : 'Start de week'}
        </button>

        <EmergencyButton />
      </div>
      <BottomNav />
    </div>
  );
}
