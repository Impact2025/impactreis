import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { UNLEASHED_COURSE } from '@/lib/seed-courses';

const sql = neon(process.env.DATABASE_URL!);

/**
 * POST /api/courses/seed
 * Seeds the database with the Tony Robbins Unleashed course
 * Only works in development or with admin key
 */
export async function POST(request: NextRequest) {
  try {
    // Simple protection - require a seed key or check for dev environment
    const { searchParams } = new URL(request.url);
    const seedKey = searchParams.get('key');

    if (process.env.NODE_ENV === 'production' && seedKey !== process.env.SEED_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const course = UNLEASHED_COURSE;

    // Check if course already exists
    const [existing] = await sql`
      SELECT id FROM courses WHERE slug = ${course.slug}
    `;

    let courseId: number;

    if (existing) {
      // Update existing course
      await sql`
        UPDATE courses SET
          title = ${course.title},
          subtitle = ${course.subtitle},
          description = ${course.description},
          total_modules = ${course.modules.length},
          total_lessons = ${course.modules.reduce((acc, m) => acc + m.lessons.length, 0)},
          estimated_weeks = ${course.estimated_weeks},
          difficulty = ${course.difficulty}
        WHERE slug = ${course.slug}
      `;
      courseId = existing.id;
    } else {
      // Insert new course
      const [newCourse] = await sql`
        INSERT INTO courses (slug, title, subtitle, description, total_modules, total_lessons, estimated_weeks, difficulty, is_published)
        VALUES (
          ${course.slug},
          ${course.title},
          ${course.subtitle},
          ${course.description},
          ${course.modules.length},
          ${course.modules.reduce((acc, m) => acc + m.lessons.length, 0)},
          ${course.estimated_weeks},
          ${course.difficulty},
          true
        )
        RETURNING id
      `;
      courseId = newCourse.id;
    }

    // Upsert modules and lessons
    for (let moduleIndex = 0; moduleIndex < course.modules.length; moduleIndex++) {
      const module = course.modules[moduleIndex];

      // Check if module exists
      const [existingModule] = await sql`
        SELECT id FROM course_modules
        WHERE course_id = ${courseId} AND slug = ${module.slug}
      `;

      let moduleId: number;

      if (existingModule) {
        await sql`
          UPDATE course_modules SET
            title = ${module.title},
            subtitle = ${module.subtitle || null},
            description = ${module.description || null},
            week_start = ${module.week_start},
            week_end = ${module.week_end},
            order_index = ${moduleIndex + 1},
            icon = ${module.icon},
            color = ${module.color}
          WHERE id = ${existingModule.id}
        `;
        moduleId = existingModule.id;
      } else {
        const [newModule] = await sql`
          INSERT INTO course_modules (course_id, slug, title, subtitle, description, week_start, week_end, order_index, icon, color)
          VALUES (
            ${courseId},
            ${module.slug},
            ${module.title},
            ${module.subtitle || null},
            ${module.description || null},
            ${module.week_start},
            ${module.week_end},
            ${moduleIndex + 1},
            ${module.icon},
            ${module.color}
          )
          RETURNING id
        `;
        moduleId = newModule.id;
      }

      // Upsert lessons
      for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
        const lesson = module.lessons[lessonIndex];

        const [existingLesson] = await sql`
          SELECT id FROM course_lessons
          WHERE module_id = ${moduleId} AND slug = ${lesson.slug}
        `;

        if (existingLesson) {
          await sql`
            UPDATE course_lessons SET
              title = ${lesson.title},
              subtitle = ${lesson.subtitle || null},
              lesson_type = ${lesson.lesson_type},
              content = ${JSON.stringify(lesson.content)},
              estimated_minutes = ${lesson.estimated_minutes},
              order_index = ${lessonIndex + 1}
            WHERE id = ${existingLesson.id}
          `;
        } else {
          await sql`
            INSERT INTO course_lessons (module_id, slug, title, subtitle, lesson_type, content, estimated_minutes, order_index)
            VALUES (
              ${moduleId},
              ${lesson.slug},
              ${lesson.title},
              ${lesson.subtitle || null},
              ${lesson.lesson_type},
              ${JSON.stringify(lesson.content)},
              ${lesson.estimated_minutes},
              ${lessonIndex + 1}
            )
          `;
        }
      }
    }

    // Get final stats
    const [stats] = await sql`
      SELECT
        (SELECT COUNT(*) FROM course_modules WHERE course_id = ${courseId}) as modules,
        (SELECT COUNT(*) FROM course_lessons cl JOIN course_modules cm ON cl.module_id = cm.id WHERE cm.course_id = ${courseId}) as lessons
    `;

    return NextResponse.json({
      success: true,
      message: 'Course seeded successfully',
      course: {
        id: courseId,
        slug: course.slug,
        title: course.title,
        modules: parseInt(stats.modules),
        lessons: parseInt(stats.lessons),
      },
    });
  } catch (error: any) {
    console.error('Error seeding course:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed course' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/courses/seed
 * Returns info about the seed endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed the Tony Robbins Unleashed course',
    course: {
      title: UNLEASHED_COURSE.title,
      modules: UNLEASHED_COURSE.modules.length,
      lessons: UNLEASHED_COURSE.modules.reduce((acc, m) => acc + m.lessons.length, 0),
    },
  });
}
