import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { authenticateToken } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/courses/[slug]/answers
 * Fetch all user answers for a course
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
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');

    // Verify course exists
    const [course] = await sql`
      SELECT id FROM courses WHERE slug = ${slug}
    `;

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Fetch answers
    let answers;
    if (lessonId) {
      answers = await sql`
        SELECT ca.* FROM course_answers ca
        WHERE ca.user_id = ${userId} AND ca.lesson_id = ${lessonId}
      `;
    } else {
      answers = await sql`
        SELECT ca.* FROM course_answers ca
        JOIN course_lessons cl ON ca.lesson_id = cl.id
        JOIN course_modules cm ON cl.module_id = cm.id
        WHERE ca.user_id = ${userId} AND cm.course_id = ${course.id}
        ORDER BY ca.answered_at DESC
      `;
    }

    return NextResponse.json(answers);
  } catch (error: any) {
    console.error('Error fetching answers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch answers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/[slug]/answers
 * Save user answers for reflection questions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { lessonId, answers } = body;

    if (!lessonId || !answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'lessonId and answers object are required' },
        { status: 400 }
      );
    }

    // Verify lesson belongs to course
    const [lesson] = await sql`
      SELECT cl.id FROM course_lessons cl
      JOIN course_modules cm ON cl.module_id = cm.id
      JOIN courses c ON cm.course_id = c.id
      WHERE cl.id = ${lessonId} AND c.slug = ${slug}
    `;

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Upsert each answer
    const savedAnswers = [];
    for (const [questionKey, answer] of Object.entries(answers)) {
      if (answer && typeof answer === 'string' && answer.trim()) {
        const [saved] = await sql`
          INSERT INTO course_answers (user_id, lesson_id, question_key, answer)
          VALUES (${userId}, ${lessonId}, ${questionKey}, ${answer})
          ON CONFLICT (user_id, lesson_id, question_key)
          DO UPDATE SET answer = ${answer}, updated_at = NOW()
          RETURNING *
        `;
        savedAnswers.push(saved);
      }
    }

    return NextResponse.json({
      message: 'Answers saved',
      saved: savedAnswers.length,
      answers: savedAnswers,
    });
  } catch (error: any) {
    console.error('Error saving answers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save answers' },
      { status: 500 }
    );
  }
}
