'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { AlertCircle, ArrowRight, Mail } from 'lucide-react';
import { TurnstileWidget } from '@/components/ui/turnstile-widget';

const TURNSTILE_ENABLED = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function LoginPage() {
  const [email, setEmail]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const router                            = useRouter();

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (TURNSTILE_ENABLED) {
        if (!turnstileToken) {
          setError('Bevestig eerst dat je geen robot bent.');
          setLoading(false);
          return;
        }
        const verifyRes = await fetch('/api/turnstile/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        if (!verifyRes.ok) {
          setError('Verificatie mislukt. Probeer het opnieuw.');
          setTurnstileToken(null);
          setLoading(false);
          return;
        }
      }

      const result = await signIn('resend', { email, redirectTo: '/auth/bridge?next=/dashboard', redirect: false });
      if (result?.error) {
        setError('Versturen van de inloglink is mislukt. Probeer het opnieuw.');
      } else {
        router.push('/auth/check-email');
      }
    } catch {
      setError('Versturen van de inloglink is mislukt. Probeer het opnieuw.');
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

        {/* ── Reguliere login ── */}
        <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="E-mailadres"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3.5 rounded-[14px] bg-surface-sunken border border-transparent text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary focus:bg-white transition-all"
          />
          <p className="text-[12px] text-ink-soft px-1 flex items-center gap-1.5">
            <Mail size={13} className="shrink-0" /> We sturen je een inloglink per e-mail — geen wachtwoord nodig.
          </p>

          <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken(null)} />

          {error && (
            <div className="flex items-center gap-2 px-3.5 py-3 rounded-[12px] bg-red-50 border border-red-100">
              <AlertCircle size={15} className="text-red-500 shrink-0" />
              <span className="text-[12px] text-red-600">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (TURNSTILE_ENABLED && !turnstileToken)}
            className="w-full py-3.5 rounded-[14px] bg-primary text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(81,96,80,0.35)] active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-ink/30 border-t-[#0a0a14] rounded-full animate-spin" />
              : <>Stuur inloglink <ArrowRight size={15} /></>
            }
          </button>
        </form>

        <p className="text-center text-[13px] text-ink-soft mt-6">
          Nog geen account?{' '}
          <Link href="/auth/register" className="text-ink font-semibold hover:text-primary transition-colors">
            Toegang aanvragen
          </Link>
        </p>
      </div>
    </div>
  );
}
