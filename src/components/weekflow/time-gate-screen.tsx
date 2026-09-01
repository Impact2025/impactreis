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
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-tertiary-soft border-4 border-tertiary mb-4">
            <Clock size={48} className="text-tertiary" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-ink mb-3">
            {title}
          </h1>
          <p className="text-lg text-ink-soft mb-2">
            {message}
          </p>
          <p className="text-2xl font-bold text-tertiary">
            Beschikbaar na {availableTime}
          </p>
        </div>

        {/* Current Time */}
        <div className="bg-surface-card rounded-lg p-4 border border-line mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-soft">
              Huidige tijd:
            </span>
            <span className="text-lg font-bold text-ink">
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
          className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent/90 text-white py-4 rounded-lg font-bold text-lg transition-all hover:shadow-organic"
        >
          <ArrowLeft size={20} />
          Terug naar Dashboard
        </Link>

        {/* Tip */}
        <div className="mt-6 text-center text-sm text-outline">
          💡 Tip: Gebruik deze tijd om aan je dagdoelen te werken!
        </div>
      </div>
    </div>
  );
}
