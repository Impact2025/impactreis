'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Er ging iets mis');
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er ging iets mis');
    } finally {
      setLoading(false);
    }
  };

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

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#f0fdf4] flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-[#00cc66]" />
            </div>
            <h1 className="text-[24px] font-bold text-[#0a0a14] mb-2">E-mail verstuurd</h1>
            <p className="text-[14px] text-[#8a8a9a] leading-relaxed">
              Als dit e-mailadres bekend is, ontvang je binnen een paar minuten een resetlink.
              Controleer ook je spam-map.
            </p>
            <p className="text-[12px] text-[#8a8a9a] mt-4">De link is 1 uur geldig.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="w-12 h-12 rounded-[14px] bg-[#0a0a14] flex items-center justify-center mb-5 text-white text-[16px] font-bold">
                OS
              </div>
              <h1 className="text-[28px] font-bold text-[#0a0a14] tracking-tight">
                Wachtwoord vergeten
              </h1>
              <p className="text-[13px] text-[#8a8a9a] mt-1.5">
                Vul je e-mailadres in. Je ontvangt een link om je wachtwoord opnieuw in te stellen.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a9a]" />
                <input
                  type="email"
                  placeholder="E-mailadres"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-11 pr-4 py-3.5 rounded-[14px] bg-[#f4f4f7] border border-transparent text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] focus:bg-white transition-all"
                />
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
                className="w-full py-3.5 rounded-[14px] bg-[#00cc66] text-[#0a0a14] font-bold text-[14px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,204,102,0.35)] active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-[#0a0a14]/30 border-t-[#0a0a14] rounded-full animate-spin" />
                  : 'Verstuur resetlink'
                }
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
