'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Post {
  id: number;
  title: string;
  slug: string;
  status: string;
  updated_at: string;
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('/api/admin/blog')
      .then((r) => r.json())
      .then(setPosts)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Deze post definitief verwijderen?')) return;
    await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Blog</h1>
        <Link href="/admin/blog/new">
          <Button>
            <Plus size={18} className="mr-2" />
            Nieuwe post
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-ink-soft">Laden...</p>
      ) : posts.length === 0 ? (
        <div className="bg-surface-card border border-line rounded-xl p-10 text-center text-ink-soft">
          <FileText size={32} className="mx-auto mb-3 text-outline" />
          Nog geen blogposts. Maak je eerste post aan.
        </div>
      ) : (
        <div className="bg-surface-card border border-line rounded-xl overflow-hidden">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between px-5 py-4 border-b border-line last:border-b-0"
            >
              <div>
                <div className="font-medium text-ink">{post.title}</div>
                <div className="text-sm text-ink-soft flex items-center gap-2 mt-0.5">
                  <span
                    className={
                      post.status === 'published'
                        ? 'inline-block px-2 py-0.5 rounded-full text-xs bg-primary-muted text-primary-dark'
                        : 'inline-block px-2 py-0.5 rounded-full text-xs bg-surface-sunken-strong text-ink-soft'
                    }
                  >
                    {post.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                  </span>
                  <span>/{post.slug}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/blog/${post.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Pencil size={16} />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}>
                  <Trash2 size={16} className="text-error" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
