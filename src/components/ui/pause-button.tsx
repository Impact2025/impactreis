'use client';

import { useState, useEffect } from 'react';
import { X, Pause } from 'lucide-react';

type Phase = 'idle' | 'breathing' | 'questions' | 'done';

const QUESTIONS = [
  'Wat wordt er van mij gevraagd?',
  'Wat is de schone reactie?',
  'Of is stilte de schone reactie?',
];

export function PauseButton() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [breathPhase, setBreathPhase] = useState<'in' | 'out'>('in');
  const [breathCount, setBreathCount] = useState(0);
  const [visibleQuestions, setVisibleQuestions] = useState(0);

  // Reset state when opening
  const handleOpen = () => {
    setPhase('breathing');
    setBreathPhase('in');
    setBreathCount(0);
    setVisibleQuestions(0);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setPhase('idle');
  };

  // Breathing cycle: 4s inhale / 6s exhale
  useEffect(() => {
    if (phase !== 'breathing') return;

    const cycleDuration = breathPhase === 'in' ? 4000 : 6000;

    const timer = setTimeout(() => {
      if (breathPhase === 'in') {
        setBreathPhase('out');
      } else {
        const next = breathCount + 1;
        setBreathCount(next);
        if (next >= 3) {
          // 3 full breath cycles done → move to questions
          setPhase('questions');
        } else {
          setBreathPhase('in');
        }
      }
    }, cycleDuration);

    return () => clearTimeout(timer);
  }, [phase, breathPhase, breathCount]);

  // Stagger in questions one by one
  useEffect(() => {
    if (phase !== 'questions') return;
    if (visibleQuestions >= QUESTIONS.length) return;

    const timer = setTimeout(() => {
      setVisibleQuestions((v) => v + 1);
    }, 800);

    return () => clearTimeout(timer);
  }, [phase, visibleQuestions]);

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        aria-label="Pauze noodknop"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        style={{ animation: 'pausePulse 3s ease-in-out infinite' }}
      >
        <Pause size={22} />
        <style>{`
          @keyframes pausePulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
            50% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          }
        `}</style>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60">
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 p-2 text-white/60 hover:text-white transition-colors"
        aria-label="Sluiten"
      >
        <X size={24} />
      </button>

      <div className="max-w-md w-full mx-6 flex flex-col items-center gap-10">
        {/* Breathing Phase */}
        {phase === 'breathing' && (
          <div className="flex flex-col items-center gap-8">
            {/* Expanding circle */}
            <div className="relative flex items-center justify-center">
              <div
                className="rounded-full bg-indigo-500/20 transition-all"
                style={{
                  width: breathPhase === 'in' ? '180px' : '100px',
                  height: breathPhase === 'in' ? '180px' : '100px',
                  transitionDuration: breathPhase === 'in' ? '4000ms' : '6000ms',
                  transitionTimingFunction: 'ease-in-out',
                }}
              />
              <div
                className="absolute rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center transition-all"
                style={{
                  width: breathPhase === 'in' ? '120px' : '70px',
                  height: breathPhase === 'in' ? '120px' : '70px',
                  transitionDuration: breathPhase === 'in' ? '4000ms' : '6000ms',
                  transitionTimingFunction: 'ease-in-out',
                }}
              >
                <span className="text-white text-sm font-medium">
                  {breathPhase === 'in' ? '4' : '6'}
                </span>
              </div>
            </div>

            <p
              className="text-2xl font-light text-white transition-all duration-600"
              key={breathPhase}
            >
              {breathPhase === 'in' ? 'Adem in...' : 'Adem uit...'}
            </p>

            <p className="text-sm text-white/50">
              {breathCount + 1} / 3 ademhalingen
            </p>
          </div>
        )}

        {/* Questions Phase */}
        {(phase === 'questions' || phase === 'done') && (
          <div className="w-full flex flex-col gap-6">
            <p className="text-center text-white/60 text-sm uppercase tracking-widest">
              Drie vragen
            </p>

            <div className="flex flex-col gap-4">
              {QUESTIONS.map((question, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white/10 border border-white/20 transition-all duration-700"
                  style={{
                    opacity: i < visibleQuestions ? 1 : 0,
                    transform: i < visibleQuestions ? 'translateY(0)' : 'translateY(16px)',
                  }}
                >
                  <span className="text-white/40 text-xs font-medium mr-2">{i + 1}.</span>
                  <span className="text-white text-lg font-light">{question}</span>
                </div>
              ))}
            </div>

            {visibleQuestions >= QUESTIONS.length && (
              <button
                onClick={handleClose}
                className="mt-4 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-lg hover:opacity-90 transition-opacity"
                style={{ animation: 'fadeIn 0.6s ease forwards' }}
              >
                Ik ben er klaar voor
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
