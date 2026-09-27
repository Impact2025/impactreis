'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { getCurrentWeekNumber } from '@/lib/weekflow.service';
import { useRitualStatus } from '@/hooks/useRitualStatus';
import { queryKeys } from '@/lib/query-client';
import { BottomNav } from '@/components/ui/bottom-nav';
import { LOW_ENERGY_SCORE, REFERRAL_MESSAGE } from '@/lib/rustbrenger';
import { EmergencyButton } from './ReferralCards';

const AXES = [
  { key: 'impact', label: 'Impact', hint: 'Deed ik wat voor mijn missie telt?' },
  { key: 'continuity', label: 'Continuiteit', hint: 'Loopt de organisatie door, ook financieel?' },
  { key: 'energy', label: 'Persoonlijke energie', hint: 'Hoe staat mijn batterij na deze week?' },
] as const;
type AxisKey = (typeof AXES)[number]['key'];

/** Driehoek met de drie scores: hoe groter het vlak, hoe meer balans. Puur visueel, geen oordeel. */
function BalanceTriangle({ scores }: { scores: Record<AxisKey, number> }) {
  const c = 100;
  const R = 80;
  const angles = [-90, 30, 150].map((a) => (a * Math.PI) / 180);
  const point = (i: number, ratio: number) => `${c + Math.cos(angles[i]) * R * ratio},${c + Math.sin(angles[i]) * R * ratio}`;
  const values = AXES.map((a) => scores[a.key] / 10);
  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto" role="img" aria-label="Balans-driehoek">
      <polygon points={[0, 1, 2].map((i) => point(i, 1)).join(' ')} fill="none" stroke="currentColor" className="text-line" strokeWidth={1} />
      <polygon points={[0, 1, 2].map((i) => point(i, values[i])).join(' ')} className="fill-primary/30 stroke-primary" strokeWidth={2} />
    </svg>
  );
}

// Weekreview van de Rustbrenger-editie: balans tussen Impact, Continuiteit en Persoonlijke energie.
// De energiescore stuurt het volgende weekplan bij (zie RustbrengerWeeklyStart / maxCorePoints).
export function RustbrengerWeeklyReview() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings } = useRitualStatus();
  const weekNumber = getCurrentWeekNumber(settings.timezone);

  const [scores, setScores] = useState<Record<AxisKey, number>>({ impact: 6, continuity: 6, energy: 6 });
  const [carryForward, setCarryForward] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.weeklyReviews.create({
        type: 'weekly-review',
        weekNumber,
        data: {
          wins: [],
          challenges: '',
          learnings: '',
          productivityScore: scores.impact,
          energyScore: scores.energy,
          carryForward: carryForward.trim(),
          leaveBehing: '',
          growthMoment: '',
          gratitude: '',
          weekNumber,
          weekStart: '',
          weekEnd: '',
          whatGave: '',
          whatLearned: '',
          howContributed: '',
          howMakeBetter: '',
          mainGoalResults: [],
          balance: scores,
        },
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.ritualStatus });
      setDone(true);
    } catch {
      setSaveError('Opslaan is mislukt. Probeer het opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    const low = scores.energy <= LOW_ENERGY_SCORE;
    return (
      <div className="min-h-screen bg-surface-card flex flex-col items-center justify-center gap-4 px-5 text-center">
        <CheckCircle size={40} className="text-primary" />
        <p className="text-[16px] font-semibold text-ink">Week afgesloten.</p>
        {low && (
          <div className="rounded-[16px] border border-line bg-surface-sunken p-5 max-w-sm">
            <p className="text-[13px] text-ink leading-relaxed">
              Je energie is laag. Volgende week plannen we daarom maar 1 kernpunt. {REFERRAL_MESSAGE}
            </p>
          </div>
        )}
        <button type="button" onClick={() => router.push('/dashboard')} className="text-[13px] font-semibold text-primary">Naar het dashboard</button>
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
          <h1 className="text-[17px] font-semibold text-ink">Weekreview</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-6 space-y-7">
        <div>
          <h2 className="text-[18px] font-semibold text-ink">Hoe zit je balans?</h2>
          <p className="text-[13px] text-ink-soft mt-1">Geef elk punt een cijfer van 1 tot 10. Er is geen goed of fout.</p>
        </div>

        <BalanceTriangle scores={scores} />

        {AXES.map((a) => (
          <label key={a.key} className="block space-y-1">
            <span className="flex items-baseline justify-between">
              <span className="text-[14px] font-semibold text-ink">{a.label}</span>
              <span className="text-[14px] text-ink">{scores[a.key]}</span>
            </span>
            <span className="block text-[12px] text-ink-soft">{a.hint}</span>
            <input
              type="range"
              min={1}
              max={10}
              value={scores[a.key]}
              onChange={(e) => setScores((s) => ({ ...s, [a.key]: Number(e.target.value) }))}
              className="w-full"
              aria-label={a.label}
            />
          </label>
        ))}

        <section className="space-y-2">
          <h2 className="text-[16px] font-semibold text-ink">Wat neem je mee naar volgende week?</h2>
          <textarea
            rows={3}
            value={carryForward}
            onChange={(e) => setCarryForward(e.target.value)}
            className="w-full px-4 py-3 rounded-[14px] bg-surface-sunken border border-transparent text-[15px] outline-none focus:border-primary focus:bg-white transition-all resize-none"
          />
        </section>

        {saveError && <p className="text-[13px] text-red-600">{saveError}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full py-3 rounded-[14px] bg-primary text-white font-bold text-[14px] disabled:opacity-40"
        >
          {saving ? 'Bezig...' : 'Sluit de week af'}
        </button>

        <EmergencyButton />
      </div>
      <BottomNav />
    </div>
  );
}
