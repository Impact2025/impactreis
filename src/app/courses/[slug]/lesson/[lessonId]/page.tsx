'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  BookOpen,
  Dumbbell,
  Brain,
  ClipboardList,
  Save,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AuthService } from '@/lib/auth';
import { CourseLesson } from '@/types';
import {
  LessonContent,
  PrimingExercise,
  WheelOfLife,
  SixNeedsAssessment,
} from '@/components/courses';

export default function LessonPage() {
  const [lesson, setLesson] = useState<CourseLesson & {
    answers: Record<string, string>;
    navigation: { previous: any; next: any };
    module_title: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [startTime] = useState(Date.now());

  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;

  useEffect(() => {
    const loadLesson = async () => {
      const user = AuthService.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        const data = await api.courses.getLesson(slug, parseInt(lessonId));
        setLesson(data);
        setAnswers(data.answers || {});
      } catch (error) {
        console.error('Failed to load lesson:', error);
        router.push(`/courses/${slug}`);
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [slug, lessonId, router]);

  const handleAnswerChange = useCallback((key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleSaveAnswers = async () => {
    if (!hasChanges || saving) return;

    setSaving(true);
    try {
      await api.courses.saveAnswers(slug, parseInt(lessonId), answers);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save answers:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (completing) return;

    // Save answers first if there are changes
    if (hasChanges) {
      await handleSaveAnswers();
    }

    setCompleting(true);
    try {
      const timeSpent = Math.round((Date.now() - startTime) / 60000);
      const result = await api.courses.completeLesson(slug, parseInt(lessonId), timeSpent);

      if (result.next_lesson) {
        router.push(`/courses/${slug}/lesson/${result.next_lesson.id}`);
      } else {
        router.push(`/courses/${slug}`);
      }
    } catch (error) {
      console.error('Failed to complete lesson:', error);
      setCompleting(false);
    }
  };

  const handleExerciseComplete = async (data: any) => {
    // Log practice if it's a priming exercise
    if (lesson?.content?.exercises?.some((e) => e.type === 'priming')) {
      await api.practice.log('priming', data.duration, data.notes);
    }
  };

  const handleAssessmentComplete = async (type: string, results: any) => {
    await api.assessments.save(type, results);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white  flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-line  border-t-transparent" />
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  const typeIcons = {
    theory: BookOpen,
    exercise: Dumbbell,
    reflection: Brain,
    assessment: ClipboardList,
  };
  const TypeIcon = typeIcons[lesson.lesson_type] || BookOpen;

  return (
    <div className="min-h-screen bg-surface-card ">
      {/* Header */}
      <header className="bg-white  border-b border-line  sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/courses/${slug}`}
                className="p-2 -ml-2 text-ink-soft hover:text-ink  transition-colors"
              >
                <ChevronLeft size={20} />
              </Link>
              <div>
                <p className="text-sm text-ink-soft ">
                  {lesson.module_title}
                </p>
                <h1 className="text-lg font-semibold text-ink ">
                  {lesson.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Save Button */}
              {hasChanges && (
                <button
                  onClick={handleSaveAnswers}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-accent  hover:bg-accent-soft  rounded-lg transition-colors"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Opslaan
                </button>
              )}

              {/* Meta */}
              <div className="flex items-center gap-2 text-sm text-ink-soft ">
                <TypeIcon size={16} />
                <span>{lesson.estimated_minutes} min</span>
              </div>

              {/* Complete Status */}
              {lesson.is_completed && (
                <div className="flex items-center gap-1 text-primary ">
                  <CheckCircle size={18} />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Regular Lesson Content */}
        <LessonContent
          content={lesson.content}
          answers={answers}
          onAnswerChange={handleAnswerChange}
        />

        {/* Special Exercises */}
        {lesson.content?.exercises?.map((exercise, index) => {
          if (exercise.type === 'priming') {
            return (
              <div key={index} className="mt-8">
                <PrimingExercise onComplete={handleExerciseComplete} />
              </div>
            );
          }

          if (exercise.type === 'wheel_of_life') {
            return (
              <div key={index} className="mt-8">
                <WheelOfLife
                  onComplete={(results) => handleAssessmentComplete('wheel_of_life', results)}
                />
              </div>
            );
          }

          if (exercise.type === 'six_needs') {
            return (
              <div key={index} className="mt-8">
                <SixNeedsAssessment
                  onComplete={(results) => handleAssessmentComplete('six_needs', results)}
                />
              </div>
            );
          }

          return null;
        })}

        {/* Navigation & Complete */}
        <div className="mt-12 flex items-center justify-between pt-8 border-t border-line ">
          {/* Previous */}
          {lesson.navigation.previous ? (
            <Link
              href={`/courses/${slug}/lesson/${lesson.navigation.previous.id}`}
              className="flex items-center gap-2 px-4 py-2 text-ink-soft  hover:text-ink  transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Vorige les</span>
            </Link>
          ) : (
            <div />
          )}

          {/* Complete / Next */}
          <button
            onClick={handleComplete}
            disabled={completing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              lesson.is_completed
                ? 'bg-surface-card  text-ink-soft  hover:bg-surface-sunken '
                : 'bg-primary text-white hover:bg-primary'
            }`}
          >
            {completing ? (
              <Loader2 size={20} className="animate-spin" />
            ) : lesson.is_completed ? (
              <>
                {lesson.navigation.next ? 'Volgende Les' : 'Terug naar Cursus'}
                <ChevronRight size={20} />
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Markeer als Voltooid
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
