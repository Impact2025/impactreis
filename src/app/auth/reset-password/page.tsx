'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
    if (password.length < 6) { setError('Minimaal 6 tekens'); return; }

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
        <div className="w-16 h-16 rounded-full bg-[#f0fdf4] flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-[#00cc66]" />
        </div>
        <h1 className="text-[24px] font-bold text-[#0a0a14] mb-2">Wachtwoord gewijzigd</h1>
        <p className="text-[14px] text-[#8a8a9a]">Je wordt doorgestuurd naar inloggen…</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <div className="w-12 h-12 rounded-[14px] bg-[#0a0a14] flex items-center justify-center mb-5 text-white text-[16px] font-bold">
          OS
        </div>
        <h1 className="text-[28px] font-bold text-[#0a0a14] tracking-tight">
          Nieuw wachtwoord
        </h1>
        <p className="text-[13px] text-[#8a8a9a] mt-1.5">
          Kies een nieuw wachtwoord van minimaal 6 tekens.
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
            disabled={!token}
            className="w-full px-4 pr-11 py-3.5 rounded-[14px] bg-[#f4f4f7] border border-transparent text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a8a9a] hover:text-[#0a0a14] transition-colors"
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
          className="w-full px-4 py-3.5 rounded-[14px] bg-[#f4f4f7] border border-transparent text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] focus:bg-white transition-all disabled:opacity-50"
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
          className="w-full py-3.5 rounded-[14px] bg-[#00cc66] text-[#0a0a14] font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,204,102,0.35)] active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-[#0a0a14]/30 border-t-[#0a0a14] rounded-full animate-spin" />
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
          className="inline-flex items-center gap-2 text-[13px] text-[#8a8a9a] hover:text-[#0a0a14] transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Terug naar inloggen
        </Link>
        <Suspense fallback={<div className="w-5 h-5 border-2 border-[#00cc66] border-t-transparent rounded-full animate-spin mx-auto" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
