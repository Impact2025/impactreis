'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, RefreshCw, Compass, Send } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { BottomNav } from '@/components/ui/bottom-nav';

interface AnalyseResult {
  technique: string;
  techniqueLabel: string;
  reason: string;
  analysis: string;
  streak: number;
}

interface Lesson {
  id: number;
  insight: string;
  techniqueLabel: string;
  confidence: number;
  times_confirmed: number;
}

interface CoachMessage {
  id: string;
  role: 'coach' | 'user';
  content: string;
  ts: number;
}

export default function CoachPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<AnalyseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);

  const fetchLessons = async () => {
    try {
      const res = await fetch('/api/coach/lessons', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLessons(data.lessons ?? []);
      }
    } catch {
      // stil, dit is een aanvullend blok — de reflectie zelf is het belangrijkste
    }
  };

  const askReflection = async () => {
    setAsking(true);
    setError(null);
    try {
      const res = await fetch('/api/coach/analyse', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Kon geen reflectie ophalen');
        return;
      }
      setResult(data);
      fetchLessons();
      // Add coach's first message to the conversation
      setMessages([{ id: 'coach-1', role: 'coach', content: data.analysis, ts: Date.now() }]);
    } catch {
      setError('Kon geen reflectie ophalen');
    } finally {
      setAsking(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !result) return;
    const userMsg: CoachMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      ts: Date.now(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setSending(true);
    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (res.ok && data.analysis) {
        setMessages((prev) => [...prev, {
          id: `coach-${Date.now()}`,
          role: 'coach',
          content: data.analysis,
          ts: Date.now(),
        }]);
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!AuthService.isAuthenticated()) { router.push('/auth/login'); return; }
    fetchLessons().finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#00cc66] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] pb-28">
      <div className="sticky top-0 z-10 bg-[#ffffff] border-b border-[#e8e8ec]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f4f4f7] transition-colors">
            <ArrowLeft size={18} className="text-[#0a0a14]" />
          </Link>
          <h1 className="text-[17px] font-semibold text-[#0a0a14]">AIPA</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-5 space-y-5">
        <div className="rounded-[16px] border border-[#e8e8ec] p-5 bg-[#0a0a14]">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-[#00cc66]" />
            <span className="text-[11px] text-white/40 uppercase tracking-widest">Business &amp; welzijn, gecombineerd</span>
          </div>
          <p className="text-[14px] text-white/80 leading-relaxed mb-4">
            Vraag een reflectie op basis van je ritueel van vandaag, je energie-geschiedenis en wat er eerder over je patronen is geleerd.
          </p>
          <button
            onClick={askReflection}
            disabled={asking}
            className="w-full py-3.5 bg-[#00cc66] text-white text-[14px] font-semibold rounded-[12px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {asking ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Compass size={16} />
            )}
            {asking ? 'Reflecteert...' : 'Vraag reflectie'}
          </button>
        </div>

        {error && (
          <div className="rounded-[16px] border border-red-100 bg-red-50 p-4">
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="rounded-[16px] border border-[#e8e8ec] p-5">
            <span className="inline-block text-[11px] font-medium text-[#00cc66] bg-[#00cc66]/10 rounded-full px-2.5 py-1 mb-3">
              {result.techniqueLabel}
            </span>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block rounded-[12px] px-4 py-3 ${
                    msg.role === 'user' ? 'bg-[#0a0a14] text-white' : 'bg-[#f4f4f7] text-[#0a0a14]'
                  }`}>
                    <p className="text-[14px] leading-relaxed whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Typ je antwoord op de vraag..."
                className="flex-1 px-4 py-3 border border-[#e8e8ec] rounded-[12px] text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] focus:outline-none focus:ring-2 focus:ring-[#00cc66]/20"
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={sending || !inputValue.trim()}
                className="px-4 py-3 bg-[#0a0a14] text-white rounded-[12px] text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center"
              >
                {sending ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            <p className="text-[11px] text-[#8a8a9a] mt-3 pt-3 border-t border-[#f4f4f7]">{result.reason}</p>
          </div>
        )}

        {lessons.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-[#8a8a9a] uppercase tracking-wider mb-2.5 px-1">Wat de coach al over je weet</p>
            <div className="space-y-2">
              {lessons.map((l) => (
                <div key={l.id} className="rounded-[14px] border border-[#e8e8ec] p-4">
                  <p className="text-[13px] text-[#0a0a14] leading-relaxed mb-1.5">{l.insight}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8a8a9a]">{l.techniqueLabel}</span>
                    <span className="text-[10px] text-[#8a8a9a]">&middot;</span>
                    <span className="text-[10px] text-[#8a8a9a]">{Math.round(l.confidence * 100)}% trefkans, {l.times_confirmed}x gezien</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
