'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Share2, Trophy, Target, CheckCircle2, X } from 'lucide-react';

type ShareType = 'win' | 'goal' | 'note';

export default function SharePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shareType, setShareType] = useState<ShareType>('win');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Get shared data from URL params
    const sharedTitle = searchParams.get('title') || '';
    const sharedText = searchParams.get('text') || '';
    const sharedUrl = searchParams.get('url') || '';

    setTitle(sharedTitle);
    setText(sharedText);
    setUrl(sharedUrl);
  }, [searchParams]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const data = {
        title: title || 'Gedeeld item',
        description: text,
        source: url,
        createdAt: new Date().toISOString(),
      };

      if (shareType === 'win') {
        // Save as win
        const response = await fetch('/api/wins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            category: 'general',
            impactLevel: 3,
          }),
        });
        if (!response.ok) throw new Error('Failed to save');
      } else if (shareType === 'goal') {
        // Save as goal
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            type: 'other',
          }),
        });
        if (!response.ok) throw new Error('Failed to save');
      }

      setSaved(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error saving shared content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    router.push('/dashboard');
  };

  if (saved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Opgeslagen!</h2>
          <p className="text-slate-400">Je wordt doorgestuurd...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Gedeelde content</h1>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Type selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Opslaan als
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setShareType('win')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-colors ${
              shareType === 'win'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
            }`}
          >
            <Trophy className="w-5 h-5" />
            Win
          </button>
          <button
            onClick={() => setShareType('goal')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-colors ${
              shareType === 'goal'
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
            }`}
          >
            <Target className="w-5 h-5" />
            Doel
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Titel
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Geef een titel..."
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      {/* Text */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Beschrijving
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Beschrijving..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none"
        />
      </div>

      {/* URL */}
      {url && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Bron
          </label>
          <div className="px-4 py-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
            <p className="text-slate-400 text-sm truncate">{url}</p>
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving || !title.trim()}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Opslaan...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Opslaan als {shareType === 'win' ? 'Win' : 'Doel'}
          </>
        )}
      </button>
    </div>
  );
}
