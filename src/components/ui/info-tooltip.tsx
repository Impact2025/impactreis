'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Info, Lightbulb, X } from 'lucide-react';

interface InfoTooltipProps {
  /** Korte titel boven de uitleg, bv. de vraag zelf */
  title?: string;
  /** Uitgebreide "pro" uitleg — waarom deze vraag/dit veld ertoe doet */
  explanation: string;
  /** Concrete suggesties/voorbeelden om de gebruiker op weg te helpen */
  suggestions?: string[];
  /** Grootte van het i-icoontje */
  size?: 'sm' | 'md';
  className?: string;
}

// Info-icoon dat op klik een uitklap-kaart toont met uitgebreide uitleg + suggesties.
// Klik-gestuurd (niet hover) zodat het ook op mobiel/touch werkt.
export function InfoTooltip({ title, explanation, suggestions = [], size = 'sm', className = '' }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const iconSize = size === 'sm' ? 14 : 17;
  const btnSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  return (
    <div ref={wrapperRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={title ? `Meer uitleg over: ${title}` : 'Meer uitleg'}
        className={`${btnSize} shrink-0 rounded-full flex items-center justify-center text-ink-soft bg-surface-sunken hover:bg-primary-muted hover:text-primary transition-colors`}
      >
        <Info size={iconSize} />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 top-full mt-2 left-0 w-72 max-w-[80vw] rounded-[14px] border border-line bg-white shadow-organic-lg p-4 text-left"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-primary">
              <Lightbulb size={13} />
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase">Pro uitleg</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Sluiten"
              className="text-ink-soft hover:text-ink shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          {title && <p className="text-[13px] font-semibold text-ink mb-1.5 leading-snug">{title}</p>}
          <p className="text-[12px] text-ink-soft leading-relaxed whitespace-pre-line">{explanation}</p>

          {suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-line">
              <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-ink-soft mb-1.5">Suggesties</p>
              <ul className="space-y-1">
                {suggestions.map((s, i) => (
                  <li key={i} className="text-[12px] text-ink leading-relaxed flex gap-1.5">
                    <span className="text-primary shrink-0">&bull;</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
