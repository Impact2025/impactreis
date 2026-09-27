'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, DoorClosed } from 'lucide-react';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { getToday } from '@/lib/weekflow.service';
import { useRitualStatus } from '@/hooks/useRitualStatus';
import { queryKeys } from '@/lib/query-client';
import { CardOption } from '@/components/ui/dna-controls';
import { BottomNav } from '@/components/ui/bottom-nav';
import { BATTERY_ENERGY, BATTERY_OPTIONS, parseBattery, type Battery } from '@/lib/rustbrenger';
import { EmergencyButton } from './ReferralCards';

// Avondritueel van de Rustbrenger-editie: "Sluit de Poort". Geen tijdsgrens en geen waarde-oordeel.
// Slaat op als `evening`-log; `whatWentWell`/`challenges` worden gevuld zodat coach en mails die
// velden al lezen, zonder `eveningVerdict` (dat is een commercieel concept).
export function RustbrengerEvening() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings } = useRitualStatus();
  const today = getToday(settings.timezone);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [layDown, setLayDown] = useState('');
  const [counts, setCounts] = useState('');
  const [release, setRelease] = useState('');
  const [battery, setBattery] = useState<Battery | null>(null);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) { router.push('/auth/login'); return; }
    api.logs.getByTypeAndDate('evening', today)
      .then((logs: { data: unknown }[]) => {
        const raw = Array.isArray(logs) && logs[0] ? logs[0].data : null;
        const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (p) {
          setLayDown(typeof p.challenges === 'string' ? p.challenges : '');
          setCounts(typeof p.whatWentWell === 'string' ? p.whatWentWell : '');
          setRelease(Array.isArray(p.losgelaten) ? p.losgelaten.join('\n') : '');
          setBattery(parseBattery(p.battery));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router, today]);

  const closeGate = async () => {
    if (!battery) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.logs.create({
        type: 'evening',
        date: today,
        battery,
        energyLevel: BATTERY_ENERGY[battery],
        challenges: layDown.trim(),
        whatWentWell: counts.trim(),
        losgelaten: release.split('\n').map((s) => s.trim()).filter(Boolean),
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.ritualStatus });
      setClosed(true);
    } catch {
      setSaveError('Opslaan is mislukt. Controleer je verbinding en probeer het opnieuw.');
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

  // Zachte sluiting: de poort is dicht, maar de weg naar het dashboard blijft open (omzeilbaar).
  if (closed) {
    return (
      <div className="min-h-screen bg-surface-card flex flex-col items-center justify-center gap-4 px-5 text-center">
        <DoorClosed size={40} className="text-primary" />
        <p className="text-[18px] font-semibold text-ink">De poort is dicht.</p>
        <p className="text-[13px] text-ink-soft max-w-xs">Wat je hebt neergelegd blijft tot morgen liggen. Klaar voor vandaag.</p>
        <Link href="/dashboard" className="text-[13px] text-ink-soft underline">Toch nog even naar het dashboard</Link>
      </div>
    );
  }

  const textarea = 'w-full px-4 py-3 rounded-[14px] bg-surface-sunken border border-transparent text-[15px] outline-none focus:border-primary focus:bg-white transition-all resize-none';

  return (
    <div className="min-h-screen bg-surface-card pb-28">
      <div className="sticky top-0 z-10 bg-surface-card border-b border-line">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-sunken transition-colors">
            <ArrowLeft size={18} className="text-ink" />
          </Link>
          <h1 className="text-[17px] font-semibold text-ink">Sluit de poort</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-6 space-y-7">
        <section className="space-y-3">
          <h2 className="text-[18px] font-semibold text-ink">Hoe staat je batterij nu?</h2>
          {BATTERY_OPTIONS.map((o) => (
            <CardOption key={o.value} selected={battery === o.value} onClick={() => setBattery(o.value)} title={o.label} description={o.description} />
          ))}
        </section>

        <section className="space-y-2">
          <h2 className="text-[18px] font-semibold text-ink">Wat leg ik neer?</h2>
          <p className="text-[13px] text-ink-soft">Wat neem je vanavond niet mee naar bed?</p>
          <textarea rows={3} value={layDown} onChange={(e) => setLayDown(e.target.value)} className={textarea} />
        </section>

        <section className="space-y-2">
          <h2 className="text-[18px] font-semibold text-ink">Wat telt wel?</h2>
          <p className="text-[13px] text-ink-soft">Iets dat vandaag klopte, hoe klein ook.</p>
          <textarea rows={3} value={counts} onChange={(e) => setCounts(e.target.value)} className={textarea} />
        </section>

        <section className="space-y-2">
          <h2 className="text-[18px] font-semibold text-ink">Loslaat-prullenbak</h2>
          <p className="text-[13px] text-ink-soft">Zet er per regel iets in dat je definitief loslaat.</p>
          <textarea rows={3} value={release} onChange={(e) => setRelease(e.target.value)} className={textarea} />
        </section>

        {saveError && <p className="text-[13px] text-red-600">{saveError}</p>}

        <button
          type="button"
          onClick={closeGate}
          disabled={!battery || saving}
          className="w-full py-3 rounded-[14px] bg-primary text-white font-bold text-[14px] disabled:opacity-40"
        >
          {saving ? 'Bezig...' : 'Sluit de poort'}
        </button>

        <EmergencyButton />
      </div>
      <BottomNav />
    </div>
  );
}
