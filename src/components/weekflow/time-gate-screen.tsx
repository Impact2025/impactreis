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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-4 border-amber-200 dark:border-amber-800 mb-4">
            <Clock size={48} className="text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            {title}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
            {message}
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            Beschikbaar na {availableTime}
          </p>
        </div>

        {/* Current Time */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Huidige tijd:
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
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
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-4 rounded-xl font-bold text-lg transition-all hover:shadow-lg"
        >
          <ArrowLeft size={20} />
          Terug naar Dashboard
        </Link>

        {/* Tip */}
        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-500">
          💡 Tip: Gebruik deze tijd om aan je dagdoelen te werken!
        </div>
      </div>
    </div>
  );
}
