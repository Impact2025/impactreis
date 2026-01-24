'use client';

import { useState } from 'react';
import { Heart, Sparkles, Eye } from 'lucide-react';

interface GratitudeTrioProps {
  values: string[];
  onChange: (values: string[]) => void;
}

const prompts = [
  { icon: Heart, label: 'Relatie', placeholder: 'Een persoon of relatie waar je dankbaar voor bent...', color: 'from-pink-500 to-rose-600' },
  { icon: Sparkles, label: 'Kans', placeholder: 'Een kans of mogelijkheid waar je dankbaar voor bent...', color: 'from-amber-500 to-orange-600' },
  { icon: Eye, label: 'Eenvoud', placeholder: 'Iets eenvoudigs dat je vaak over het hoofd ziet...', color: 'from-emerald-500 to-green-600' },
];

export function GratitudeTrio({ values, onChange }: GratitudeTrioProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const updateValue = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  const completedCount = values.filter(v => v.trim().length > 0).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">3 Dankbaarheden</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Voel elke dankbaarheid in je lichaam
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  values[i]?.trim()
                    ? 'bg-emerald-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Gratitude Items */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {prompts.map((prompt, index) => {
          const Icon = prompt.icon;
          const isActive = activeIndex === index;
          const hasValue = values[index]?.trim().length > 0;

          return (
            <div
              key={index}
              className={`p-4 transition-colors ${
                isActive ? 'bg-slate-50 dark:bg-slate-800/50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 bg-gradient-to-br ${prompt.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {prompt.label}
                    </span>
                    {hasValue && (
                      <span className="text-xs text-emerald-500 font-medium">VOELT</span>
                    )}
                  </div>
                  <textarea
                    value={values[index] || ''}
                    onChange={(e) => updateValue(index, e.target.value)}
                    onFocus={() => setActiveIndex(index)}
                    onBlur={() => setActiveIndex(null)}
                    placeholder={prompt.placeholder}
                    rows={2}
                    className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none text-sm"
                  />
                  {isActive && (
                    <p className="text-xs text-slate-400 mt-2 italic">
                      Sluit je ogen en voel deze dankbaarheid in je hart...
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with instruction */}
      {completedCount === 3 && (
        <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-t border-pink-200 dark:border-pink-800">
          <p className="text-sm text-pink-700 dark:text-pink-300 text-center font-medium">
            Neem 30 seconden om al deze dankbaarheden tegelijk te voelen in je hart
          </p>
        </div>
      )}
    </div>
  );
}
