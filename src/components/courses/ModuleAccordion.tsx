'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Lock,
  CheckCircle,
  Circle,
  PlayCircle,
  Clock,
  Zap,
  Heart,
  Target,
  Flame,
  Shield,
  Star,
} from 'lucide-react';
import { CourseModule } from '@/types';

const iconMap: Record<string, React.ComponentType<any>> = {
  zap: Zap,
  heart: Heart,
  target: Target,
  flame: Flame,
  shield: Shield,
  star: Star,
};

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  cyan: 'bg-cyan-500',
};

interface ModuleAccordionProps {
  module: CourseModule;
  courseSlug: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ModuleAccordion({
  module,
  courseSlug,
  isOpen = false,
  onToggle,
}: ModuleAccordionProps) {
  const [open, setOpen] = useState(isOpen || module.is_current);

  const handleToggle = () => {
    if (module.is_locked) return;
    setOpen(!open);
    onToggle?.();
  };

  const Icon = module.icon ? iconMap[module.icon] || Zap : Zap;
  const bgColor = colorMap[module.color] || colorMap.blue;

  const completedLessons = module.completed_lessons || 0;
  const totalLessons = module.total_lessons || 0;
  const isCompleted = completedLessons === totalLessons && totalLessons > 0;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-300 ${
        module.is_locked
          ? 'border-slate-200 dark:border-slate-800 opacity-60'
          : module.is_current
          ? 'border-blue-300 dark:border-blue-700 ring-2 ring-blue-100 dark:ring-blue-900'
          : isCompleted
          ? 'border-emerald-200 dark:border-emerald-800'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Header */}
      <button
        onClick={handleToggle}
        disabled={module.is_locked}
        className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
          module.is_locked
            ? 'cursor-not-allowed'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            module.is_locked
              ? 'bg-slate-200 dark:bg-slate-700'
              : isCompleted
              ? 'bg-emerald-500'
              : bgColor
          }`}
        >
          {module.is_locked ? (
            <Lock className="text-slate-400 dark:text-slate-500" size={20} />
          ) : isCompleted ? (
            <CheckCircle className="text-white" size={20} />
          ) : (
            <Icon className="text-white" size={20} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
              {module.title}
            </h3>
            {module.is_current && !isCompleted && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded">
                Actief
              </span>
            )}
          </div>
          {module.subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {module.subtitle}
            </p>
          )}
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
            <span>Week {module.week_start}-{module.week_end}</span>
            <span>•</span>
            <span>{completedLessons}/{totalLessons} lessen</span>
          </div>
        </div>

        {/* Progress & Chevron */}
        <div className="flex items-center gap-3">
          {!module.is_locked && (
            <div className="text-right">
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%
              </span>
            </div>
          )}
          {!module.is_locked && (
            <ChevronDown
              className={`text-slate-400 transition-transform duration-300 ${
                open ? 'rotate-180' : ''
              }`}
              size={20}
            />
          )}
        </div>
      </button>

      {/* Lessons List */}
      {open && !module.is_locked && module.lessons && (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          {module.lessons.map((lesson, index) => (
            <Link
              key={lesson.id}
              href={`/courses/${courseSlug}/lesson/${lesson.id}`}
              className={`flex items-center gap-4 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors ${
                index !== module.lessons!.length - 1
                  ? 'border-b border-slate-100 dark:border-slate-800'
                  : ''
              }`}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {lesson.is_completed ? (
                  <CheckCircle className="text-emerald-500" size={20} />
                ) : lesson.is_current ? (
                  <PlayCircle className="text-blue-500" size={20} />
                ) : (
                  <Circle className="text-slate-300 dark:text-slate-600" size={20} />
                )}
              </div>

              {/* Lesson Info */}
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-medium truncate ${
                    lesson.is_completed
                      ? 'text-slate-500 dark:text-slate-400'
                      : lesson.is_current
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {lesson.title}
                </h4>
                {lesson.subtitle && (
                  <p className="text-xs text-slate-400 truncate">{lesson.subtitle}</p>
                )}
              </div>

              {/* Duration */}
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={12} />
                <span>{lesson.estimated_minutes} min</span>
              </div>

              {/* Type Badge */}
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${
                  lesson.lesson_type === 'exercise'
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                    : lesson.lesson_type === 'assessment'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : lesson.lesson_type === 'reflection'
                    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}
              >
                {lesson.lesson_type === 'exercise'
                  ? 'Oefening'
                  : lesson.lesson_type === 'assessment'
                  ? 'Assessment'
                  : lesson.lesson_type === 'reflection'
                  ? 'Reflectie'
                  : 'Theorie'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
