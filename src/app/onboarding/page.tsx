'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Send } from 'lucide-react';
import { AuthService } from '@/lib/auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Splitst het [SUGGESTIES: A | B | C]-blok van de zichtbare tekst af.
function splitSuggestions(text: string): { text: string; chips: string[] } {
  const match = text.match(/\[SUGGESTIES:\s*([^\]]+)\]/i);
  if (!match) return { text, chips: [] };
  const chips = match[1].split('|').map((s) => s.trim()).filter(Boolean);
  return { text: text.replace(match[0], '').trim(), chips };
}

// Verwijdert het afsluitende ```json-blok uit wat aan de gebruiker getoond wordt — dat is
// interne data-extractie, geen conversatietekst.
function stripJsonBlock(text: string): string {
  return text.replace(/```json[\s\S]*?```/, '').trim();
}

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const saveProgress = (history: Message[]) => {
    const token = AuthService.getToken();
    fetch('/api/onboarding/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages: history }),
    }).catch(() => {}); // best-effort — een mislukte tussentijdse save mag het gesprek niet blokkeren
  };

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });

  // Scrol altijd mee zodra er nieuwe berichten bijkomen of het antwoord binnenstroomt,
  // ook als het eerste chunk pas laat arriveert.
  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming]);

  const send = async (history: Message[]) => {
    setStreaming(true);
    setError(null);
    const token = AuthService.getToken();

    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) throw new Error('Kon geen verbinding maken');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: assistantText };
          return next;
        });
      }

      // Intake klaar zodra het model een geldig profiel-JSON-blok teruggeeft.
      const { extractOnboardingProfile } = await import('@/lib/onboarding');
      const profile = extractOnboardingProfile(assistantText);
      if (profile) {
        const saveRes = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(profile),
        });
        if (saveRes.ok) setDone(true);
      } else {
        // Nog niet klaar — bewaar het gesprek zodat een refresh of afgebroken sessie kan hervatten.
        saveProgress([...history, { role: 'assistant', content: assistantText }]);
      }
    } catch {
      setError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setStreaming(false);
    }
  };

  useEffect(() => {
    if (!AuthService.isAuthenticated()) { router.push('/auth/login'); return; }
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      const token = AuthService.getToken();
      try {
        const res = await fetch('/api/onboarding/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.completed) {
            setDone(true);
            setRestoring(false);
            return;
          }
          if (Array.isArray(data.conversation) && data.conversation.length > 0) {
            // Gesprek al onderweg (refresh of afgebroken sessie) — hervat i.p.v. opnieuw te beginnen.
            setMessages(data.conversation);
            setRestoring(false);
            return;
          }
        }
      } catch {
        // kon voortgang niet ophalen — val terug op een schone start
      }
      setRestoring(false);
      // Onzichtbare aftrap: het systeemprompt regelt fase 1, dit triggert alleen de eerste beurt.
      const bootstrap: Message[] = [{ role: 'user', content: 'Ik ben klaar om te beginnen.' }];
      send(bootstrap);
    })();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;
    const next = [...messages, { role: 'user' as const, content: input.trim() }];
    setMessages(next);
    setInput('');
    send(next);
  };

  const useChip = (chip: string) => {
    if (streaming) return;
    const next = [...messages, { role: 'user' as const, content: chip }];
    setMessages(next);
    send(next);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-line px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Image src="/logo.png" alt="myAiPA logo" width={36} height={36} className="rounded-full" priority />
          <div>
            <p className="text-[14px] font-semibold text-ink">Aipa</p>
            <p className="text-[11px] text-ink-soft">Je Executive PA &amp; Impact Coach richt je werkruimte in</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-5 py-5 space-y-4 overflow-y-auto">
        {restoring && messages.length === 0 && !done && (
          <p className="text-[13px] text-ink-soft text-center">Even je gesprek ophalen…</p>
        )}
        {messages.filter((m) => m.role !== 'user' || m.content !== 'Ik ben klaar om te beginnen.').map((m, i) => {
          if (m.role === 'user') {
            return (
              <div key={i} className="flex justify-end">
                <div className="bg-surface-inverse text-white rounded-[16px] rounded-br-[4px] px-4 py-2.5 max-w-[80%] text-[14px]">
                  {m.content}
                </div>
              </div>
            );
          }
          const visible = stripJsonBlock(m.content);
          const { text, chips } = splitSuggestions(visible);
          return (
            <div key={i} className="space-y-2.5">
              <div className="bg-surface-sunken rounded-[16px] rounded-bl-[4px] px-4 py-2.5 max-w-[85%] text-[14px] text-ink whitespace-pre-line">
                {text || (streaming && i === messages.length - 1 ? '…' : '')}
              </div>
              {chips.length > 0 && !streaming && (
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => useChip(chip)}
                      className="text-[12px] px-3 py-1.5 rounded-full border border-line text-ink hover:border-primary hover:text-primary transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {error && (
          <div className="rounded-[16px] border border-red-100 bg-red-50 p-4">
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        )}

        {done && (
          <div className="rounded-[16px] border border-line p-5 text-center space-y-3">
            <p className="text-[14px] font-semibold text-ink">Je werkruimte staat klaar.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-[14px] bg-primary text-white font-bold text-[14px]"
            >
              Activeer mijn werkruimte
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!done && (
        <form onSubmit={handleSubmit} className="border-t border-line p-4">
          <div className="max-w-lg mx-auto flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={streaming}
              placeholder="Typ je antwoord..."
              className="flex-1 px-4 py-3 rounded-[14px] bg-surface-sunken border border-transparent text-[14px] outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="w-11 h-11 rounded-[14px] bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              <Send size={17} className="text-ink" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
