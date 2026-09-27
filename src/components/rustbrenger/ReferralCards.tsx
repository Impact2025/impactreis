'use client';

import { useEffect, useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { EMERGENCY_MESSAGE, REFERRAL_MESSAGE, needsReferral, parseBattery, type BatteryReading } from '@/lib/rustbrenger';

function parseData(raw: unknown): Record<string, unknown> | null {
  try {
    const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return p && typeof p === 'object' ? (p as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Toont de harde doorverwijsregel als de batterij meerdere dagen achter elkaar rood was. */
export function RedStreakReferral({ today }: { today: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    fetch('/api/logs', { headers: { Authorization: `Bearer ${AuthService.getToken()}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: { type: string; date_string: string; data: unknown }[]) => {
        const readings: BatteryReading[] = rows
          .filter((r) => r.type === 'morning')
          .map((r) => ({ date: r.date_string, battery: parseBattery(parseData(r.data)?.battery) }));
        setShow(needsReferral(readings, today));
      })
      .catch(() => {});
  }, [today]);
  if (!show) return null;
  return (
    <div className="rounded-[16px] border border-line bg-surface-sunken p-5 flex gap-3" role="status">
      <HeartHandshake size={20} className="text-primary shrink-0 mt-0.5" />
      <p className="text-[13px] text-ink leading-relaxed">{REFERRAL_MESSAGE}</p>
    </div>
  );
}

/** Noodknop "Hoofd zit vol": geen coachgesprek, alleen rust en doorverwijzing. */
export function EmergencyButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full py-3 rounded-[14px] bg-surface-sunken text-ink text-[14px] font-semibold"
      >
        Hoofd zit vol
      </button>
      {open && (
        <div className="rounded-[16px] border border-line p-5">
          <p className="text-[13px] text-ink leading-relaxed">{EMERGENCY_MESSAGE}</p>
        </div>
      )}
    </div>
  );
}
