'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PostForm, type PostFormValues } from '@/components/admin/PostForm';

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<Partial<PostFormValues> | null>(null);

  useEffect(() => {
    fetch(`/api/admin/blog/${params.id}`)
      .then((r) => r.json())
      .then((row) =>
        setInitial({
          id: row.id,
          title: row.title ?? '',
          slug: row.slug ?? '',
          excerpt: row.excerpt ?? '',
          content: row.content ?? '',
          coverImage: row.cover_image ?? '',
          status: row.status ?? 'draft',
          seoTitle: row.seo_title ?? '',
          seoDescription: row.seo_description ?? '',
        }),
      );
  }, [params.id]);

  if (!initial) return <p className="text-ink-soft">Laden...</p>;

  return <PostForm key={initial.id} initial={initial} />;
}
