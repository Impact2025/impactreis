'use client';

import { useState } from 'react';
import { Zap, TrendingUp, ArrowRight } from 'lucide-react';

interface StateCheckProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  showImprovement?: boolean;
  previousValue?: number;
}

const stateEmojis = ['😫', '😟', '😐', '🙂', '😊', '😄', '🔥', '⚡', '🚀', '💎'];
const stateLabels = ['Uitgeput', 'Laag', 'Matig', 'Oké', 'Goed', 'Sterk', 'Energiek', 'Krachtig', 'On Fire', 'Unstoppable'];

export function StateCheck({
  label,
  description,
  value,
  onChange,
  showImprovement = false,
  previousValue
}: StateCheckProps) {
  const improvement = previousValue !== undefined ? value - previousValue : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{label}</h3>
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
        </div>

        {showImprovement && improvement !== 0 && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            improvement > 0
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}>
            <TrendingUp size={14} className={improvement < 0 ? 'rotate-180' : ''} />
            {improvement > 0 ? '+' : ''}{improvement}
          </div>
        )}
      </div>

      {/* State Display */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">{stateEmojis[value - 1]}</div>
        <div className="text-lg font-semibold text-slate-900 dark:text-white">
          {stateLabels[value - 1]}
        </div>
        <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
          {value}<span className="text-lg text-slate-400">/10</span>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-3">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-3 bg-gradient-to-r from-red-400 via-yellow-400 to-emerald-400 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-slate-300
            [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>Laag</span>
          <span>Gemiddeld</span>
          <span>Hoog</span>
        </div>
      </div>

      {/* Quick Select */}
      <div className="flex justify-center gap-1 mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
              value === num
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}

interface StateComparisonProps {
  beforeValue: number;
  afterValue: number;
}

export function StateComparison({ beforeValue, afterValue }: StateComparisonProps) {
  const improvement = afterValue - beforeValue;
  const improvementPercent = Math.round((improvement / beforeValue) * 100);

  return (
    <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp size={20} />
        State Transformatie
      </h3>

      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="text-4xl mb-1">{stateEmojis[beforeValue - 1]}</div>
          <div className="text-lg font-bold">{beforeValue}</div>
          <div className="text-xs text-white/70">Voor</div>
        </div>

        <div className="flex flex-col items-center">
          <ArrowRight size={24} className="text-white/70" />
          <div className={`text-sm font-bold mt-1 ${improvement > 0 ? 'text-yellow-300' : 'text-red-300'}`}>
            {improvement > 0 ? '+' : ''}{improvement}
          </div>
        </div>

        <div className="text-center">
          <div className="text-4xl mb-1">{stateEmojis[afterValue - 1]}</div>
          <div className="text-lg font-bold">{afterValue}</div>
          <div className="text-xs text-white/70">Na</div>
        </div>
      </div>

      {improvement > 0 && (
        <div className="mt-4 text-center">
          <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
            {improvementPercent}% energie boost door priming!
          </span>
        </div>
      )}
    </div>
  );
}
