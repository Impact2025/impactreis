import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { authenticateToken } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/courses
 * Fetch all published courses with user progress
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all published courses
    const courses = await sql`
      SELECT
        c.*,
        ce.id as enrollment_id,
        ce.status as enrollment_status,
        ce.current_module_id,
        ce.current_lesson_id,
        ce.started_at as enrollment_started_at,
        ce.completed_at as enrollment_completed_at,
        ce.last_activity_at
      FROM courses c
      LEFT JOIN course_enrollments ce ON c.id = ce.course_id AND ce.user_id = ${userId}
      WHERE c.is_published = true
      ORDER BY c.created_at DESC
    `;

    // For each course, get progress stats
    const coursesWithProgress = await Promise.all(
      courses.map(async (course: any) => {
        if (!course.enrollment_id) {
          return {
            ...course,
            progress: null,
          };
        }

        // Count completed lessons
        const [completedCount] = await sql`
          SELECT COUNT(DISTINCT lc.lesson_id) as completed
          FROM lesson_completions lc
          JOIN course_lessons cl ON lc.lesson_id = cl.id
          JOIN course_modules cm ON cl.module_id = cm.id
          WHERE cm.course_id = ${course.id} AND lc.user_id = ${userId}
        `;

        const completed = parseInt(completedCount?.completed || '0');
        const total = course.total_lessons || 1;

        return {
          ...course,
          progress: {
            enrollment_id: course.enrollment_id,
            status: course.enrollment_status,
            current_module_id: course.current_module_id,
            current_lesson_id: course.current_lesson_id,
            started_at: course.enrollment_started_at,
            completed_at: course.enrollment_completed_at,
            last_activity_at: course.last_activity_at,
            completed_lessons: completed,
            total_lessons: total,
            progress_percentage: Math.round((completed / total) * 100),
          },
        };
      })
    );

    return NextResponse.json(coursesWithProgress);
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses
 * Enroll in a course
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check if course exists
    const [course] = await sql`
      SELECT id FROM courses WHERE id = ${courseId} AND is_published = true
    `;

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get first module and lesson
    const [firstModule] = await sql`
      SELECT id FROM course_modules
      WHERE course_id = ${courseId}
      ORDER BY order_index ASC
      LIMIT 1
    `;

    const [firstLesson] = await sql`
      SELECT id FROM course_lessons
      WHERE module_id = ${firstModule?.id}
      ORDER BY order_index ASC
      LIMIT 1
    `;

    // Create enrollment (upsert)
    const [enrollment] = await sql`
      INSERT INTO course_enrollments (user_id, course_id, current_module_id, current_lesson_id, status)
      VALUES (${userId}, ${courseId}, ${firstModule?.id || null}, ${firstLesson?.id || null}, 'active')
      ON CONFLICT (user_id, course_id)
      DO UPDATE SET
        status = 'active',
        last_activity_at = NOW()
      RETURNING *
    `;

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error: any) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enroll in course' },
      { status: 500 }
    );
  }
}
