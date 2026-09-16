'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { REALITY_CHECK_MAX_SCORE, getProfile, getHoursLost } from '@/lib/reality-check';

function Logo({ size = 26 }: { size?: number }) {
  return (
    <Image src="/logo.png" alt="Sparren.app logo" width={size} height={size} className="rounded-[6px]" priority />
  );
}

function ResultRecap() {
  const params = useSearchParams();
  const scoreParam = Number(params.get('score'));
  const score = Number.isFinite(scoreParam) ? Math.max(0, Math.min(REALITY_CHECK_MAX_SCORE, scoreParam)) : null;

  if (score === null) {
    return (
      <div className="text-center">
        <h1 className="text-[24px] font-bold mb-3">Geen resultaat gevonden</h1>
        <p className="text-[14px] text-ink-soft mb-8">Deze link mist een geldige score. Doe de check opnieuw.</p>
        <Link href="/reality-check" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-[14px]">
          Start de Reality Check <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  const profile = getProfile(score);
  const { weekly, monthly } = getHoursLost(score);

  return (
    <div>
      <div className="rounded-[24px] bg-surface-inverse p-7 sm:p-9">
        <p className="text-[10px] font-bold text-primary-light uppercase tracking-[0.18em] mb-3">
          Executive Reality Check &middot; Audit Rapport
        </p>
        <p className="text-[13px] text-on-surface-inverse/60 mb-1">Score: {score}/{REALITY_CHECK_MAX_SCORE}</p>
        <h1 className="text-[26px] sm:text-[30px] font-bold text-white leading-tight mb-3">{profile.label}</h1>
        <p className="text-[15px] text-on-surface-inverse/80 leading-relaxed">{profile.tagline}</p>

        <div className="rounded-[16px] bg-white/8 border border-white/10 p-4 mt-7">
          <p className="text-[10px] font-bold text-on-surface-inverse/50 uppercase tracking-widest mb-1.5">Geschat verloren tijd</p>
          <p className="text-[20px] font-bold text-white">{weekly} uur / week</p>
          <p className="text-[12px] text-on-surface-inverse/60 mt-0.5">≈ {monthly} uur per maand &middot; {profile.annualHoursRange}</p>
        </div>
      </div>

      <div className="rounded-[20px] bg-primary-muted border border-primary-light p-6 mt-5 text-center">
        <p className="text-[15px] font-bold text-ink mb-2">Stop met geleefd worden.</p>
        <p className="text-[13px] text-ink-soft mb-6 leading-relaxed">
          Bespreek je uitslag in een Strategische Debrief Call — geen verkoopgesprek, we leggen de zaag direct op jouw knelpunten.
        </p>
        <Link
          href="/auth/register"
          className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-primary text-white font-bold text-[14px] shadow-[0_4px_16px_rgba(81,96,80,0.3)] hover:bg-primary-dark active:scale-[0.98] transition-all"
        >
          Boek je Strategische Debrief Call
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

export default function RealityCheckResultPage() {
  return (
    <div className="min-h-screen bg-white text-ink font-sans">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-line">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={26} />
            <span className="text-[15px] font-bold tracking-tight">Sparren.app</span>
          </Link>
        </div>
      </nav>
      <div className="max-w-lg mx-auto px-6 py-10">
        <Suspense fallback={null}>
          <ResultRecap />
        </Suspense>
      </div>
    </div>
  );
}
