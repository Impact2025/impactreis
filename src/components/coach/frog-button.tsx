'use client';

import { useEffect, useRef, useState } from 'react';
import { Flame, X, RefreshCw, Phone } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { getToday } from '@/lib/weekflow.service';
import { TIME_WASTER_OPTIONS } from '@/lib/onboarding';

const COUNTDOWN_SECONDS = 15 * 60;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** MECHANISME 1 — De Kikker-knop: on-demand uitsteldoder. Start een 15-minuten countdown en
 *  toont 3 kant-en-klare openingszinnen, zodat het gesprek zonder nadenken begonnen kan worden.
 *  Geen audioprimer (geen voice-assets beschikbaar) — de tekst doet hetzelfde werk. */
export function FrogButton() {
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('Je coach');
  const [lines, setLines] = useState<string[]>([]);
  const [todaysFrog, setTodaysFrog] = useState<string | null>(null);
  const [checkedToday, setCheckedToday] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Laat vooraf zien wélke taak dit betreft — niet pas na het klikken. Zonder dit weet niemand,
  // laat staan een nieuwe gebruiker, waar deze knop over gaat vóórdat de 15 minuten al lopen.
  useEffect(() => {
    const todayStr = getToday('Europe/Amsterdam');
    api.logs.getByTypeAndDate('morning', todayStr)
      .then((logs: any[]) => {
        const raw = logs?.[0]?.data;
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const category = data?.kikkerCategory as string | undefined;
        if (category) {
          const label = TIME_WASTER_OPTIONS.find((o) => o.value === category)?.label ?? category;
          setTodaysFrog(data?.kikkerDetail ? `${label} — ${data.kikkerDetail}` : label);
        }
      })
      .catch(() => {})
      .finally(() => setCheckedToday(true));
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const startSession = async () => {
    setOpen(true);
    setSeconds(COUNTDOWN_SECONDS);
    setRunning(true);
    setLoading(true);
    try {
      const res = await fetch('/api/coach/kikker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AuthService.getToken()}`,
        },
        body: JSON.stringify({ task: todaysFrog }),
      });
      if (res.ok) {
        const data = await res.json();
        setDisplayName(data.displayName ?? 'Je coach');
        setLines(data.lines ?? []);
      }
    } catch {
      // stil — de countdown werkt ook zonder gegenereerde zinnen
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setRunning(false);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={startSession}
        className="w-full flex items-center gap-3 rounded-card bg-red-600 p-4 mb-6 hover:bg-red-700 transition-colors shadow-organic"
      >
        <div className="w-10 h-10 rounded-[10px] bg-white/15 flex items-center justify-center flex-shrink-0">
          <Flame size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-bold text-white">Doorbreek Uitstel</p>
          <p className="text-[11px] text-white/70 leading-snug truncate">
            {!checkedToday ? '15 minuten, geen nadenken' : todaysFrog ? `Vandaag: ${todaysFrog}` : 'Nog geen kikker gekozen — vul eerst je ochtendritueel in'}
          </p>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[20px] p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink">{displayName} zegt: stop met uitstellen</p>
                {todaysFrog && <p className="text-[12px] text-ink-soft truncate mt-0.5">{todaysFrog}</p>}
              </div>
              <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-sunken shrink-0">
                <X size={16} className="text-ink-soft" />
              </button>
            </div>

            <div className="text-center py-4">
              <p className={`text-[40px] font-bold tabular-nums ${seconds === 0 ? 'text-red-600' : 'text-ink'}`}>
                {formatTime(seconds)}
              </p>
              <p className="text-[12px] text-ink-soft mt-1">
                {seconds === 0 ? 'Tijd om. Heb je gebeld?' : 'Telefoon pakken, nu.'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-medium text-ink-soft uppercase tracking-wider">Openingszinnen — kies er één</p>
              {loading ? (
                <div className="flex items-center gap-2 text-[13px] text-ink-soft py-3">
                  <RefreshCw size={14} className="animate-spin" /> Zinnen genereren...
                </div>
              ) : lines.length > 0 ? (
                lines.map((line, i) => (
                  <div key={i} className="rounded-[12px] bg-surface-sunken px-4 py-3 flex items-start gap-2.5">
                    <Phone size={14} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-[13px] text-ink leading-relaxed">{line}</p>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-ink-soft py-2">Geen zinnen beschikbaar — bel toch. Nu.</p>
              )}
            </div>

            <button
              onClick={close}
              className="w-full py-3 rounded-[14px] bg-primary text-white font-bold text-[14px]"
            >
              Ik pak nu de telefoon
            </button>
          </div>
        </div>
      )}
    </>
  );
}
