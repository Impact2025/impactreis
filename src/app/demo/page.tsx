'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, ArrowRight, Lock, Rocket } from 'lucide-react';

export default function DemoLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const router                = useRouter();

  /* Publiek gedeeld demo-wachtwoord — bewust hardcoded in de UI (het is geen geheim,
     de echte gate zit server-side in DEMO_PASSWORD, zie /api/auth/demo-login). */
  const DEMO_DISPLAY_PASSWORD = 'demo123';

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: DEMO_DISPLAY_PASSWORD }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Demo-login mislukt');
      }

      const data = await response.json();
      if (data.user && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="w-full max-w-[360px]">

        {/* Logo */}
        <div className="text-center mb-10">
          <Image src="/logo.png" alt="Sparren.app" width={48} height={48} className="rounded-[14px] mx-auto mb-5" priority />
          <h1 className="text-[28px] font-bold text-ink tracking-tight">
            Welkom terug
          </h1>
          <p className="text-[13px] text-ink-soft mt-1.5">
            Jouw Executive AI-Assistant & Mindset Copiloot
          </p>
        </div>

        {/* ── Demo proefen ── */}
        <div>
          <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-line">
            <Rocket size={16} className="text-primary" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-[0.18em]">Demo</span>
          </div>

          <p className="text-[12px] text-ink-soft leading-relaxed mb-4">
            Wil je de app eerst uitproberen? Log dan in op het gedeelde demo-account.
            Iedereen krijgt toegang tot dezelfde demo-omgeving — één klik, geen wachtwoord nodig.
          </p>

          <form onSubmit={handleDemoLogin} className="space-y-3">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-[14px] bg-surface-sunken text-[12px] text-ink-soft">
              <Lock size={14} className="flex-shrink-0" />
              Demo-wachtwoord: <span className="font-mono font-semibold text-ink">{DEMO_DISPLAY_PASSWORD}</span>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3.5 py-3 rounded-[12px] bg-red-50 border border-red-100">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <span className="text-[12px] text-red-600">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-[14px] bg-primary text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(81,96,80,0.35)] active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-ink/30 border-t-[#0a0a14] rounded-full animate-spin" />
                : <>Inloggen als demo <ArrowRight size={15} /></>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
