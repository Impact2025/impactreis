'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AlertCircle, ArrowRight, Mail } from 'lucide-react';
import { AuthService } from '@/lib/auth';

export default function LoginPage() {
  const [mode, setMode]         = useState<'password' | 'magic-link'>('password');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const router                  = useRouter();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await AuthService.login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login mislukt');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signIn('resend', { email, redirect: false });
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
          <div className="w-12 h-12 rounded-[14px] bg-[#0a0a14] flex items-center justify-center mx-auto mb-5 text-white text-[16px] font-bold">
            OS
          </div>
          <h1 className="text-[28px] font-bold text-[#0a0a14] tracking-tight">
            Welkom terug
          </h1>
          <p className="text-[13px] text-[#8a8a9a] mt-1.5">
            Personal OS voor Hoogbegaafde Ondernemers
          </p>
        </div>

        {mode === 'password' ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="E-mailadres"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-[14px] bg-[#f4f4f7] border border-transparent text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] focus:bg-white transition-all"
            />
            <div className="relative">
              <input
                type="password"
                placeholder="Wachtwoord"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-[14px] bg-[#f4f4f7] border border-transparent text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] focus:bg-white transition-all"
              />
            </div>
            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-[12px] text-[#8a8a9a] hover:text-[#00cc66] transition-colors">
                Wachtwoord vergeten?
              </Link>
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
              className="w-full py-3.5 rounded-[14px] bg-[#00cc66] text-[#0a0a14] font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,204,102,0.35)] active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-[#0a0a14]/30 border-t-[#0a0a14] rounded-full animate-spin" />
                : <>Inloggen <ArrowRight size={15} /></>
              }
            </button>

            <button
              type="button"
              onClick={() => { setMode('magic-link'); setError(''); }}
              className="w-full py-3 rounded-[14px] border border-[#f0f0f3] text-[13px] text-[#0a0a14] font-semibold flex items-center justify-center gap-2 hover:border-[#00cc66] transition-colors"
            >
              <Mail size={15} /> Inloggen via magic link
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="E-mailadres"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3.5 rounded-[14px] bg-[#f4f4f7] border border-transparent text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] focus:bg-white transition-all"
            />
            <p className="text-[12px] text-[#8a8a9a] px-1">
              We sturen je een inloglink per e-mail — geen wachtwoord nodig.
            </p>

            {error && (
              <div className="flex items-center gap-2 px-3.5 py-3 rounded-[12px] bg-red-50 border border-red-100">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <span className="text-[12px] text-red-600">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-[14px] bg-[#00cc66] text-[#0a0a14] font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,204,102,0.35)] active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-[#0a0a14]/30 border-t-[#0a0a14] rounded-full animate-spin" />
                : <>Stuur inloglink <ArrowRight size={15} /></>
              }
            </button>

            <button
              type="button"
              onClick={() => { setMode('password'); setError(''); }}
              className="w-full py-3 rounded-[14px] border border-[#f0f0f3] text-[13px] text-[#0a0a14] font-semibold hover:border-[#00cc66] transition-colors"
            >
              Terug naar wachtwoord
            </button>
          </form>
        )}

        <p className="text-center text-[13px] text-[#8a8a9a] mt-6">
          Nog geen account?{' '}
          <Link href="/auth/register" className="text-[#0a0a14] font-semibold hover:text-[#00cc66] transition-colors">
            Registreer gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
