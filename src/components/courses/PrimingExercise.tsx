'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Wind, Heart, Eye, Target } from 'lucide-react';

type PrimingPhase = 'intro' | 'breathing' | 'gratitude' | 'visualization' | 'focus' | 'complete';

interface PrimingExerciseProps {
  onComplete?: (data: { duration: number; notes?: string }) => void;
}

export function PrimingExercise({ onComplete }: PrimingExerciseProps) {
  const [phase, setPhase] = useState<PrimingPhase>('intro');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [breathCount, setBreathCount] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [gratitudeItems, setGratitudeItems] = useState(['', '', '']);
  const [visualization, setVisualization] = useState('');
  const [focus, setFocus] = useState('');
  const [startTime] = useState(Date.now());

  const phases = {
    breathing: { duration: 180, title: 'Power Breathing', icon: Wind },
    gratitude: { duration: 180, title: 'Dankbaarheid', icon: Heart },
    visualization: { duration: 180, title: 'Visualisatie', icon: Eye },
    focus: { duration: 60, title: 'Focus', icon: Target },
  };

  // Breathing animation
  useEffect(() => {
    if (phase !== 'breathing' || !isRunning) return;

    const breathCycle = () => {
      setBreathPhase('in');
      setTimeout(() => setBreathPhase('hold'), 2000);
      setTimeout(() => {
        setBreathPhase('out');
        setBreathCount((c) => c + 1);
      }, 3000);
    };

    breathCycle();
    const interval = setInterval(breathCycle, 6000);
    return () => clearInterval(interval);
  }, [phase, isRunning]);

  // Timer
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const startPhase = useCallback((newPhase: PrimingPhase) => {
    if (newPhase === 'intro' || newPhase === 'complete') {
      setPhase(newPhase);
      return;
    }

    setPhase(newPhase);
    setTimeLeft(phases[newPhase].duration);
    setIsRunning(true);

    if (newPhase === 'breathing') {
      setBreathCount(0);
      setBreathPhase('in');
    }
  }, []);

  const nextPhase = useCallback(() => {
    const order: PrimingPhase[] = ['intro', 'breathing', 'gratitude', 'visualization', 'focus', 'complete'];
    const currentIndex = order.indexOf(phase);
    if (currentIndex < order.length - 1) {
      startPhase(order[currentIndex + 1]);
    }
  }, [phase, startPhase]);

  const handleComplete = () => {
    const duration = Math.round((Date.now() - startTime) / 60000);
    onComplete?.({
      duration,
      notes: `Gratitude: ${gratitudeItems.filter(Boolean).join(', ')}. Focus: ${focus}`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Intro Screen
  if (phase === 'intro') {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-8 text-white">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wind className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">10-Minuten Priming</h2>
          <p className="text-white/70 mb-8">
            Begin je dag met energie, dankbaarheid en focus. Deze oefening bestaat uit 4 fasen:
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {Object.entries(phases).map(([key, value]) => {
              const Icon = value.icon;
              return (
                <div key={key} className="bg-white/10 rounded-lg p-4">
                  <Icon className="w-6 h-6 mb-2 mx-auto" />
                  <p className="font-medium">{value.title}</p>
                  <p className="text-sm text-white/60">{value.duration / 60} min</p>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => startPhase('breathing')}
            className="w-full py-4 bg-white text-slate-900 rounded-xl font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
          >
            <Play size={20} />
            Start Priming
          </button>
        </div>
      </div>
    );
  }

  // Complete Screen
  if (phase === 'complete') {
    return (
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-8 text-white">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Priming Voltooid!</h2>
          <p className="text-white/80 mb-8">
            Geweldig gedaan! Je hebt je mind en body geactiveerd voor een krachtige dag.
          </p>
          <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
            <h4 className="font-medium mb-2">Jouw Focus voor Vandaag:</h4>
            <p className="text-white/80">{focus || 'Geen focus ingevuld'}</p>
          </div>
          <button
            onClick={handleComplete}
            className="w-full py-4 bg-white text-emerald-700 rounded-xl font-semibold hover:bg-white/90 transition-colors"
          >
            Afronden
          </button>
        </div>
      </div>
    );
  }

  // Active Phases
  const currentPhaseData = phases[phase as keyof typeof phases];
  const Icon = currentPhaseData.icon;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold">{currentPhaseData.title}</h3>
            <p className="text-sm text-white/60">
              Fase {['breathing', 'gratitude', 'visualization', 'focus'].indexOf(phase) + 1} van 4
            </p>
          </div>
        </div>
        <div className="text-3xl font-mono font-bold">{formatTime(timeLeft)}</div>
      </div>

      {/* Phase Content */}
      {phase === 'breathing' && (
        <div className="text-center py-8">
          <div
            className={`w-40 h-40 mx-auto rounded-full border-4 border-white/30 flex items-center justify-center transition-all duration-1000 ${
              breathPhase === 'in'
                ? 'scale-110 bg-blue-500/30'
                : breathPhase === 'hold'
                ? 'scale-110 bg-blue-500/50'
                : 'scale-100 bg-blue-500/20'
              }`}
          >
            <span className="text-xl font-medium">
              {breathPhase === 'in' ? 'INADEMEN' : breathPhase === 'hold' ? 'VASTHOUDEN' : 'UITADEMEN'}
            </span>
          </div>
          <p className="mt-6 text-white/60">
            Adem diep in door je neus, houd even vast, en adem langzaam uit door je mond.
          </p>
          <p className="mt-2 text-lg font-medium">{breathCount} ademhalingen</p>
        </div>
      )}

      {phase === 'gratitude' && (
        <div className="space-y-4">
          <p className="text-white/70 mb-4">
            Denk aan 3 momenten of dingen waarvoor je dankbaar bent. Voel de dankbaarheid in je lichaam.
          </p>
          {gratitudeItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="w-8 h-8 bg-pink-500/30 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newItems = [...gratitudeItems];
                  newItems[index] = e.target.value;
                  setGratitudeItems(newItems);
                }}
                placeholder={`Ik ben dankbaar voor...`}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          ))}
        </div>
      )}

      {phase === 'visualization' && (
        <div className="space-y-4">
          <p className="text-white/70 mb-4">
            Sluit je ogen en visualiseer je dag. Zie jezelf succesvol, energiek en gefocust.
            Voel de emotie van je successen alsof ze al bereikt zijn.
          </p>
          <textarea
            value={visualization}
            onChange={(e) => setVisualization(e.target.value)}
            placeholder="Beschrijf wat je visualiseert... Hoe voelt het? Wat zie je?"
            rows={4}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>
      )}

      {phase === 'focus' && (
        <div className="space-y-4">
          <p className="text-white/70 mb-4">
            Wat zijn je 3 belangrijkste taken voor vandaag? Wat is je intentie?
          </p>
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Mijn focus voor vandaag is..."
            rows={4}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => startPhase('intro')}
          className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <RotateCcw size={20} />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-4 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} />}
          </button>
        </div>

        <button
          onClick={nextPhase}
          className="px-6 py-3 bg-white text-slate-900 rounded-lg font-medium hover:bg-white/90 transition-colors"
        >
          {timeLeft === 0 ? 'Volgende' : 'Skip'}
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mt-6">
        {['breathing', 'gratitude', 'visualization', 'focus'].map((p) => (
          <div
            key={p}
            className={`flex-1 h-1 rounded-full ${
              ['breathing', 'gratitude', 'visualization', 'focus'].indexOf(p) <
              ['breathing', 'gratitude', 'visualization', 'focus'].indexOf(phase)
                ? 'bg-emerald-500'
                : p === phase
                ? 'bg-white'
                : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
