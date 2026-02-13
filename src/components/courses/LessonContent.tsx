'use client';

import { useState } from 'react';
import { LessonContent as LessonContentType, LessonSection, ReflectionQuestion } from '@/types';
import { Quote, AlertCircle, Lightbulb, CheckCircle, Info } from 'lucide-react';

interface LessonContentProps {
  content: LessonContentType;
  answers?: Record<string, string>;
  onAnswerChange?: (key: string, value: string) => void;
  readOnly?: boolean;
}

export function LessonContent({
  content,
  answers = {},
  onAnswerChange,
  readOnly = false,
}: LessonContentProps) {
  return (
    <div className="space-y-8">
      {/* Intro Quote */}
      {content.intro?.quote && (
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white overflow-hidden">
          <Quote className="absolute top-4 left-4 text-white/20" size={48} />
          <div className="relative z-10">
            <blockquote className="text-xl md:text-2xl font-medium italic leading-relaxed">
              "{content.intro.quote}"
            </blockquote>
            {content.intro.quote_author && (
              <p className="mt-4 text-white/70">— {content.intro.quote_author}</p>
            )}
          </div>
        </div>
      )}

      {/* Intro Text */}
      {content.intro?.text && (
        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          {content.intro.text}
        </p>
      )}

      {/* Sections */}
      {content.sections?.map((section, index) => (
        <Section key={index} section={section} />
      ))}

      {/* Reflection Questions */}
      {content.reflection_questions && content.reflection_questions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="text-amber-500" size={24} />
            Reflectie
          </h3>
          {content.reflection_questions.map((question) => (
            <ReflectionQuestionField
              key={question.key}
              question={question}
              value={answers[question.key] || ''}
              onChange={(value) => onAnswerChange?.(question.key, value)}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {/* Commitments */}
      {content.commitments && content.commitments.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 flex items-center gap-2 mb-4">
            <CheckCircle className="text-emerald-600" size={20} />
            Jouw Commitments
          </h3>
          <ul className="space-y-3">
            {content.commitments.map((commitment, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-emerald-800 dark:text-emerald-200">{commitment}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Closing Quote */}
      {content.closing?.quote && (
        <div className="border-l-4 border-blue-500 pl-6 py-2">
          <blockquote className="text-lg italic text-slate-600 dark:text-slate-300">
            "{content.closing.quote}"
          </blockquote>
          {content.closing.quote_author && (
            <p className="mt-2 text-sm text-slate-500">— {content.closing.quote_author}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ section }: { section: LessonSection }) {
  const styleMap = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <Info className="text-blue-500" size={20} />,
      text: 'text-blue-800 dark:text-blue-200',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: <AlertCircle className="text-amber-500" size={20} />,
      text: 'text-amber-800 dark:text-amber-200',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: <CheckCircle className="text-emerald-500" size={20} />,
      text: 'text-emerald-800 dark:text-emerald-200',
    },
    tip: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: <Lightbulb className="text-purple-500" size={20} />,
      text: 'text-purple-800 dark:text-purple-200',
    },
  };

  if (section.type === 'quote') {
    return (
      <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-6 py-2 my-6">
        <p className="text-lg italic text-slate-600 dark:text-slate-300">
          {section.content}
        </p>
      </blockquote>
    );
  }

  if (section.type === 'callout' && section.style) {
    const style = styleMap[section.style];
    return (
      <div className={`${style.bg} ${style.border} border rounded-xl p-5 my-6`}>
        <div className="flex items-start gap-3">
          {style.icon}
          <div className={style.text}>
            {section.title && (
              <h4 className="font-semibold mb-1">{section.title}</h4>
            )}
            <p>{section.content}</p>
          </div>
        </div>
      </div>
    );
  }

  if (section.type === 'list' && section.items) {
    return (
      <div className="my-6">
        {section.title && (
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
            {section.title}
          </h4>
        )}
        <ul className="space-y-2">
          {section.items.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 bg-slate-400 rounded-full" />
              <span className="text-slate-600 dark:text-slate-300">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Default text section
  return (
    <div className="my-6">
      {section.title && (
        <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          {section.title}
        </h4>
      )}
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
        {section.content}
      </p>
    </div>
  );
}

function ReflectionQuestionField({
  question,
  value,
  onChange,
  readOnly,
}: {
  question: ReflectionQuestion;
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
}) {
  if (question.type === 'scale') {
    const min = question.min || 1;
    const max = question.max || 10;
    const currentValue = parseInt(value) || min;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
        <label className="block text-slate-900 dark:text-white font-medium mb-2">
          {question.question}
        </label>
        {question.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {question.description}
          </p>
        )}
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{min}</span>
          <input
            type="range"
            min={min}
            max={max}
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-sm text-slate-500">{max}</span>
          <span className="w-12 text-center text-lg font-semibold text-blue-600 dark:text-blue-400">
            {currentValue}
          </span>
        </div>
      </div>
    );
  }

  if (question.type === 'multiple_choice' && question.options) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
        <label className="block text-slate-900 dark:text-white font-medium mb-2">
          {question.question}
        </label>
        {question.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {question.description}
          </p>
        )}
        <div className="space-y-2">
          {question.options.map((option) => (
            <label
              key={option.value}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                value === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name={question.key}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                disabled={readOnly}
                className="sr-only"
              />
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  value === option.value
                    ? 'border-blue-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {value === option.value && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </span>
              <span className="text-slate-700 dark:text-slate-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // Text or textarea
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
      <label className="block text-slate-900 dark:text-white font-medium mb-2">
        {question.question}
      </label>
      {question.description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {question.description}
        </p>
      )}
      {question.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || 'Schrijf je antwoord hier...'}
          disabled={readOnly}
          rows={4}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || 'Je antwoord...'}
          disabled={readOnly}
          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
      )}
    </div>
  );
}
