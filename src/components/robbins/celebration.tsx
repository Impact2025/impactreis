'use client';

import { useState, useEffect } from 'react';
import { Trophy, Sparkles, Star, Zap, Heart, Crown } from 'lucide-react';

interface CelebrationProps {
  type: 'habit' | 'goal' | 'ritual' | 'focus' | 'win' | 'streak';
  message?: string;
  subMessage?: string;
  onComplete?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const celebrationConfig = {
  habit: {
    icon: Zap,
    background: 'bg-primary',
    title: 'Habit Voltooid!',
    defaultMessage: 'Je bouwt momentum op',
    particles: ['bg-white/70', 'bg-primary-light', 'bg-white/40'],
  },
  goal: {
    icon: Trophy,
    background: 'bg-tertiary',
    title: 'Doel Bereikt!',
    defaultMessage: 'Je hebt het gehaald',
    particles: ['bg-white/70', 'bg-tertiary-soft', 'bg-white/40'],
  },
  ritual: {
    icon: Sparkles,
    background: 'bg-accent',
    title: 'Ritueel Voltooid!',
    defaultMessage: 'Je dag is geprimed voor succes',
    particles: ['bg-white/70', 'bg-accent-soft', 'bg-white/40'],
  },
  focus: {
    icon: Star,
    background: 'bg-accent',
    title: 'Focus Sessie Voltooid!',
    defaultMessage: 'Deep work gedaan',
    particles: ['bg-white/70', 'bg-accent-soft', 'bg-white/40'],
  },
  win: {
    icon: Crown,
    background: 'bg-tertiary',
    title: 'Nieuwe Win!',
    defaultMessage: 'Gevierd en opgeslagen',
    particles: ['bg-white/70', 'bg-tertiary-soft', 'bg-white/40'],
  },
  streak: {
    icon: Heart,
    background: 'bg-primary',
    title: 'Streak Verlengd!',
    defaultMessage: 'Consistentie is key',
    particles: ['bg-white/70', 'bg-primary-light', 'bg-white/40'],
  },
};

export function Celebration({
  type,
  message,
  subMessage,
  onComplete,
  autoClose = true,
  autoCloseDelay = 3000,
}: CelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  const config = celebrationConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);

    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onComplete?.(), 300);
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${config.background} overflow-hidden transition-opacity duration-300`}>
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute w-3 h-3 ${config.particles[particle.id % 3]} rounded-full animate-ping`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${1 + Math.random()}s`,
          }}
        />
      ))}

      {/* Main content */}
      <div className="text-center animate-bounce relative z-10">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
            <Icon className="w-12 h-12 text-white" />
          </div>
          <Sparkles
            className="absolute -top-2 -right-2 w-8 h-8 text-white animate-pulse"
          />
          <Sparkles
            className="absolute -bottom-2 -left-2 w-6 h-6 text-white animate-pulse"
            style={{ animationDelay: '0.5s' }}
          />
        </div>

        {/* Text */}
        <h2 className="text-4xl font-bold text-white mb-2">
          {config.title}
        </h2>
        <p className="text-xl text-white/90 mb-2">
          {message || config.defaultMessage}
        </p>
        {subMessage && (
          <p className="text-white/70">
            {subMessage}
          </p>
        )}

        {/* Celebration text */}
        <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full">
          <span className="text-2xl">🎉</span>
          <span className="text-white font-medium">Gefeliciteerd!</span>
          <span className="text-2xl">🎉</span>
        </div>
      </div>

      {/* Close hint */}
      {!autoClose && (
        <button
          onClick={() => {
            setIsVisible(false);
            onComplete?.();
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm hover:text-white"
        >
          Klik om door te gaan
        </button>
      )}
    </div>
  );
}

// Mini celebration for inline use
export function CelebrationBurst({ show, onComplete }: { show: boolean; onComplete?: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="animate-ping">
        <Sparkles className="w-16 h-16 text-tertiary" />
      </div>
    </div>
  );
}

// Confetti effect
export function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    color: string;
    delay: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    if (active) {
      const colors = ['#516050', '#884b3b', '#53606c', '#a56351', '#bbcbb8', '#ffffff'];
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 2,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-sm animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: '-10px',
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
