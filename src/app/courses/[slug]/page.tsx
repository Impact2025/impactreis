'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Play,
  Clock,
  BookOpen,
  Trophy,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { Course } from '@/types';
import { ModuleAccordion, ProgressRing } from '@/components/courses';

export default function CourseDetailPage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    const loadCourse = async () => {
      const user = AuthService.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        const data = await api.courses.getBySlug(slug);
        setCourse(data);
      } catch (error) {
        console.error('Failed to load course:', error);
        router.push('/courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [slug, router]);

  const handleEnroll = async () => {
    if (!course || enrolling) return;

    setEnrolling(true);
    try {
      await api.courses.enroll(course.id);
      // Reload course data
      const data = await api.courses.getBySlug(slug);
      setCourse(data);
    } catch (error) {
      console.error('Failed to enroll:', error);
    } finally {
      setEnrolling(false);
    }
  };

  const handleContinue = () => {
    if (!course?.progress?.current_lesson_id) return;
    router.push(`/courses/${slug}/lesson/${course.progress.current_lesson_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-900 dark:border-white border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const isEnrolled = !!course.progress;
  const isCompleted = course.progress?.status === 'completed';
  const progressPercentage = course.progress?.progress_percentage || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            Terug naar cursussen
          </Link>
        </div>

        <div className="max-w-5xl mx-auto px-6 pb-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Course Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-orange-400 mb-3">
                <Flame size={18} />
                <span className="text-sm font-medium">Tony Robbins</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{course.title}</h1>
              {course.subtitle && (
                <p className="text-xl text-white/70 mb-4">{course.subtitle}</p>
              )}
              {course.description && (
                <p className="text-white/60 mb-6 max-w-2xl">{course.description}</p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-white/60 mb-8">
                <span className="flex items-center gap-2">
                  <BookOpen size={16} />
                  {course.total_modules} modules
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen size={16} />
                  {course.total_lessons} lessen
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={16} />
                  {course.estimated_weeks} weken
                </span>
              </div>

              {/* CTA */}
              {isCompleted ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle size={24} />
                    <span className="text-lg font-medium">Cursus Voltooid</span>
                  </div>
                  <button
                    onClick={handleContinue}
                    className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                  >
                    Opnieuw Bekijken
                  </button>
                </div>
              ) : isEnrolled ? (
                <button
                  onClick={handleContinue}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                >
                  <Play size={20} />
                  Ga Verder
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {enrolling ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play size={20} />
                  )}
                  Start Cursus
                </button>
              )}
            </div>

            {/* Progress Card */}
            {isEnrolled && (
              <div className="w-full md:w-72 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center justify-center mb-4">
                  <ProgressRing
                    percentage={progressPercentage}
                    size={100}
                    strokeWidth={8}
                    showPercentage
                    color={isCompleted ? '#22c55e' : '#3b82f6'}
                  />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {course.progress?.completed_lessons} / {course.progress?.total_lessons} lessen
                  </p>
                  <p className="text-sm text-white/60">voltooid</p>
                </div>

                {isCompleted && (
                  <div className="mt-4 p-3 bg-emerald-500/20 rounded-lg flex items-center justify-center gap-2">
                    <Trophy className="text-emerald-400" size={20} />
                    <span className="text-emerald-300 font-medium">Gefeliciteerd!</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modules */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
          Cursusinhoud
        </h2>

        <div className="space-y-4">
          {course.modules?.map((module) => (
            <ModuleAccordion
              key={module.id}
              module={module}
              courseSlug={slug}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
