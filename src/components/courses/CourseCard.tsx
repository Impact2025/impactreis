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
      className="group block bg-white  rounded-2xl border border-line  overflow-hidden hover:shadow-lg hover:border-line  transition-all duration-300"
    >
      {/* Course Image/Header */}
      <div className="relative h-40 bg-gradient-to-br from-surface-inverse via-surface-inverse to-surface-inverse overflow-hidden">
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
              <CheckCircle size={12} />
              Voltooid
            </span>
          ) : isEnrolled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent text-white text-xs font-medium rounded-full">
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
        <h3 className="text-lg font-semibold text-ink  group-hover:text-accent  transition-colors">
          {course.title}
        </h3>
        {course.subtitle && (
          <p className="mt-1 text-sm text-ink-soft ">
            {course.subtitle}
          </p>
        )}

        {/* Meta */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-ink-soft ">
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
            className="text-ink-soft group-hover:text-accent group-hover:translate-x-1 transition-all"
          />
        </div>

        {/* Progress Bar */}
        {isEnrolled && !isCompleted && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-ink-soft  mb-1">
              <span>{course.progress?.completed_lessons} / {course.progress?.total_lessons} lessen</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-1.5 bg-surface-card  rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
