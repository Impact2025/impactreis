'use client';

import { useEffect, useState } from 'react';
import { Anchor } from 'lucide-react';

export function VisionCard() {
  const [countdown, setCountdown] = useState({ days: 0, months: 0 });

  useEffect(() => {
    const calculateCountdown = () => {
      const target = new Date('2027-03-01');
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const months = Math.floor(days / 30);

      setCountdown({ days, months });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-900 via-slate-900 to-slate-950">
      {/* Subtle wave pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          <path
            d="M0,100 C100,150 200,50 300,100 C400,150 400,100 400,100 L400,200 L0,200 Z"
            fill="currentColor"
            className="text-cyan-500"
          />
          <path
            d="M0,120 C100,170 200,70 300,120 C400,170 400,120 400,120 L400,200 L0,200 Z"
            fill="currentColor"
            className="text-cyan-600"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-cyan-400/80 uppercase tracking-wider mb-1">Waarom ik dit doe</p>
            <h2 className="text-lg font-semibold text-white">
              Maart 2027: Eigen zeiljacht
            </h2>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <Anchor className="text-cyan-400" size={20} />
          </div>
        </div>

        <div className="flex gap-8 mt-5">
          <div>
            <p className="text-3xl font-bold text-white">{countdown.days}</p>
            <p className="text-xs text-slate-400">dagen te gaan</p>
          </div>
          <div className="h-12 w-px bg-slate-700" />
          <div>
            <p className="text-3xl font-bold text-white">€5k</p>
            <p className="text-xs text-slate-400">/ maand doel</p>
          </div>
        </div>
      </div>
    </div>
  );
}
