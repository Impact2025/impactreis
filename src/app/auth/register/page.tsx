'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { AuthService } from '@/lib/auth';

export default function RegisterPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const router                  = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await AuthService.register(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registratie mislukt');
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
            Start je reis
          </h1>
          <p className="text-[13px] text-[#8a8a9a] mt-1.5">
            Gratis account voor hoogbegaafde ondernemers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="E-mailadres"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3.5 rounded-[14px] bg-[#f4f4f7] border border-transparent text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] focus:bg-white transition-all"
          />
          <input
            type="password"
            placeholder="Wachtwoord (min. 8 tekens)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3.5 rounded-[14px] bg-[#f4f4f7] border border-transparent text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none focus:border-[#00cc66] focus:bg-white transition-all"
          />

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
              : <>Account Maken <ArrowRight size={15} /></>
            }
          </button>
        </form>

        {/* Benefits */}
        <div className="mt-6 space-y-2">
          {['Gratis te starten', 'Geen creditcard nodig', 'Direct toegang'].map(b => (
            <div key={b} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#f0fdf4] flex items-center justify-center text-[#00cc66] text-[10px] font-bold">✓</span>
              <span className="text-[12px] text-[#8a8a9a]">{b}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[13px] text-[#8a8a9a] mt-6">
          Al een account?{' '}
          <Link href="/auth/login" className="text-[#0a0a14] font-semibold hover:text-[#00cc66] transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
