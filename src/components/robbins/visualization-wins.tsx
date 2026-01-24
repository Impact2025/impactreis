'use client';

import { useState } from 'react';
import { Target, Eye, Sparkles, Check } from 'lucide-react';

interface VisualizationWinsProps {
  values: string[];
  onChange: (values: string[]) => void;
}

export function VisualizationWins({ values, onChange }: VisualizationWinsProps) {
  const [visualizedIndex, setVisualizedIndex] = useState<Set<number>>(new Set());

  const updateValue = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  const markAsVisualized = (index: number) => {
    setVisualizedIndex(prev => new Set([...prev, index]));
  };

  const allVisualized = visualizedIndex.size === 3 && values.every(v => v.trim().length > 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">3 Wins Visualisatie</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Zie vandaag als al voltooid - voel het succes
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-200 dark:border-violet-800">
        <p className="text-sm text-violet-700 dark:text-violet-300">
          <strong>Instructie:</strong> Schrijf 3 dingen op die je vandaag wilt bereiken,
          en visualiseer ze als <em>al voltooid</em>. Sluit je ogen en voel hoe het voelt om te winnen.
        </p>
      </div>

      {/* Win Items */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {[0, 1, 2].map((index) => {
          const hasValue = values[index]?.trim().length > 0;
          const isVisualized = visualizedIndex.has(index);

          return (
            <div key={index} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  isVisualized
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {isVisualized ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={values[index] || ''}
                    onChange={(e) => updateValue(index, e.target.value)}
                    placeholder={`Win ${index + 1}: Ik heb vandaag...`}
                    className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />

                  {hasValue && !isVisualized && (
                    <button
                      onClick={() => markAsVisualized(index)}
                      className="mt-2 flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                    >
                      <Eye size={14} />
                      Klik na visualisatie (30 sec)
                    </button>
                  )}

                  {isVisualized && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <Sparkles size={14} />
                      Gevisualiseerd als voltooid
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {allVisualized && (
        <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Alle wins gevisualiseerd! Je dag is al gewonnen.</span>
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Tony Robbins Quote */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-600 dark:text-slate-400 italic text-center">
          "The past does not equal the future. Your present decisions create your future."
          <span className="block text-xs text-slate-400 mt-1">— Tony Robbins</span>
        </p>
      </div>
    </div>
  );
}
