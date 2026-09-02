'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

export interface PostFormValues {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  status: string;
  seoTitle: string;
  seoDescription: string;
}

const empty: PostFormValues = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  status: 'draft',
  seoTitle: '',
  seoDescription: '',
};

export function PostForm({ initial }: { initial?: Partial<PostFormValues> }) {
  const [values, setValues] = useState<PostFormValues>({ ...empty, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const isEdit = Boolean(values.id);

  const set = <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSave = async (status?: string) => {
    setSaving(true);
    setError('');
    const payload = { ...values, status: status ?? values.status };
    try {
      const res = await fetch(isEdit ? `/api/admin/blog/${values.id}` : '/api/admin/blog', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Opslaan mislukt');
      }
      router.push('/admin/blog');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">{isEdit ? 'Post bewerken' : 'Nieuwe post'}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleSave('draft')} disabled={saving}>
            Opslaan als concept
          </Button>
          <Button onClick={() => handleSave('published')} disabled={saving}>
            <Save size={16} className="mr-2" />
            {values.status === 'published' && isEdit ? 'Opslaan' : 'Publiceren'}
          </Button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-error-soft text-error rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Input
            label="Titel"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Titel van de post"
          />
          <Input
            label="Samenvatting"
            value={values.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            placeholder="Korte samenvatting voor overzichtspagina's"
          />
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2">Inhoud</label>
            <RichTextEditor content={values.content} onChange={(html) => set('content', html)} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface-card border border-line rounded-xl p-4 space-y-4">
            <Input
              label="Slug"
              value={values.slug}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="auto-gegenereerd indien leeg"
            />
            <Input
              label="Coverafbeelding URL"
              value={values.coverImage}
              onChange={(e) => set('coverImage', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="bg-surface-card border border-line rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-ink text-sm">SEO</h3>
            <Input
              label="SEO titel"
              value={values.seoTitle}
              onChange={(e) => set('seoTitle', e.target.value)}
            />
            <Input
              label="SEO beschrijving"
              value={values.seoDescription}
              onChange={(e) => set('seoDescription', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
