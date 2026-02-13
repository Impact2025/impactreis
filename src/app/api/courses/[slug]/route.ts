import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { authenticateToken } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/courses/[slug]
 * Fetch course details with modules, lessons and user progress
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    // Fetch course
    const [course] = await sql`
      SELECT * FROM courses WHERE slug = ${slug} AND is_published = true
    `;

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Fetch enrollment
    const [enrollment] = await sql`
      SELECT * FROM course_enrollments
      WHERE course_id = ${course.id} AND user_id = ${userId}
    `;

    // Fetch modules
    const modules = await sql`
      SELECT * FROM course_modules
      WHERE course_id = ${course.id}
      ORDER BY order_index ASC
    `;

    // Fetch all lessons for this course
    const lessons = await sql`
      SELECT cl.* FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      WHERE cm.course_id = ${course.id}
      ORDER BY cm.order_index ASC, cl.order_index ASC
    `;

    // Fetch completed lessons
    const completedLessons = await sql`
      SELECT lesson_id FROM lesson_completions
      WHERE user_id = ${userId} AND lesson_id IN (
        SELECT cl.id FROM course_lessons cl
        JOIN course_modules cm ON cl.module_id = cm.id
        WHERE cm.course_id = ${course.id}
      )
    `;
    const completedIds = new Set(completedLessons.map((l: any) => l.lesson_id));

    // Build module structure with lessons
    const modulesWithLessons = modules.map((module: any, moduleIndex: number) => {
      const moduleLessons = lessons
        .filter((l: any) => l.module_id === module.id)
        .map((lesson: any) => ({
          ...lesson,
          is_completed: completedIds.has(lesson.id),
          is_current: enrollment?.current_lesson_id === lesson.id,
        }));

      const completedInModule = moduleLessons.filter((l: any) => l.is_completed).length;

      // Module is locked if previous module is not complete (except first module)
      const previousModulesComplete = moduleIndex === 0 || modules
        .slice(0, moduleIndex)
        .every((prevModule: any) => {
          const prevLessons = lessons.filter((l: any) => l.module_id === prevModule.id);
          return prevLessons.every((l: any) => completedIds.has(l.id));
        });

      return {
        ...module,
        lessons: moduleLessons,
        completed_lessons: completedInModule,
        total_lessons: moduleLessons.length,
        is_locked: !previousModulesComplete,
        is_current: enrollment?.current_module_id === module.id,
      };
    });

    // Calculate progress
    const totalCompleted = completedLessons.length;
    const totalLessons = lessons.length;

    return NextResponse.json({
      ...course,
      modules: modulesWithLessons,
      progress: enrollment ? {
        enrollment_id: enrollment.id,
        status: enrollment.status,
        current_module_id: enrollment.current_module_id,
        current_lesson_id: enrollment.current_lesson_id,
        started_at: enrollment.started_at,
        completed_at: enrollment.completed_at,
        last_activity_at: enrollment.last_activity_at,
        completed_lessons: totalCompleted,
        total_lessons: totalLessons,
        progress_percentage: totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0,
      } : null,
    });
  } catch (error: any) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch course' },
      { status: 500 }
    );
  }
}
