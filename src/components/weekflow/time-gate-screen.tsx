'use client';

import Link from 'next/link';
import { Clock, ArrowLeft } from 'lucide-react';

interface TimeGateScreenProps {
  title: string;
  message: string;
  availableTime: string;
}

/**
 * TimeGateScreen Component
 *
 * Shown when user tries to access a time-gated ritual before it's available
 * Example: Evening ritual before 17:00
 */
export function TimeGateScreen({ title, message, availableTime }: TimeGateScreenProps) {
  return (
    <div className="min-h-screen bg-surface-card flex items-center justify-center p-5">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary-soft">
            <Clock size={28} className="text-tertiary" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h1 className="text-[20px] font-bold text-ink tracking-tight mb-2">
            {title}
          </h1>
          <p className="text-[14px] text-ink-soft mb-2">
            {message}
          </p>
          <p className="text-[16px] font-bold text-tertiary">
            Beschikbaar na {availableTime}
          </p>
        </div>

        {/* Current Time */}
        <div className="rounded-[16px] border border-line p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ink-soft">
              Huidige tijd:
            </span>
            <span className="text-[15px] font-bold text-ink">
              {new Date().toLocaleTimeString('nl-NL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2.5 w-full py-4 bg-surface-inverse text-white text-[15px] font-semibold rounded-[16px] active:scale-[0.98] transition-transform"
        >
          <ArrowLeft size={18} />
          Terug naar Dashboard
        </Link>

        {/* Tip */}
        <p className="mt-5 text-center text-[12px] text-ink-soft">
          Tip: gebruik deze tijd om aan je dagdoelen te werken.
        </p>
      </div>
    </div>
  );
}
