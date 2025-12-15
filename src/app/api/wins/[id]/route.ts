import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { authenticateToken } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/wins/[id]
 * Fetch a specific win by ID for the authenticated user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: winId } = await params;

    const result = await sql`
      SELECT * FROM wins
      WHERE id = ${winId} AND user_id = ${userId}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Win not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error fetching win:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch win' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/wins/[id]
 * Update a specific win for the authenticated user
 * Body:
 *  - title: string (optional)
 *  - description: string (optional)
 *  - category: 'business' | 'personal' | 'health' | 'learning' (optional)
 *  - impactLevel: 1-5 (optional)
 *  - date: ISO date string (optional)
 *  - tags: string[] (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: winId } = await params;
    const body = await request.json();

    const { title, description, category, impactLevel, date, tags } = body;

    // Validation for category
    if (category && !['business', 'personal', 'health', 'learning'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be: business, personal, health, or learning' },
        { status: 400 }
      );
    }

    // Validation for impact level
    if (impactLevel !== undefined && (impactLevel < 1 || impactLevel > 5)) {
      return NextResponse.json(
        { error: 'Impact level must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if win exists and belongs to user
    const existingWin = await sql`
      SELECT * FROM wins
      WHERE id = ${winId} AND user_id = ${userId}
    `;

    if (existingWin.length === 0) {
      return NextResponse.json({ error: 'Win not found' }, { status: 404 });
    }

    // Build update object with only provided fields
    const currentWin = existingWin[0];
    const updatedWin = {
      title: title !== undefined ? title : currentWin.title,
      description: description !== undefined ? description : currentWin.description,
      category: category !== undefined ? category : currentWin.category,
      impact_level: impactLevel !== undefined ? impactLevel : currentWin.impact_level,
      date: date !== undefined ? date : currentWin.date,
      tags: tags !== undefined ? JSON.stringify(tags) : currentWin.tags,
    };

    // Update the win
    const result = await sql`
      UPDATE wins
      SET
        title = ${updatedWin.title},
        description = ${updatedWin.description},
        category = ${updatedWin.category},
        impact_level = ${updatedWin.impact_level},
        date = ${updatedWin.date},
        tags = ${updatedWin.tags}
      WHERE id = ${winId} AND user_id = ${userId}
      RETURNING *
    `;

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating win:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update win' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wins/[id]
 * Delete a specific win for the authenticated user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authenticateToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: winId } = await params;

    const result = await sql`
      DELETE FROM wins
      WHERE id = ${winId} AND user_id = ${userId}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Win not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Win deleted successfully', win: result[0] });
  } catch (error: any) {
    console.error('Error deleting win:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete win' },
      { status: 500 }
    );
  }
}
