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
    <div className="bg-white  rounded-2xl border border-line  overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-line ">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent rounded-xl flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-ink ">3 Wins Visualisatie</h3>
            <p className="text-sm text-ink-soft ">
              Zie vandaag als al voltooid - voel het succes
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-accent-soft  border-b border-accent-soft ">
        <p className="text-sm text-accent ">
          <strong>Instructie:</strong> Schrijf 3 dingen op die je vandaag wilt bereiken,
          en visualiseer ze als <em>al voltooid</em>. Sluit je ogen en voel hoe het voelt om te winnen.
        </p>
      </div>

      {/* Win Items */}
      <div className="divide-y divide-line ">
        {[0, 1, 2].map((index) => {
          const hasValue = values[index]?.trim().length > 0;
          const isVisualized = visualizedIndex.has(index);

          return (
            <div key={index} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  isVisualized
                    ? 'bg-primary text-white'
                    : 'bg-surface-card  text-ink-soft'
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
                    className="w-full bg-transparent border-none text-ink  placeholder:text-ink-soft focus:outline-none"
                  />

                  {hasValue && !isVisualized && (
                    <button
                      onClick={() => markAsVisualized(index)}
                      className="mt-2 flex items-center gap-2 text-sm text-accent  hover:text-accent  transition-colors"
                    >
                      <Eye size={14} />
                      Klik na visualisatie (30 sec)
                    </button>
                  )}

                  {isVisualized && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-primary ">
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
        <div className="p-4 bg-gradient-to-r from-primary to-primary text-white text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Alle wins gevisualiseerd! Je dag is al gewonnen.</span>
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Tony Robbins Quote */}
      <div className="p-4 bg-surface-card  border-t border-line ">
        <p className="text-sm text-ink-soft  italic text-center">
          "The past does not equal the future. Your present decisions create your future."
          <span className="block text-xs text-ink-soft mt-1">— Tony Robbins</span>
        </p>
      </div>
    </div>
  );
}
