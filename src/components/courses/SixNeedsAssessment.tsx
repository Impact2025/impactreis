'use client';

import { useState } from 'react';
import { SixNeedsResults } from '@/types';
import { Shield, Shuffle, Star, Heart, TrendingUp, Gift, ChevronRight, ChevronLeft } from 'lucide-react';

interface SixNeedsAssessmentProps {
  initialValues?: SixNeedsResults;
  onComplete?: (results: SixNeedsResults) => void;
  readOnly?: boolean;
}

const needs = [
  {
    key: 'certainty',
    label: 'Zekerheid',
    icon: Shield,
    color: '#3b82f6',
    description: 'De behoefte aan veiligheid, stabiliteit, comfort en voorspelbaarheid.',
    questions: [
      'Ik heb behoefte aan een vaste routine en structuur',
      'Ik voel me oncomfortabel bij grote veranderingen',
      'Financiële zekerheid is heel belangrijk voor mij',
    ],
  },
  {
    key: 'variety',
    label: 'Variatie',
    icon: Shuffle,
    color: '#f97316',
    description: 'De behoefte aan verandering, avontuur, uitdaging en nieuwe ervaringen.',
    questions: [
      'Ik houd van spontaniteit en onverwachte situaties',
      'Ik zoek actief naar nieuwe uitdagingen',
      'Routine verveelt me snel',
    ],
  },
  {
    key: 'significance',
    label: 'Significantie',
    icon: Star,
    color: '#eab308',
    description: 'De behoefte om je speciaal, uniek, belangrijk of nodig te voelen.',
    questions: [
      'Het is belangrijk dat anderen mij waarderen',
      'Ik wil me onderscheiden van anderen',
      'Erkenning voor mijn prestaties is belangrijk',
    ],
  },
  {
    key: 'connection',
    label: 'Verbinding',
    icon: Heart,
    color: '#ec4899',
    description: 'De behoefte aan liefde, intimiteit en diepe connecties met anderen.',
    questions: [
      'Ik heb sterke, diepe relaties nodig om gelukkig te zijn',
      'Ik voel me het beste wanneer ik me verbonden voel met anderen',
      'Alleen zijn voor lange periodes valt me zwaar',
    ],
  },
  {
    key: 'growth',
    label: 'Groei',
    icon: TrendingUp,
    color: '#22c55e',
    description: 'De behoefte om te leren, te ontwikkelen en beter te worden.',
    questions: [
      'Ik ben constant bezig met zelfontwikkeling',
      'Stilstand voelt als achteruitgang',
      'Ik investeer tijd en geld in leren',
    ],
  },
  {
    key: 'contribution',
    label: 'Bijdrage',
    icon: Gift,
    color: '#8b5cf6',
    description: 'De behoefte om bij te dragen, te geven en verschil te maken voor anderen.',
    questions: [
      'Ik voel me het meest vervuld als ik anderen help',
      'Het maken van impact is belangrijker dan geld verdienen',
      'Ik denk vaak na over mijn legacy',
    ],
  },
];

export function SixNeedsAssessment({ initialValues, onComplete, readOnly = false }: SixNeedsAssessmentProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>(
    initialValues
      ? Object.fromEntries(needs.map((n) => [n.key, [initialValues[n.key as keyof SixNeedsResults] / 3 * 10, initialValues[n.key as keyof SixNeedsResults] / 3 * 10, initialValues[n.key as keyof SixNeedsResults] / 3 * 10]]))
      : Object.fromEntries(needs.map((n) => [n.key, [5, 5, 5]]))
  );
  const [showResults, setShowResults] = useState(!!initialValues);

  const currentNeed = needs[step];
  const isLastStep = step === needs.length - 1;

  const handleAnswer = (questionIndex: number, value: number) => {
    if (readOnly) return;
    setAnswers((prev) => ({
      ...prev,
      [currentNeed.key]: prev[currentNeed.key].map((v, i) => (i === questionIndex ? value : v)),
    }));
  };

  const calculateResults = (): SixNeedsResults => {
    const results: any = {};
    needs.forEach((need) => {
      const sum = answers[need.key].reduce((a, b) => a + b, 0);
      results[need.key] = Math.round((sum / 30) * 10);
    });
    return results;
  };

  const handleComplete = () => {
    const results = calculateResults();
    setShowResults(true);
    onComplete?.(results);
  };

  const results = calculateResults();
  const sortedResults = Object.entries(results)
    .sort(([, a], [, b]) => (b as number) - (a as number));
  const topTwo = sortedResults.slice(0, 2);

  if (showResults) {
    return (
      <div className="bg-white  rounded-2xl border border-line  overflow-hidden">
        <div className="p-6 border-b border-line ">
          <h3 className="text-xl font-semibold text-ink ">
            Jouw 6 Menselijke Behoeften
          </h3>
          <p className="text-sm text-ink-soft  mt-1">
            Je top 2 behoeften bepalen 95% van je gedrag en beslissingen
          </p>
        </div>

        <div className="p-6">
          {/* Top 2 */}
          <div className="mb-8">
            <h4 className="text-sm font-medium text-ink-soft uppercase tracking-wide mb-4">
              Jouw Primaire Behoeften
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {topTwo.map(([key, value], index) => {
                const need = needs.find((n) => n.key === key)!;
                const Icon = need.icon;
                return (
                  <div
                    key={key}
                    className="p-4 rounded-xl border-2"
                    style={{ borderColor: need.color, backgroundColor: `${need.color}10` }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: need.color }}
                      >
                        <Icon className="text-white" size={20} />
                      </div>
                      <div>
                        <span className="text-xs text-ink-soft">#{index + 1}</span>
                        <h5 className="font-semibold text-ink ">{need.label}</h5>
                      </div>
                    </div>
                    <div className="text-2xl font-bold" style={{ color: need.color }}>
                      {value}/10
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Results */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-ink-soft uppercase tracking-wide">
              Volledig Overzicht
            </h4>
            {needs.map((need) => {
              const Icon = need.icon;
              const value = results[need.key as keyof SixNeedsResults];
              return (
                <div key={need.key} className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${need.color}20` }}
                  >
                    <Icon style={{ color: need.color }} size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ink-soft ">
                        {need.label}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: need.color }}>
                        {value}/10
                      </span>
                    </div>
                    <div className="h-2 bg-surface-card  rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${value * 10}%`, backgroundColor: need.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Insight */}
          <div className="mt-8 p-4 bg-accent-soft  rounded-xl border border-accent-soft ">
            <h4 className="font-semibold text-accent  mb-2">
              Inzicht van Tony Robbins
            </h4>
            <p className="text-sm text-accent ">
              {topTwo[0][0] === 'certainty' || topTwo[0][0] === 'variety' || topTwo[0][0] === 'significance' || topTwo[0][0] === 'connection'
                ? 'Je primaire behoeften zijn gericht op overleven en comfort. Om echt vervuld te zijn, focus je op het upgraden naar Groei en Bijdrage.'
                : 'Geweldig! Je primaire behoeften zijn gericht op Groei en Bijdrage - de behoeften van vervulling. Dit is de basis voor een betekenisvol leven.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Question Flow
  const Icon = currentNeed.icon;

  return (
    <div className="bg-white  rounded-2xl border border-line  overflow-hidden">
      {/* Progress */}
      <div className="h-1 bg-surface-card ">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((step + 1) / needs.length) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="p-6 border-b border-line ">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: currentNeed.color }}
          >
            <Icon className="text-white" size={24} />
          </div>
          <div>
            <p className="text-sm text-ink-soft">Behoefte {step + 1} van {needs.length}</p>
            <h3 className="text-xl font-semibold text-ink ">
              {currentNeed.label}
            </h3>
          </div>
        </div>
        <p className="mt-3 text-ink-soft ">{currentNeed.description}</p>
      </div>

      {/* Questions */}
      <div className="p-6 space-y-6">
        {currentNeed.questions.map((question, index) => (
          <div key={index}>
            <p className="text-ink-soft  mb-3">{question}</p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-ink-soft">Oneens</span>
              <div className="flex-1 flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleAnswer(index, value)}
                    className={`flex-1 h-10 rounded-lg font-medium transition-all ${
                      answers[currentNeed.key][index] === value
                        ? 'text-white'
                        : 'bg-surface-card  text-ink-soft  hover:bg-surface-sunken '
                    }`}
                    style={
                      answers[currentNeed.key][index] === value
                        ? { backgroundColor: currentNeed.color }
                        : {}
                    }
                  >
                    {value}
                  </button>
                ))}
              </div>
              <span className="text-sm text-ink-soft">Eens</span>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-line  flex items-center justify-between">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 text-ink-soft  hover:text-ink  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={20} />
          Vorige
        </button>

        {isLastStep ? (
          <button
            onClick={handleComplete}
            className="px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent transition-colors"
          >
            Bekijk Resultaten
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-2 px-6 py-3 bg-surface-inverse  text-white  rounded-xl font-medium hover:bg-surface-inverse  transition-colors"
          >
            Volgende
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
