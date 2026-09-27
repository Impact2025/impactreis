'use client';

import { useEffect, useState } from 'react';
import { EmergencyButton } from './ReferralCards';

// Box-breathing: 4 seconden in, 4 vast, 4 uit, 4 vast.
const PHASES = ['Adem in', 'Houd vast', 'Adem uit', 'Houd vast'] as const;
const PHASE_SECONDS = 4;

/** Dwingende pauze na een focusblok in de Rustbrenger-editie: gedimd scherm, box-breathing en
 *  geen to-do's of knoppen tot de pauze om is. Alleen de noodknop blijft beschikbaar. */
export function BreathingBreak({ minutes, onDone }: { minutes: number; onDone: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const phase = Math.floor(tick / PHASE_SECONDS) % PHASES.length;
  const expanded = phase === 0 || phase === 1;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col items-center justify-center gap-8 px-6">
      <p className="text-[13px] uppercase tracking-widest text-slate-400">Pauze</p>
      <div
        className="w-40 h-40 rounded-full border border-slate-500 flex items-center justify-center transition-transform ease-in-out"
        style={{ transform: expanded ? 'scale(1.25)' : 'scale(0.85)', transitionDuration: `${PHASE_SECONDS}s` }}
        aria-hidden="true"
      />
      <p className="text-[20px] font-semibold" aria-live="polite">{PHASES[phase]}</p>
      <p className="text-[14px] text-slate-400 tabular-nums">{mm}:{ss}</p>
      <div className="w-full max-w-xs">
        {secondsLeft === 0 ? (
          <button type="button" onClick={onDone} className="w-full py-3 rounded-[14px] bg-slate-100 text-slate-900 text-[14px] font-semibold">
            Ik ben er weer
          </button>
        ) : (
          <EmergencyButton />
        )}
      </div>
    </div>
  );
}
