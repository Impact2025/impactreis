import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { authenticateToken } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/practice
 * Fetch daily practice history and streaks
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const practiceType = searchParams.get('type');
    const days = parseInt(searchParams.get('days') || '30');

    // Fetch practice log
    let practices;
    if (practiceType) {
      practices = await sql`
        SELECT * FROM daily_practice_log
        WHERE user_id = ${userId}
        AND practice_type = ${practiceType}
        AND date >= CURRENT_DATE - ${days}
        ORDER BY date DESC
      `;
    } else {
      practices = await sql`
        SELECT * FROM daily_practice_log
        WHERE user_id = ${userId}
        AND date >= CURRENT_DATE - ${days}
        ORDER BY date DESC
      `;
    }

    // Calculate streaks for each practice type
    const streaks: Record<string, number> = {};
    const practiceTypes = ['priming', 'gratitude', 'state_check', 'incantation'];

    for (const type of practiceTypes) {
      const typePractices = practices.filter((p: any) => p.practice_type === type);
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        const found = typePractices.find(
          (p: any) => p.date === dateStr || p.date.split('T')[0] === dateStr
        );

        if (found) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      streaks[type] = streak;
    }

    // Check today's completions
    const todayStr = new Date().toISOString().split('T')[0];
    const todayPractices = practices.filter(
      (p: any) => p.date === todayStr || p.date.split('T')[0] === todayStr
    );

    const todayStatus: Record<string, boolean> = {};
    practiceTypes.forEach((type) => {
      todayStatus[type] = todayPractices.some((p: any) => p.practice_type === type);
    });

    return NextResponse.json({
      practices,
      streaks,
      today: todayStatus,
    });
  } catch (error: any) {
    console.error('Error fetching practice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch practice' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/practice
 * Log a daily practice completion
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { practiceType, durationMinutes, notes, date } = body;

    const validTypes = ['priming', 'gratitude', 'state_check', 'incantation'];
    if (!practiceType || !validTypes.includes(practiceType)) {
      return NextResponse.json(
        { error: `Invalid practice type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const practiceDate = date || new Date().toISOString().split('T')[0];

    // Upsert practice log
    const [practice] = await sql`
      INSERT INTO daily_practice_log (user_id, practice_type, date, duration_minutes, notes)
      VALUES (${userId}, ${practiceType}, ${practiceDate}, ${durationMinutes || null}, ${notes || null})
      ON CONFLICT (user_id, practice_type, date)
      DO UPDATE SET
        duration_minutes = COALESCE(${durationMinutes}, daily_practice_log.duration_minutes),
        notes = COALESCE(${notes}, daily_practice_log.notes),
        completed_at = NOW()
      RETURNING *
    `;

    // Calculate new streak
    const practices = await sql`
      SELECT date FROM daily_practice_log
      WHERE user_id = ${userId} AND practice_type = ${practiceType}
      ORDER BY date DESC
    `;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const found = practices.find(
        (p: any) => p.date === dateStr || p.date.split('T')[0] === dateStr
      );

      if (found) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Check for streak achievements
    const achievementMilestones = [
      { streak: 7, key: 'priming_streak_7' },
      { streak: 30, key: 'priming_streak_30' },
    ];

    for (const milestone of achievementMilestones) {
      if (streak >= milestone.streak && practiceType === 'priming') {
        await sql`
          INSERT INTO course_achievements (user_id, achievement_key, course_id)
          VALUES (${userId}, ${milestone.key}, 1)
          ON CONFLICT (user_id, achievement_key) DO NOTHING
        `;
      }
    }

    return NextResponse.json({
      practice,
      streak,
      message: `${practiceType} logged successfully!`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error logging practice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to log practice' },
      { status: 500 }
    );
  }
}
