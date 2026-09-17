'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, RefreshCw, Compass, Send, TrendingUp, Check, X, HelpCircle, Mic, Volume2, VolumeX, Zap } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/use-speech';

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

interface Prediction {
  id: number;
  statement: string;
  metricLabel: string;
  due_date: string;
  outcome: 'correct' | 'incorrect' | 'unclear' | null;
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
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const speech = useSpeechRecognition();
  const tts = useSpeechSynthesis();

  const [mode, setMode] = useState<'reflectie' | 'dump'>('reflectie');
  const [dumpText, setDumpText] = useState('');
  const [dumpLoading, setDumpLoading] = useState(false);
  const [dumpQuestions, setDumpQuestions] = useState<string[] | null>(null);
  const [dumpFlagged, setDumpFlagged] = useState(false);
  const [dumpTimesSeen, setDumpTimesSeen] = useState(0);
  const [dumpError, setDumpError] = useState<string | null>(null);

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

  const fetchPredictions = async () => {
    try {
      const res = await fetch('/api/coach/predictions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions ?? []);
      }
    } catch {
      // stil, aanvullend blok
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
      fetchPredictions();
      // Add coach's first message to the conversation
      setMessages([{ id: 'coach-1', role: 'coach', content: data.analysis, ts: Date.now() }]);
      if (voiceMode) tts.speak(data.analysis);
    } catch {
      setError('Kon geen reflectie ophalen');
    } finally {
      setAsking(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? inputValue).trim();
    if (!text || !result) return;
    const userMsg: CoachMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      ts: Date.now(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    speech.resetTranscript();
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
        if (voiceMode) tts.speak(data.analysis);
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const askDump = async () => {
    const text = dumpText.trim();
    if (!text) return;
    setDumpLoading(true);
    setDumpError(null);
    try {
      const res = await fetch('/api/coach/dump', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDumpError(data.error ?? 'Kon deze gedachte niet filteren');
        return;
      }
      setDumpQuestions(data.questions ?? []);
      setDumpFlagged(!!data.patternFlagged);
      setDumpTimesSeen(data.timesSeen ?? 0);
      setDumpText('');
    } catch {
      setDumpError('Kon deze gedachte niet filteren');
    } finally {
      setDumpLoading(false);
    }
  };

  // Houdt het juiste tekstveld live bij tijdens het spreken — reflectie-antwoord of gedachtendump,
  // afhankelijk van welke tab actief is.
  useEffect(() => {
    if (!speech.listening) return;
    if (mode === 'dump') setDumpText(speech.transcript);
    else setInputValue(speech.transcript);
  }, [speech.transcript, speech.listening, mode]);

  // Stuurt automatisch door zodra het spreken stopt — alleen in de reflectie-chat. De gedachtendump
  // is bewust een expliciete "Filter"-klik, geen auto-send, want dit is geen doorlopend gesprek.
  const wasListeningRef = useRef(false);
  useEffect(() => {
    if (wasListeningRef.current && !speech.listening && speech.transcript.trim() && mode === 'reflectie') {
      handleSend(speech.transcript);
    }
    wasListeningRef.current = speech.listening;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.listening]);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) { router.push('/auth/login'); return; }
    Promise.all([fetchLessons(), fetchPredictions()]).finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-card flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-card pb-28">
      <div className="sticky top-0 z-10 bg-surface-card border-b border-line">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-sunken transition-colors">
            <ArrowLeft size={18} className="text-ink" />
          </Link>
          <h1 className="text-[17px] font-semibold text-ink">Sparren</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-5 space-y-5">
        <div className="flex gap-2 p-1 rounded-[12px] bg-surface-sunken">
          <button
            onClick={() => setMode('reflectie')}
            className={`flex-1 py-2 text-[13px] font-semibold rounded-[9px] transition-colors ${
              mode === 'reflectie' ? 'bg-surface-inverse text-white' : 'text-ink-soft'
            }`}
          >
            Reflectie
          </button>
          <button
            onClick={() => setMode('dump')}
            className={`flex-1 py-2 text-[13px] font-semibold rounded-[9px] transition-colors ${
              mode === 'dump' ? 'bg-surface-inverse text-white' : 'text-ink-soft'
            }`}
          >
            Snelle gedachte
          </button>
        </div>

        {mode === 'reflectie' && (
          <div className="rounded-[16px] border border-line p-5 bg-surface-inverse">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-primary" />
              <span className="text-[11px] text-white/40 uppercase tracking-widest">Business &amp; welzijn, gecombineerd</span>
            </div>
            <p className="text-[14px] text-white/80 leading-relaxed mb-4">
              Vraag een reflectie op basis van je ritueel van vandaag, je energie-geschiedenis en wat er eerder over je patronen is geleerd.
            </p>
            <button
              onClick={askReflection}
              disabled={asking}
              className="w-full py-3.5 bg-primary text-white text-[14px] font-semibold rounded-[12px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {asking ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Compass size={16} />
              )}
              {asking ? 'Reflecteert...' : 'Vraag reflectie'}
            </button>
          </div>
        )}

        {mode === 'dump' && (
          <div className="rounded-[16px] border border-line p-5 bg-surface-inverse">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-primary" />
              <span className="text-[11px] text-white/40 uppercase tracking-widest">Executive zeef</span>
            </div>
            <p className="text-[14px] text-white/80 leading-relaxed mb-4">
              Wat zit je nu dwars of welk idee spookt door je hoofd? Dump het in een paar zinnen — geen gesprek, wel een scherpe vraag terug.
            </p>
            <textarea
              value={dumpText}
              onChange={(e) => setDumpText(e.target.value)}
              placeholder="Typ of spreek in..."
              rows={3}
              disabled={dumpLoading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-[12px] text-[14px] text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none mb-3"
            />
            <div className="flex gap-2">
              {speech.supported && (
                <button
                  onClick={() => (speech.listening ? speech.stop() : speech.start())}
                  disabled={dumpLoading}
                  className={`px-4 py-3 rounded-[12px] text-[14px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center ${
                    speech.listening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white'
                  }`}
                  title={speech.listening ? 'Stop met luisteren' : 'Spreek je gedachte in'}
                >
                  <Mic size={16} />
                </button>
              )}
              <button
                onClick={askDump}
                disabled={dumpLoading || !dumpText.trim()}
                className="flex-1 py-3 bg-primary text-white text-[14px] font-semibold rounded-[12px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {dumpLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                {dumpLoading ? 'Filtert...' : 'Filter deze gedachte'}
              </button>
            </div>
          </div>
        )}

        {mode === 'dump' && dumpError && (
          <div className="rounded-[16px] border border-red-100 bg-red-50 p-4">
            <p className="text-[13px] text-red-600">{dumpError}</p>
          </div>
        )}

        {mode === 'dump' && dumpQuestions && dumpQuestions.length > 0 && (
          <div className="rounded-[16px] border border-line p-5 space-y-3">
            {dumpQuestions.map((q, i) => (
              <p key={i} className="text-[15px] text-ink font-medium leading-relaxed">{q}</p>
            ))}
            {dumpFlagged && (
              <p className="text-[11px] text-ink-soft pt-3 border-t border-surface-sunken">
                Dit is al {dumpTimesSeen}x teruggekomen — dit thema komt terug op de vrijdag-scorecard.
              </p>
            )}
          </div>
        )}

        {mode === 'reflectie' && error && (
          <div className="rounded-[16px] border border-red-100 bg-red-50 p-4">
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        )}

        {mode === 'reflectie' && result && (
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-block text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1">
                {result.techniqueLabel}
              </span>
              {tts.supported && (
                <button
                  onClick={() => {
                    if (tts.speaking) tts.stop();
                    setVoiceMode((v) => !v);
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                    voiceMode ? 'bg-primary/10 text-primary' : 'text-ink-soft hover:bg-surface-sunken'
                  }`}
                  title={voiceMode ? 'Coach leest antwoorden voor (aan)' : 'Coach leest antwoorden voor (uit)'}
                >
                  {voiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              )}
            </div>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block rounded-[12px] px-4 py-3 ${
                    msg.role === 'user' ? 'bg-surface-inverse text-white' : 'bg-surface-sunken text-ink'
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
                placeholder={speech.listening ? 'Ik luister...' : 'Typ je antwoord op de vraag...'}
                className="flex-1 px-4 py-3 border border-line rounded-[12px] text-[14px] text-ink placeholder-ink-soft focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={sending || speech.listening}
              />
              {speech.supported && (
                <button
                  onClick={() => (speech.listening ? speech.stop() : speech.start())}
                  disabled={sending}
                  className={`px-4 py-3 rounded-[12px] text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center ${
                    speech.listening ? 'bg-red-500 text-white animate-pulse' : 'bg-surface-sunken text-ink'
                  }`}
                  title={speech.listening ? 'Stop met luisteren' : 'Praat met de coach'}
                >
                  <Mic size={16} />
                </button>
              )}
              <button
                onClick={() => handleSend()}
                disabled={sending || !inputValue.trim()}
                className="px-4 py-3 bg-surface-inverse text-white rounded-[12px] text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center"
              >
                {sending ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            <p className="text-[11px] text-ink-soft mt-3 pt-3 border-t border-surface-sunken">{result.reason}</p>
          </div>
        )}

        {predictions.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-ink-soft uppercase tracking-wider mb-2.5 px-1">Voorspellingen van de coach</p>
            <div className="space-y-2">
              {predictions.map((p) => {
                const daysLeft = Math.ceil((new Date(p.due_date).getTime() - Date.now()) / 86400000);
                return (
                  <div key={p.id} className="rounded-[14px] border border-line p-4">
                    <div className="flex items-start gap-2.5">
                      {p.outcome === 'correct' ? (
                        <Check size={15} className="text-primary shrink-0 mt-0.5" />
                      ) : p.outcome === 'incorrect' ? (
                        <X size={15} className="text-red-500 shrink-0 mt-0.5" />
                      ) : p.outcome === 'unclear' ? (
                        <HelpCircle size={15} className="text-ink-soft shrink-0 mt-0.5" />
                      ) : (
                        <TrendingUp size={15} className="text-tertiary shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-[13px] text-ink leading-relaxed">{p.statement}</p>
                        <p className="text-[10px] text-ink-soft mt-1.5">
                          {p.outcome === 'correct' ? 'Klopte'
                            : p.outcome === 'incorrect' ? 'Weerlegd'
                            : p.outcome === 'unclear' ? 'Onduidelijk'
                            : daysLeft > 0 ? `Uitkomst over ${daysLeft} dag${daysLeft === 1 ? '' : 'en'}` : 'Wordt binnenkort getoetst'}
                          {' · '}{p.metricLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {lessons.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-ink-soft uppercase tracking-wider mb-2.5 px-1">Wat de coach al over je weet</p>
            <div className="space-y-2">
              {lessons.map((l) => (
                <div key={l.id} className="rounded-[14px] border border-line p-4">
                  <p className="text-[13px] text-ink leading-relaxed mb-1.5">{l.insight}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-ink-soft">{l.techniqueLabel}</span>
                    <span className="text-[10px] text-ink-soft">&middot;</span>
                    <span className="text-[10px] text-ink-soft">{Math.round(l.confidence * 100)}% trefkans, {l.times_confirmed}x gezien</span>
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
