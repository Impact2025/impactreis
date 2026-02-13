import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { authenticateToken } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/courses/[slug]/lessons/[lessonId]
 * Fetch lesson details with user answers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, lessonId } = await params;

    // Verify course exists and user has access
    const [course] = await sql`
      SELECT id FROM courses WHERE slug = ${slug} AND is_published = true
    `;

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Fetch lesson with module info
    const [lesson] = await sql`
      SELECT cl.*, cm.course_id, cm.title as module_title, cm.order_index as module_order
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      WHERE cl.id = ${lessonId} AND cm.course_id = ${course.id}
    `;

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Fetch user's answers for this lesson
    const answers = await sql`
      SELECT question_key, answer, updated_at
      FROM course_answers
      WHERE user_id = ${userId} AND lesson_id = ${lessonId}
    `;

    const answersMap: Record<string, string> = {};
    answers.forEach((a: any) => {
      answersMap[a.question_key] = a.answer;
    });

    // Check if lesson is completed
    const [completion] = await sql`
      SELECT * FROM lesson_completions
      WHERE user_id = ${userId} AND lesson_id = ${lessonId}
    `;

    // Get previous and next lesson
    const [prevLesson] = await sql`
      SELECT cl.id, cl.title, cl.slug
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      WHERE cm.course_id = ${course.id}
      AND (cm.order_index < ${lesson.module_order}
           OR (cm.order_index = ${lesson.module_order} AND cl.order_index < ${lesson.order_index}))
      ORDER BY cm.order_index DESC, cl.order_index DESC
      LIMIT 1
    `;

    const [nextLesson] = await sql`
      SELECT cl.id, cl.title, cl.slug
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      WHERE cm.course_id = ${course.id}
      AND (cm.order_index > ${lesson.module_order}
           OR (cm.order_index = ${lesson.module_order} AND cl.order_index > ${lesson.order_index}))
      ORDER BY cm.order_index ASC, cl.order_index ASC
      LIMIT 1
    `;

    // Update enrollment last activity
    await sql`
      UPDATE course_enrollments
      SET last_activity_at = NOW(),
          current_module_id = ${lesson.module_id},
          current_lesson_id = ${lesson.id}
      WHERE user_id = ${userId} AND course_id = ${course.id}
    `;

    return NextResponse.json({
      ...lesson,
      answers: answersMap,
      is_completed: !!completion,
      completed_at: completion?.completed_at,
      navigation: {
        previous: prevLesson || null,
        next: nextLesson || null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/[slug]/lessons/[lessonId]
 * Mark lesson as complete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, lessonId } = await params;
    const body = await request.json();
    const { timeSpentMinutes = 0 } = body;

    // Verify lesson exists
    const [lesson] = await sql`
      SELECT cl.*, cm.course_id
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      JOIN courses c ON cm.course_id = c.id
      WHERE cl.id = ${lessonId} AND c.slug = ${slug}
    `;

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Mark lesson complete (upsert)
    const [completion] = await sql`
      INSERT INTO lesson_completions (user_id, lesson_id, time_spent_minutes)
      VALUES (${userId}, ${lessonId}, ${timeSpentMinutes})
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET time_spent_minutes = lesson_completions.time_spent_minutes + ${timeSpentMinutes}
      RETURNING *
    `;

    // Check if all lessons in course are complete
    const [courseStats] = await sql`
      SELECT
        COUNT(DISTINCT cl.id) as total_lessons,
        COUNT(DISTINCT lc.lesson_id) as completed_lessons
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      LEFT JOIN lesson_completions lc ON cl.id = lc.lesson_id AND lc.user_id = ${userId}
      WHERE cm.course_id = ${lesson.course_id}
    `;

    const isCoursComplete = courseStats.total_lessons === courseStats.completed_lessons;

    // Update enrollment status if course is complete
    if (isCoursComplete) {
      await sql`
        UPDATE course_enrollments
        SET status = 'completed', completed_at = NOW()
        WHERE user_id = ${userId} AND course_id = ${lesson.course_id}
      `;

      // Award course completion achievement
      await sql`
        INSERT INTO course_achievements (user_id, achievement_key, course_id)
        VALUES (${userId}, 'course_complete', ${lesson.course_id})
        ON CONFLICT (user_id, achievement_key) DO NOTHING
      `;
    }

    // Get next lesson
    const [nextLesson] = await sql`
      SELECT cl.id, cl.title, cl.slug, cm.id as module_id
      FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      WHERE cm.course_id = ${lesson.course_id}
      AND (cm.order_index > (SELECT order_index FROM course_modules WHERE id = ${lesson.module_id})
           OR (cm.order_index = (SELECT order_index FROM course_modules WHERE id = ${lesson.module_id})
               AND cl.order_index > ${lesson.order_index}))
      ORDER BY cm.order_index ASC, cl.order_index ASC
      LIMIT 1
    `;

    // Update current lesson/module if there's a next lesson
    if (nextLesson) {
      await sql`
        UPDATE course_enrollments
        SET current_lesson_id = ${nextLesson.id},
            current_module_id = ${nextLesson.module_id},
            last_activity_at = NOW()
        WHERE user_id = ${userId} AND course_id = ${lesson.course_id}
      `;
    }

    return NextResponse.json({
      completion,
      course_complete: isCoursComplete,
      next_lesson: nextLesson || null,
      progress: {
        completed: parseInt(courseStats.completed_lessons),
        total: parseInt(courseStats.total_lessons),
        percentage: Math.round((parseInt(courseStats.completed_lessons) / parseInt(courseStats.total_lessons)) * 100),
      },
    });
  } catch (error: any) {
    console.error('Error completing lesson:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete lesson' },
      { status: 500 }
    );
  }
}
