'use client';

import { useState } from 'react';
import { WheelOfLifeResults } from '@/types';

interface WheelOfLifeProps {
  initialValues?: WheelOfLifeResults;
  onComplete?: (results: WheelOfLifeResults) => void;
  readOnly?: boolean;
}

const categories = [
  { key: 'physical', label: 'Fysiek/Gezondheid', color: '#ef4444', description: 'Energie, fitness, voeding, slaap' },
  { key: 'emotional', label: 'Emotioneel', color: '#f97316', description: 'Geluk, innerlijke rust, zelfvertrouwen' },
  { key: 'relationships', label: 'Relaties', color: '#eab308', description: 'Partner, familie, vrienden' },
  { key: 'financial', label: 'Financieel', color: '#22c55e', description: 'Inkomen, spaargeld, financiële vrijheid' },
  { key: 'career', label: 'Carrière/Business', color: '#06b6d4', description: 'Werk, groei, voldoening' },
  { key: 'time', label: 'Tijd/Vrijheid', color: '#3b82f6', description: 'Balans, controle over je agenda' },
  { key: 'spiritual', label: 'Spiritueel', color: '#8b5cf6', description: 'Zingeving, waarden, inner peace' },
  { key: 'contribution', label: 'Bijdrage', color: '#ec4899', description: 'Impact, anderen helpen, legacy' },
];

export function WheelOfLife({ initialValues, onComplete, readOnly = false }: WheelOfLifeProps) {
  const [values, setValues] = useState<WheelOfLifeResults>(
    initialValues || {
      physical: 5,
      emotional: 5,
      relationships: 5,
      financial: 5,
      career: 5,
      time: 5,
      spiritual: 5,
      contribution: 5,
    }
  );

  const [showResults, setShowResults] = useState(!!initialValues);

  const handleChange = (key: keyof WheelOfLifeResults, value: number) => {
    if (readOnly) return;
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleComplete = () => {
    setShowResults(true);
    onComplete?.(values);
  };

  const average = Object.values(values).reduce((a, b) => a + b, 0) / 8;
  const lowest = Object.entries(values).reduce((a, b) => (a[1] < b[1] ? a : b));
  const highest = Object.entries(values).reduce((a, b) => (a[1] > b[1] ? a : b));

  // SVG Wheel
  const centerX = 200;
  const centerY = 200;
  const maxRadius = 150;

  const getCoordinates = (index: number, value: number) => {
    const angle = (index * 45 - 90) * (Math.PI / 180);
    const radius = (value / 10) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const pathData = categories
    .map((_, index) => {
      const key = categories[index].key as keyof WheelOfLifeResults;
      const coords = getCoordinates(index, values[key]);
      return `${index === 0 ? 'M' : 'L'} ${coords.x} ${coords.y}`;
    })
    .join(' ') + ' Z';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Wheel of Life</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Score elk levensgebied van 1-10 op basis van je huidige tevredenheid
        </p>
      </div>

      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Wheel Visualization */}
          <div className="flex-shrink-0 flex justify-center">
            <svg width="400" height="400" viewBox="0 0 400 400" className="max-w-full h-auto">
              {/* Grid circles */}
              {[2, 4, 6, 8, 10].map((level) => (
                <circle
                  key={level}
                  cx={centerX}
                  cy={centerY}
                  r={(level / 10) * maxRadius}
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                  strokeWidth="1"
                />
              ))}

              {/* Radial lines */}
              {categories.map((_, index) => {
                const coords = getCoordinates(index, 10);
                return (
                  <line
                    key={index}
                    x1={centerX}
                    y1={centerY}
                    x2={coords.x}
                    y2={coords.y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Filled area */}
              <path
                d={pathData}
                fill="url(#wheelGradient)"
                fillOpacity="0.3"
                stroke="url(#wheelGradient)"
                strokeWidth="2"
              />

              {/* Points */}
              {categories.map((cat, index) => {
                const key = cat.key as keyof WheelOfLifeResults;
                const coords = getCoordinates(index, values[key]);
                return (
                  <circle
                    key={cat.key}
                    cx={coords.x}
                    cy={coords.y}
                    r="8"
                    fill={cat.color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer"
                  />
                );
              })}

              {/* Labels */}
              {categories.map((cat, index) => {
                const coords = getCoordinates(index, 12);
                return (
                  <text
                    key={cat.key}
                    x={coords.x}
                    y={coords.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-medium fill-slate-600 dark:fill-slate-400"
                  >
                    {cat.label.split('/')[0]}
                  </text>
                );
              })}

              {/* Gradient definition */}
              <defs>
                <linearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Sliders */}
          <div className="flex-1 space-y-4">
            {categories.map((cat) => {
              const key = cat.key as keyof WheelOfLifeResults;
              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {cat.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {values[key]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={values[key]}
                    onChange={(e) => handleChange(key, parseInt(e.target.value))}
                    disabled={readOnly}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      accentColor: cat.color,
                    }}
                  />
                  <p className="text-xs text-slate-400 mt-1">{cat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {showResults && (
          <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Analyse</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{average.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Gemiddelde</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{highest[1]}</p>
                <p className="text-xs text-slate-500">
                  Sterkste: {categories.find((c) => c.key === highest[0])?.label}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{lowest[1]}</p>
                <p className="text-xs text-slate-500">
                  Focus: {categories.find((c) => c.key === lowest[0])?.label}
                </p>
              </div>
            </div>
          </div>
        )}

        {!readOnly && !showResults && (
          <button
            onClick={handleComplete}
            className="mt-6 w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Opslaan & Analyseren
          </button>
        )}
      </div>
    </div>
  );
}
