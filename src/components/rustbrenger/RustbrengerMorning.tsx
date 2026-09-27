'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { getToday } from '@/lib/weekflow.service';
import { useRitualStatus } from '@/hooks/useRitualStatus';
import { queryKeys } from '@/lib/query-client';
import { CardOption } from '@/components/ui/dna-controls';
import { BottomNav } from '@/components/ui/bottom-nav';
import { BATTERY_ENERGY, BATTERY_OPTIONS, parseBattery, type Battery } from '@/lib/rustbrenger';
import { EmergencyButton, RedStreakReferral } from './ReferralCards';

const MAX_PARKED = 5;

// Ochtendritueel van de Rustbrenger-editie: batterij, Ene Zaak en een niet-doen-lijst (parkeervak).
// Slaat op als gewoon `morning`-log met dezelfde velden die coach en ritual-status al lezen
// (`energyLevel`, `intentie`), plus `battery` en `nietDoen`.
export function RustbrengerMorning() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { settings } = useRitualStatus();
  const today = getToday(settings.timezone);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [battery, setBattery] = useState<Battery | null>(null);
  const [eneZaak, setEneZaak] = useState('');
  const [parked, setParked] = useState<string[]>(['']);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) { router.push('/auth/login'); return; }
    api.logs.getByTypeAndDate('morning', today)
      .then((logs: { data: unknown }[]) => {
        const raw = Array.isArray(logs) && logs[0] ? logs[0].data : null;
        const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (p) {
          setBattery(parseBattery(p.battery));
          setEneZaak(typeof p.intentie === 'string' ? p.intentie : '');
          if (Array.isArray(p.nietDoen) && p.nietDoen.length > 0) setParked(p.nietDoen.filter((x: unknown) => typeof x === 'string'));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router, today]);

  const updateParked = (i: number, value: string) => setParked((prev) => prev.map((p, idx) => (idx === i ? value : p)));

  const save = async () => {
    if (!battery || !eneZaak.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.logs.create({
        type: 'morning',
        date: today,
        mode: 'quick',
        dayType: battery === 'red' ? 'free' : 'focus',
        battery,
        energyLevel: BATTERY_ENERGY[battery],
        intentie: eneZaak.trim(),
        nietDoen: parked.map((p) => p.trim()).filter(Boolean),
      });
      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/coach/analyse', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }).catch(() => {});
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.ritualStatus });
      setDone(true);
      setTimeout(() => router.push('/dashboard'), 2000);
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

  if (done) {
    return (
      <div className="min-h-screen bg-surface-card flex flex-col items-center justify-center gap-3 px-5">
        <CheckCircle size={40} className="text-primary" />
        <p className="text-[16px] font-semibold text-ink">Dat is genoeg voor de ochtend.</p>
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
          <h1 className="text-[17px] font-semibold text-ink">Ochtend</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-6 space-y-7">
        <RedStreakReferral today={today} />

        <section className="space-y-3">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Hoe staat je batterij?</h2>
            <p className="text-[13px] text-ink-soft mt-1">Eerlijk, niet gewenst.</p>
          </div>
          {BATTERY_OPTIONS.map((o) => (
            <CardOption key={o.value} selected={battery === o.value} onClick={() => setBattery(o.value)} title={o.label} description={o.description} />
          ))}
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Je Ene Zaak</h2>
            <p className="text-[13px] text-ink-soft mt-1">
              {battery === 'red' ? 'Kies iets kleins, of niets. Rust telt ook.' : 'Het enige dat vandaag echt telt. De rest is bonus.'}
            </p>
          </div>
          <input
            type="text"
            value={eneZaak}
            onChange={(e) => setEneZaak(e.target.value)}
            placeholder="Mijn Ene Zaak vandaag"
            maxLength={200}
            className="w-full px-4 py-3 rounded-[14px] bg-surface-sunken border border-transparent text-[15px] outline-none focus:border-primary focus:bg-white transition-all"
          />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Niet-doen-lijst</h2>
            <p className="text-[13px] text-ink-soft mt-1">Wat parkeer je vandaag bewust? Het mag blijven liggen.</p>
          </div>
          {parked.map((p, i) => (
            <input
              key={i}
              type="text"
              value={p}
              onChange={(e) => updateParked(i, e.target.value)}
              placeholder="Dit laat ik vandaag liggen"
              maxLength={120}
              className="w-full px-4 py-3 rounded-[14px] bg-surface-sunken border border-transparent text-[15px] outline-none focus:border-primary focus:bg-white transition-all"
            />
          ))}
          {parked.length < MAX_PARKED && (
            <button type="button" onClick={() => setParked((prev) => [...prev, ''])} className="text-[13px] font-semibold text-primary">
              Nog iets parkeren
            </button>
          )}
        </section>

        {saveError && <p className="text-[13px] text-red-600">{saveError}</p>}

        <button
          type="button"
          onClick={save}
          disabled={!battery || !eneZaak.trim() || saving}
          className="w-full py-3 rounded-[14px] bg-primary text-white font-bold text-[14px] disabled:opacity-40"
        >
          {saving ? 'Bezig...' : 'Klaar voor vandaag'}
        </button>

        <EmergencyButton />
      </div>
      <BottomNav />
    </div>
  );
}
