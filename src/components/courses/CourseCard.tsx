'use client';

import Link from 'next/link';
import { BookOpen, Clock, ChevronRight, Play, CheckCircle } from 'lucide-react';
import { Course } from '@/types';
import { ProgressRing } from './ProgressRing';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const isEnrolled = !!course.progress;
  const isCompleted = course.progress?.status === 'completed';
  const progressPercentage = course.progress?.progress_percentage || 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
    >
      {/* Course Image/Header */}
      <div className="relative h-40 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {course.image_url ? (
          <img
            src={course.image_url}
            alt={course.title}
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white/80" />
            </div>
          </div>
        )}

        {/* Progress Ring Overlay */}
        {isEnrolled && (
          <div className="absolute top-4 right-4">
            <ProgressRing
              percentage={progressPercentage}
              size={48}
              strokeWidth={4}
              showPercentage
            />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute bottom-4 left-4">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
              <CheckCircle size={12} />
              Voltooid
            </span>
          ) : isEnrolled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
              <Play size={12} />
              Bezig
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 text-white text-xs font-medium rounded-full backdrop-blur-sm">
              Nieuw
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {course.title}
        </h3>
        {course.subtitle && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {course.subtitle}
          </p>
        )}

        {/* Meta */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <BookOpen size={14} />
              {course.total_lessons} lessen
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {course.estimated_weeks} weken
            </span>
          </div>
          <ChevronRight
            size={18}
            className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
          />
        </div>

        {/* Progress Bar */}
        {isEnrolled && !isCompleted && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>{course.progress?.completed_lessons} / {course.progress?.total_lessons} lessen</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
