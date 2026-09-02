'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) setError('Ongeldige link. Vraag een nieuwe resetlink aan.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Wachtwoorden komen niet overeen'); return; }
    if (password.length < 8) { setError('Minimaal 8 tekens'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Er ging iets mis');
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary-muted flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-primary" />
        </div>
        <h1 className="text-[24px] font-bold text-ink mb-2">Wachtwoord gewijzigd</h1>
        <p className="text-[14px] text-ink-soft">Je wordt doorgestuurd naar inloggen…</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <Image src="/logo.png" alt="myAiPA" width={48} height={48} className="rounded-[14px] mb-5" />
        <h1 className="text-[28px] font-bold text-ink tracking-tight">
          Nieuw wachtwoord
        </h1>
        <p className="text-[13px] text-ink-soft mt-1.5">
          Kies een nieuw wachtwoord van minimaal 8 tekens.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Nieuw wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            minLength={8}
            disabled={!token}
            className="w-full px-4 pr-11 py-3.5 rounded-[14px] bg-surface-sunken border border-transparent text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Bevestig wachtwoord"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          disabled={!token}
          className="w-full px-4 py-3.5 rounded-[14px] bg-surface-sunken border border-transparent text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-50"
        />

        {error && (
          <div className="flex items-center gap-2 px-3.5 py-3 rounded-[12px] bg-red-50 border border-red-100">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <span className="text-[12px] text-red-600">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full py-3.5 rounded-[14px] bg-primary text-white font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(81,96,80,0.35)] active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-ink/30 border-t-[#0a0a14] rounded-full animate-spin" />
            : 'Wachtwoord opslaan'
          }
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="w-full max-w-[360px]">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-[13px] text-ink-soft hover:text-ink transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Terug naar inloggen
        </Link>
        <Suspense fallback={<div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
