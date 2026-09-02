'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';

export interface TourStep {
  /** CSS-selector van het element om uit te lichten, bv. '[data-tour="focus"]' */
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom';
}

interface WelcomeTourProps {
  /** Unieke id per tour — bepaalt de localStorage-sleutel zodat 'm maar 1x automatisch toont */
  tourId: string;
  steps: TourStep[];
  /** Forceer tonen (bv. via een "Help / Rondleiding" knop), ongeacht eerdere afronding */
  forceOpen?: boolean;
  onForceOpenHandled?: () => void;
}

const storageKey = (tourId: string) => `welcomeTourDone_${tourId}`;

interface Rect { top: number; left: number; width: number; height: number }

export function WelcomeTour({ tourId, steps, forceOpen, onForceOpenHandled }: WelcomeTourProps) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (forceOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initieert tour-state vanuit een externe trigger (help-knop)
      setStepIndex(0);
      setActive(true);
      onForceOpenHandled?.();
      return;
    }
    try {
      if (!localStorage.getItem(storageKey(tourId))) setActive(true);
    } catch {
      // localStorage niet beschikbaar — geen tour, geen crash
    }
  }, [tourId, forceOpen, onForceOpenHandled]);

  const measure = useCallback(() => {
    if (!active) return;
    const step = steps[stepIndex];
    if (!step) return;
    const el = document.querySelector(step.target);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [active, stepIndex, steps]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- meet en synchroniseert de spotlight-positie met het DOM-element van de huidige stap
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const t = setTimeout(measure, 300); // na scrollIntoView opnieuw meten
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      clearTimeout(t);
    };
  }, [measure]);

  const finish = () => {
    setActive(false);
    try { localStorage.setItem(storageKey(tourId), 'true'); } catch { /* best-effort */ }
  };

  if (!active || steps.length === 0) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const pad = 8;

  const spotlight = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Kaart onder of boven de spotlight plaatsen, met een marge voor de viewport-randen.
  const cardTop = spotlight
    ? step.placement === 'top'
      ? Math.max(16, spotlight.top - 172)
      : Math.min(window.innerHeight - 190, spotlight.top + spotlight.height + 14)
    : window.innerHeight / 2 - 90;
  const cardLeft = spotlight
    ? Math.min(Math.max(16, spotlight.left), window.innerWidth - 336)
    : window.innerWidth / 2 - 160;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Welkomstoer">
      {/* Verduisterde achtergrond met uitgesneden spotlight via box-shadow-truc */}
      <div
        className="fixed transition-all duration-300 rounded-[16px] pointer-events-none"
        style={
          spotlight
            ? {
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
                boxShadow: '0 0 0 9999px rgba(17,20,17,0.72)',
                outline: '2px solid var(--color-primary, #4f6b4a)',
              }
            : { inset: 0, boxShadow: '0 0 0 9999px rgba(17,20,17,0.72)' }
        }
      />
      {/* Klik op de verduisterde achtergrond sluit de tour, klik op de kaart niet */}
      <div className="absolute inset-0" onClick={finish} />

      <div
        className="absolute w-[320px] max-w-[85vw] rounded-[16px] bg-white shadow-organic-lg border border-line p-5 transition-all duration-300"
        style={{ top: cardTop, left: cardLeft }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-primary">
            <Sparkles size={13} />
            <span className="text-[9px] font-bold tracking-[0.15em] uppercase">
              Rondleiding &middot; {stepIndex + 1}/{steps.length}
            </span>
          </div>
          <button type="button" onClick={finish} aria-label="Tour sluiten" className="text-ink-soft hover:text-ink">
            <X size={15} />
          </button>
        </div>

        <p className="text-[14px] font-bold text-ink mb-1.5 leading-snug">{step.title}</p>
        <p className="text-[12.5px] text-ink-soft leading-relaxed mb-4 whitespace-pre-line">{step.content}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === stepIndex ? 'bg-primary' : 'bg-line'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => setStepIndex((s) => s - 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-soft hover:bg-surface-sunken transition-colors"
                aria-label="Vorige"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={finish}
                className="px-4 py-2 rounded-[12px] bg-primary text-white text-[12px] font-bold"
              >
                Aan de slag
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepIndex((s) => s + 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-white"
                aria-label="Volgende"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
