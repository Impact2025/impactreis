'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, ChevronLeft, Flame, BookOpen, Trophy, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { Course } from '@/types';
import { CourseCard } from '@/components/courses';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [practiceStats, setPracticeStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const user = AuthService.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        const [coursesData, practiceData] = await Promise.all([
          api.courses.getAll(),
          api.practice.get().catch(() => null),
        ]);
        setCourses(coursesData);
        setPracticeStats(practiceData);
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-900 dark:border-white border-t-transparent" />
      </div>
    );
  }

  const enrolledCourses = courses.filter((c) => c.progress);
  const availableCourses = courses.filter((c) => !c.progress);
  const primingStreak = practiceStats?.streaks?.priming || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <BookOpen className="text-white" size={16} />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">Cursussen</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 mb-8 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-orange-400 mb-3">
              <Flame size={20} />
              <span className="text-sm font-medium">Tony Robbins Methodologie</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Unleash Your Power</h1>
            <p className="text-white/70 max-w-xl">
              Transformeer je leven met bewezen strategieën voor persoonlijke groei,
              state management en het doorbreken van beperkende overtuigingen.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        {practiceStats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Flame className="text-orange-500" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{primingStreak}</p>
                  <p className="text-xs text-slate-500">Priming Streak</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-blue-500" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{enrolledCourses.length}</p>
                  <p className="text-xs text-slate-500">Actieve Cursussen</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <Trophy className="text-emerald-500" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {enrolledCourses.filter((c) => c.progress?.status === 'completed').length}
                  </p>
                  <p className="text-xs text-slate-500">Voltooid</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Courses */}
        {enrolledCourses.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-blue-500" size={20} />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Ga Verder
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        {/* Available Courses */}
        {availableCourses.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-slate-500" size={20} />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Beschikbare Cursussen
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Nog geen cursussen beschikbaar
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              Cursussen worden binnenkort toegevoegd.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
