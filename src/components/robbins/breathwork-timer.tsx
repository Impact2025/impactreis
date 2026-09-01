'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wind, Play, Pause, RotateCcw, Check, Sparkles } from 'lucide-react';

interface BreathworkTimerProps {
  onComplete: () => void;
  totalBreaths?: number;
}

type Phase = 'idle' | 'inhale' | 'exhale' | 'complete';

export function BreathworkTimer({ onComplete, totalBreaths = 30 }: BreathworkTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [showComplete, setShowComplete] = useState(false);

  const breathDuration = 1200; // 1.2 seconds per breath cycle (fast breathing)

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setBreathCount(0);
    setPhase('idle');
    setShowComplete(false);
  }, []);

  useEffect(() => {
    if (!isActive || breathCount >= totalBreaths) return;

    const cycleBreath = () => {
      setPhase('inhale');
      setTimeout(() => {
        setPhase('exhale');
        setTimeout(() => {
          setBreathCount(prev => prev + 1);
        }, breathDuration / 2);
      }, breathDuration / 2);
    };

    const interval = setInterval(cycleBreath, breathDuration);
    cycleBreath(); // Start immediately

    return () => clearInterval(interval);
  }, [isActive, breathCount, totalBreaths]);

  useEffect(() => {
    if (breathCount >= totalBreaths && isActive) {
      setIsActive(false);
      setPhase('complete');
      setShowComplete(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  }, [breathCount, totalBreaths, isActive, onComplete]);

  const progress = (breathCount / totalBreaths) * 100;

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'ADEM IN';
      case 'exhale': return 'ADEM UIT';
      case 'complete': return 'VOLTOOID';
      default: return 'START';
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return 'from-accent to-accent';
      case 'exhale': return 'from-accent to-error';
      case 'complete': return 'from-primary to-primary';
      default: return 'from-surface-sunken-strong to-surface-inverse';
    }
  };

  if (showComplete) {
    return (
      <div className="bg-gradient-to-br from-primary to-primary rounded-2xl p-8 text-center animate-pulse">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Priming Voltooid!</h3>
        <p className="text-white/80">Je energie stroomt. Je bent klaar.</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Sparkles className="w-5 h-5 text-tertiary animate-bounce" />
          <span className="text-white font-medium">{totalBreaths} power breaths</span>
          <Sparkles className="w-5 h-5 text-tertiary animate-bounce" style={{ animationDelay: '0.5s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white  rounded-2xl border border-line  overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-line ">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent rounded-xl flex items-center justify-center">
            <Wind className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-ink ">Power Breathing</h3>
            <p className="text-sm text-ink-soft ">
              {totalBreaths} snelle ademhalingen om je staat te veranderen
            </p>
          </div>
        </div>
      </div>

      {/* Breathing Circle */}
      <div className="p-8 flex flex-col items-center">
        {/* Animated Circle */}
        <div className="relative mb-6">
          {/* Progress ring */}
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-outline "
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={440}
              strokeDashoffset={440 - (440 * progress) / 100}
              className="transition-all duration-300"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner breathing indicator */}
          <div
            className={`absolute inset-4 rounded-full bg-gradient-to-br ${getPhaseColor()} flex items-center justify-center transition-all duration-500 ${
              phase === 'inhale' ? 'scale-110' : phase === 'exhale' ? 'scale-90' : 'scale-100'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{breathCount}</div>
              <div className="text-xs text-white/80 uppercase tracking-wider">{getPhaseText()}</div>
            </div>
          </div>
        </div>

        {/* Progress text */}
        <p className="text-sm text-ink-soft  mb-6">
          {breathCount} van {totalBreaths} ademhalingen
        </p>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {!isActive ? (
            <button
              onClick={() => setIsActive(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
            >
              <Play size={20} />
              {breathCount > 0 ? 'Doorgaan' : 'Start Priming'}
            </button>
          ) : (
            <button
              onClick={() => setIsActive(false)}
              className="flex items-center gap-2 px-6 py-3 bg-surface-card  text-ink  rounded-xl font-medium hover:bg-surface-sunken  transition-colors"
            >
              <Pause size={20} />
              Pauzeer
            </button>
          )}

          {breathCount > 0 && (
            <button
              onClick={resetTimer}
              className="p-3 bg-surface-card  text-ink-soft  rounded-xl hover:bg-surface-sunken  transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Tony Robbins Quote */}
      <div className="p-4 bg-surface-card  border-t border-line ">
        <p className="text-sm text-ink-soft  italic text-center">
          "If you don't have 10 minutes for your life, you don't have a life."
          <span className="block text-xs text-ink-soft mt-1">— Tony Robbins</span>
        </p>
      </div>
    </div>
  );
}
