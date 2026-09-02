import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/admin-auth';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = await sql`
    SELECT id, slug, title, excerpt, cover_image, status, published_at, created_at, updated_at
    FROM blog_posts ORDER BY updated_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const title = String(body.title ?? '').trim();
    if (!title) {
      return NextResponse.json({ error: 'Titel is verplicht' }, { status: 400 });
    }

    let slug = String(body.slug ?? '').trim() || slugify(title);
    const existing = await sql`SELECT id FROM blog_posts WHERE slug = ${slug}`;
    if (existing.length > 0) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const status = body.status === 'published' ? 'published' : 'draft';
    const publishedAt = status === 'published' ? new Date().toISOString() : null;

    const rows = await sql`
      INSERT INTO blog_posts (slug, title, excerpt, content, cover_image, status, seo_title, seo_description, published_at)
      VALUES (${slug}, ${title}, ${body.excerpt ?? ''}, ${body.content ?? ''}, ${body.coverImage ?? null},
              ${status}, ${body.seoTitle ?? null}, ${body.seoDescription ?? null}, ${publishedAt})
      RETURNING id, slug
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Create blog post error:', error);
    return NextResponse.json({ error: 'Kon post niet aanmaken' }, { status: 500 });
  }
}
