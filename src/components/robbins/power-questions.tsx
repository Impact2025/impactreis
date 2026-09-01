'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface PowerQuestionsProps {
  type: 'morning' | 'evening';
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

const morningQuestions = [
  {
    id: 'grateful',
    question: 'Waar ben ik nu het meest dankbaar voor in mijn leven?',
    hint: 'Denk aan relaties, kansen, gezondheid, groei...',
  },
  {
    id: 'excited',
    question: 'Waar ben ik nu het meest enthousiast over?',
    hint: 'Wat geeft je energie als je eraan denkt?',
  },
  {
    id: 'proud',
    question: 'Waar ben ik nu het meest trots op?',
    hint: 'Welke prestatie, kwaliteit of groei?',
  },
  {
    id: 'enjoying',
    question: 'Waar geniet ik nu het meest van in mijn leven?',
    hint: 'Welke momenten, activiteiten of relaties?',
  },
  {
    id: 'committed',
    question: 'Waar ben ik nu het meest aan toegewijd?',
    hint: 'Welke doelen of waarden drijven je?',
  },
];

const eveningQuestions = [
  {
    id: 'gave',
    question: 'Wat heb ik vandaag GEGEVEN?',
    hint: 'Denk aan waarde, liefde, hulp, inspiratie...',
  },
  {
    id: 'learned',
    question: 'Wat heb ik vandaag GELEERD?',
    hint: 'Nieuwe inzichten, vaardigheden, perspectieven...',
  },
  {
    id: 'quality',
    question: 'Hoe heeft vandaag bijgedragen aan mijn kwaliteit van leven?',
    hint: 'In welke gebieden ben je gegroeid of vooruitgegaan?',
  },
  {
    id: 'better',
    question: 'Hoe kan ik morgen nog beter maken?',
    hint: 'Welke kleine aanpassing zou een groot verschil maken?',
  },
];

export function PowerQuestions({ type, values, onChange }: PowerQuestionsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const questions = type === 'morning' ? morningQuestions : eveningQuestions;

  const updateValue = (id: string, value: string) => {
    onChange({ ...values, [id]: value });
  };

  const answeredCount = questions.filter(q => values[q.id]?.trim().length > 0).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="bg-white  rounded-2xl border border-line  overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-line ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              type === 'morning'
                ? 'bg-gradient-to-br from-tertiary to-tertiary'
                : 'bg-gradient-to-br from-accent to-accent'
            }`}>
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-ink ">
                {type === 'morning' ? 'Ochtend' : 'Avond'} Power Questions
              </h3>
              <p className="text-sm text-ink-soft ">
                Quality questions create a quality life
              </p>
            </div>
          </div>
          <div className="text-sm text-ink-soft">
            {answeredCount}/{questions.length}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="divide-y divide-line ">
        {questions.map((q, index) => {
          const isExpanded = expandedIndex === index;
          const hasAnswer = values[q.id]?.trim().length > 0;

          return (
            <div key={q.id} className="transition-colors">
              <button
                onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-card "
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    hasAnswer
                      ? 'bg-primary text-white'
                      : 'bg-surface-card  text-ink-soft'
                  }`}>
                    {hasAnswer ? '✓' : index + 1}
                  </div>
                  <span className={`font-medium ${
                    hasAnswer
                      ? 'text-ink-soft '
                      : 'text-ink '
                  }`}>
                    {q.question}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp size={18} className="text-ink-soft" />
                ) : (
                  <ChevronDown size={18} className="text-ink-soft" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-ink-soft  mb-3 pl-9">
                    {q.hint}
                  </p>
                  <textarea
                    value={values[q.id] || ''}
                    onChange={(e) => updateValue(q.id, e.target.value)}
                    placeholder="Jouw antwoord..."
                    rows={3}
                    className="w-full p-3 bg-surface-card  rounded-xl border border-line  text-ink  placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-line  resize-none"
                  />
                  {index < questions.length - 1 && values[q.id]?.trim() && (
                    <button
                      onClick={() => setExpandedIndex(index + 1)}
                      className="mt-2 text-sm text-ink-soft hover:text-ink-soft "
                    >
                      Volgende vraag →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion */}
      {allAnswered && (
        <div className={`p-4 text-center ${
          type === 'morning'
            ? 'bg-gradient-to-r from-tertiary to-tertiary'
            : 'bg-gradient-to-r from-accent to-accent'
        }`}>
          <div className="flex items-center justify-center gap-2 text-white">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Alle power questions beantwoord!</span>
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Quote */}
      <div className="p-4 bg-surface-card  border-t border-line ">
        <p className="text-sm text-ink-soft  italic text-center">
          "Quality questions create a quality life. Successful people ask better questions."
          <span className="block text-xs text-ink-soft mt-1">— Tony Robbins</span>
        </p>
      </div>
    </div>
  );
}
