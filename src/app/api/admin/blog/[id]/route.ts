import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const rows = await sql`SELECT * FROM blog_posts WHERE id = ${id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const status = body.status === 'published' ? 'published' : 'draft';

    const current = await sql`SELECT status, published_at FROM blog_posts WHERE id = ${id}`;
    if (current.length === 0) {
      return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
    }
    const publishedAt =
      status === 'published'
        ? current[0].published_at ?? new Date().toISOString()
        : null;

    await sql`
      UPDATE blog_posts SET
        title = ${body.title ?? ''},
        slug = ${body.slug ?? ''},
        excerpt = ${body.excerpt ?? ''},
        content = ${body.content ?? ''},
        cover_image = ${body.coverImage ?? null},
        status = ${status},
        seo_title = ${body.seoTitle ?? null},
        seo_description = ${body.seoDescription ?? null},
        published_at = ${publishedAt},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update blog post error:', error);
    return NextResponse.json({ error: 'Kon post niet opslaan' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  await sql`DELETE FROM blog_posts WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
