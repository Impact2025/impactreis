import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { authenticateToken } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/wins
 * Fetch all wins for the authenticated user
 * Query params:
 *  - category: filter by category (business, personal, health, learning)
 *  - startDate: filter wins from this date
 *  - endDate: filter wins until this date
 *  - search: search in title and description
 *  - impactLevel: filter by minimum impact level (1-5)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const impactLevel = searchParams.get('impactLevel');
    const search = searchParams.get('search');

    // Fetch all wins for the user first
    let wins = await sql`
      SELECT * FROM wins
      WHERE user_id = ${userId}
      ORDER BY date DESC, created_at DESC
    `;

    // Apply filters in JavaScript (simpler than dynamic SQL)
    if (category) {
      wins = wins.filter((win: any) => win.category === category);
    }

    if (startDate) {
      wins = wins.filter((win: any) => new Date(win.date) >= new Date(startDate));
    }

    if (endDate) {
      wins = wins.filter((win: any) => new Date(win.date) <= new Date(endDate));
    }

    if (impactLevel) {
      const minImpact = parseInt(impactLevel);
      wins = wins.filter((win: any) => win.impact_level >= minImpact);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      wins = wins.filter((win: any) =>
        win.title.toLowerCase().includes(searchLower) ||
        (win.description && win.description.toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json(wins);
  } catch (error: any) {
    console.error('Error fetching wins:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wins' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wins
 * Create a new win for the authenticated user
 * Body:
 *  - title: string (required)
 *  - description: string (optional)
 *  - category: 'business' | 'personal' | 'health' | 'learning' (required)
 *  - impactLevel: 1-5 (required)
 *  - date: ISO date string (required)
 *  - tags: string[] (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();

    const { title, description, category, impactLevel, date, tags } = body;

    // Validation
    if (!title || !category || !impactLevel || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: title, category, impactLevel, date' },
        { status: 400 }
      );
    }

    if (!['business', 'personal', 'health', 'learning'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be: business, personal, health, or learning' },
        { status: 400 }
      );
    }

    if (impactLevel < 1 || impactLevel > 5) {
      return NextResponse.json(
        { error: 'Impact level must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Insert win
    const result = await sql`
      INSERT INTO wins (user_id, title, description, category, impact_level, date, tags)
      VALUES (${userId}, ${title}, ${description || null}, ${category}, ${impactLevel}, ${date}, ${JSON.stringify(tags || [])})
      RETURNING *
    `;

    // Update user context with last major win date if impact >= 4
    if (impactLevel >= 4) {
      await sql`
        INSERT INTO user_context (user_id, last_major_win_date, updated_at)
        VALUES (${userId}, ${date}, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
          last_major_win_date = ${date},
          updated_at = NOW()
      `;
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating win:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create win' },
      { status: 500 }
    );
  }
}
