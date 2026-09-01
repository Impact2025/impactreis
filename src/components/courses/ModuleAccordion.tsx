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
  blue: 'bg-accent',
  purple: 'bg-accent',
  pink: 'bg-error',
  orange: 'bg-tertiary',
  green: 'bg-primary',
  red: 'bg-error',
  amber: 'bg-tertiary',
  cyan: 'bg-accent',
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
          ? 'border-line  opacity-60'
          : module.is_current
          ? 'border-accent  ring-2 ring-accent-soft '
          : isCompleted
          ? 'border-primary-muted '
          : 'border-line '
      }`}
    >
      {/* Header */}
      <button
        onClick={handleToggle}
        disabled={module.is_locked}
        className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
          module.is_locked
            ? 'cursor-not-allowed'
            : 'hover:bg-surface-card '
        }`}
      >
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            module.is_locked
              ? 'bg-surface-sunken '
              : isCompleted
              ? 'bg-primary'
              : bgColor
          }`}
        >
          {module.is_locked ? (
            <Lock className="text-ink-soft " size={20} />
          ) : isCompleted ? (
            <CheckCircle className="text-white" size={20} />
          ) : (
            <Icon className="text-white" size={20} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ink  truncate">
              {module.title}
            </h3>
            {module.is_current && !isCompleted && (
              <span className="px-2 py-0.5 bg-accent-soft  text-accent  text-xs font-medium rounded">
                Actief
              </span>
            )}
          </div>
          {module.subtitle && (
            <p className="text-sm text-ink-soft  truncate">
              {module.subtitle}
            </p>
          )}
          <div className="mt-1 flex items-center gap-3 text-xs text-ink-soft">
            <span>Week {module.week_start}-{module.week_end}</span>
            <span>•</span>
            <span>{completedLessons}/{totalLessons} lessen</span>
          </div>
        </div>

        {/* Progress & Chevron */}
        <div className="flex items-center gap-3">
          {!module.is_locked && (
            <div className="text-right">
              <span className="text-sm font-medium text-ink ">
                {totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%
              </span>
            </div>
          )}
          {!module.is_locked && (
            <ChevronDown
              className={`text-ink-soft transition-transform duration-300 ${
                open ? 'rotate-180' : ''
              }`}
              size={20}
            />
          )}
        </div>
      </button>

      {/* Lessons List */}
      {open && !module.is_locked && module.lessons && (
        <div className="border-t border-line  bg-surface-card/50 ">
          {module.lessons.map((lesson, index) => (
            <Link
              key={lesson.id}
              href={`/courses/${courseSlug}/lesson/${lesson.id}`}
              className={`flex items-center gap-4 px-4 py-3 hover:bg-surface-card  transition-colors ${
                index !== module.lessons!.length - 1
                  ? 'border-b border-line '
                  : ''
              }`}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {lesson.is_completed ? (
                  <CheckCircle className="text-primary" size={20} />
                ) : lesson.is_current ? (
                  <PlayCircle className="text-accent" size={20} />
                ) : (
                  <Circle className="text-outline " size={20} />
                )}
              </div>

              {/* Lesson Info */}
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-medium truncate ${
                    lesson.is_completed
                      ? 'text-ink-soft '
                      : lesson.is_current
                      ? 'text-accent '
                      : 'text-ink '
                  }`}
                >
                  {lesson.title}
                </h4>
                {lesson.subtitle && (
                  <p className="text-xs text-ink-soft truncate">{lesson.subtitle}</p>
                )}
              </div>

              {/* Duration */}
              <div className="flex items-center gap-1 text-xs text-ink-soft">
                <Clock size={12} />
                <span>{lesson.estimated_minutes} min</span>
              </div>

              {/* Type Badge */}
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${
                  lesson.lesson_type === 'exercise'
                    ? 'bg-tertiary-soft  text-tertiary '
                    : lesson.lesson_type === 'assessment'
                    ? 'bg-accent-soft  text-accent '
                    : lesson.lesson_type === 'reflection'
                    ? 'bg-error-soft  text-error '
                    : 'bg-accent-soft  text-accent '
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
