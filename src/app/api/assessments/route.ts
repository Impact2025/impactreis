import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { authenticateToken } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/assessments
 * Fetch user assessments
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assessmentType = searchParams.get('type');

    let assessments;
    if (assessmentType) {
      assessments = await sql`
        SELECT * FROM user_assessments
        WHERE user_id = ${userId} AND assessment_type = ${assessmentType}
        ORDER BY completed_at DESC
      `;
    } else {
      assessments = await sql`
        SELECT * FROM user_assessments
        WHERE user_id = ${userId}
        ORDER BY completed_at DESC
      `;
    }

    // Get latest of each type
    const latest: Record<string, any> = {};
    const types = ['six_needs', 'wheel_of_life', 'values', 'beliefs'];

    for (const type of types) {
      const typeAssessment = assessments.find((a: any) => a.assessment_type === type);
      if (typeAssessment) {
        latest[type] = typeAssessment;
      }
    }

    return NextResponse.json({
      assessments,
      latest,
    });
  } catch (error: any) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assessments
 * Save an assessment result
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assessmentType, results } = body;

    const validTypes = ['six_needs', 'wheel_of_life', 'values', 'beliefs'];
    if (!assessmentType || !validTypes.includes(assessmentType)) {
      return NextResponse.json(
        { error: `Invalid assessment type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (!results || typeof results !== 'object') {
      return NextResponse.json({ error: 'Results object is required' }, { status: 400 });
    }

    // Insert new assessment (allow multiple over time for tracking progress)
    const [assessment] = await sql`
      INSERT INTO user_assessments (user_id, assessment_type, results)
      VALUES (${userId}, ${assessmentType}, ${JSON.stringify(results)})
      RETURNING *
    `;

    // Award achievement based on type
    const achievementMap: Record<string, string> = {
      six_needs: 'needs_navigator',
      wheel_of_life: 'vision_architect',
      values: 'belief_breaker',
      beliefs: 'belief_breaker',
    };

    if (achievementMap[assessmentType]) {
      await sql`
        INSERT INTO course_achievements (user_id, achievement_key, course_id)
        VALUES (${userId}, ${achievementMap[assessmentType]}, 1)
        ON CONFLICT (user_id, achievement_key) DO NOTHING
      `;
    }

    return NextResponse.json(assessment, { status: 201 });
  } catch (error: any) {
    console.error('Error saving assessment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save assessment' },
      { status: 500 }
    );
  }
}
