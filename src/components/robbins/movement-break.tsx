'use client';

import { useState, useEffect } from 'react';
import { Flame, Dumbbell, Wind, Zap, Check, Play, SkipForward } from 'lucide-react';

interface MovementBreakProps {
  onComplete: () => void;
  onSkip?: () => void;
  duration?: number; // in seconds
}

const movements = [
  {
    id: 'jumping-jacks',
    name: '10 Jumping Jacks',
    icon: Flame,
    description: 'Spring op en spreid armen en benen wijd',
    duration: 20,
    color: 'from-orange-500 to-red-600',
  },
  {
    id: 'power-pose',
    name: 'Power Pose',
    icon: Zap,
    description: 'Sta breed, armen omhoog als een winnaar (30 sec)',
    duration: 30,
    color: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'deep-breaths',
    name: '5 Diepe Ademhalingen',
    icon: Wind,
    description: 'In door de neus, uit door de mond',
    duration: 25,
    color: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'stretching',
    name: 'Quick Stretch',
    icon: Dumbbell,
    description: 'Rek je armen, nek en rug uit',
    duration: 20,
    color: 'from-emerald-500 to-green-600',
  },
];

export function MovementBreak({ onComplete, onSkip, duration = 300 }: MovementBreakProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [completedMovements, setCompletedMovements] = useState<Set<string>>(new Set());
  const [currentMovement, setCurrentMovement] = useState<string | null>(null);
  const [movementTimer, setMovementTimer] = useState(0);

  // Main break timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  // Movement timer
  useEffect(() => {
    if (!currentMovement || movementTimer <= 0) return;

    const timer = setInterval(() => {
      setMovementTimer(prev => {
        if (prev <= 1) {
          setCompletedMovements(set => new Set([...set, currentMovement]));
          setCurrentMovement(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentMovement, movementTimer]);

  const startMovement = (movement: typeof movements[0]) => {
    setCurrentMovement(movement.id);
    setMovementTimer(movement.duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const allComplete = completedMovements.size >= 2; // Need at least 2 movements

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white mb-4">
            <Flame className="w-5 h-5 animate-pulse" />
            <span className="font-medium">Bewegings Pauze</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            "Emotion is created by motion"
          </h1>
          <p className="text-white/80">
            Beweeg je lichaam om je energie te resetten
          </p>
        </div>

        {/* Timer */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-white font-mono">
            {formatTime(timeLeft)}
          </div>
          <p className="text-white/60 text-sm mt-1">resterende pauze tijd</p>
        </div>

        {/* Current Movement */}
        {currentMovement && (
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6 text-center animate-pulse">
            <div className="text-4xl font-bold text-white mb-2">{movementTimer}</div>
            <p className="text-white font-medium">
              {movements.find(m => m.id === currentMovement)?.name}
            </p>
            <p className="text-white/70 text-sm mt-1">
              {movements.find(m => m.id === currentMovement)?.description}
            </p>
          </div>
        )}

        {/* Movement Options */}
        {!currentMovement && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {movements.map((movement) => {
              const Icon = movement.icon;
              const isCompleted = completedMovements.has(movement.id);

              return (
                <button
                  key={movement.id}
                  onClick={() => !isCompleted && startMovement(movement)}
                  disabled={isCompleted}
                  className={`p-4 rounded-2xl text-left transition-all ${
                    isCompleted
                      ? 'bg-white/30 opacity-70'
                      : 'bg-white/20 hover:bg-white/30 active:scale-95'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isCompleted ? (
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 bg-gradient-to-br ${movement.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <span className="font-medium text-white text-sm">
                      {movement.name}
                    </span>
                  </div>
                  {!isCompleted && (
                    <p className="text-white/70 text-xs line-clamp-2">
                      {movement.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-6">
          {movements.map((m) => (
            <div
              key={m.id}
              className={`w-3 h-3 rounded-full ${
                completedMovements.has(m.id)
                  ? 'bg-emerald-400'
                  : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {allComplete && (
            <button
              onClick={onComplete}
              className="flex-1 py-4 bg-white text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
            >
              <Zap size={20} />
              Terug naar Focus
            </button>
          )}
          {onSkip && (
            <button
              onClick={onSkip}
              className="py-4 px-6 bg-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/30 transition-colors"
            >
              <SkipForward size={18} />
              Skip
            </button>
          )}
        </div>

        {/* Tony Quote */}
        <p className="text-center text-white/60 text-sm mt-6 italic">
          "Change your physiology, change your state"
          <span className="block text-xs mt-1">— Tony Robbins</span>
        </p>
      </div>
    </div>
  );
}

// Mini version for embedding in focus page
export function MovementBreakMini({ onComplete }: { onComplete: () => void }) {
  const [selectedMovements, setSelectedMovements] = useState<Set<string>>(new Set());

  const toggleMovement = (id: string) => {
    const newSet = new Set(selectedMovements);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedMovements(newSet);
  };

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold">Bewegings Pauze</h3>
          <p className="text-sm text-white/70">Kies minimaal 2 bewegingen</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {movements.slice(0, 3).map((movement) => {
          const Icon = movement.icon;
          const isSelected = selectedMovements.has(movement.id);

          return (
            <button
              key={movement.id}
              onClick={() => toggleMovement(movement.id)}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                isSelected
                  ? 'bg-white text-red-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                isSelected ? 'bg-red-100' : 'bg-white/20'
              }`}>
                {isSelected ? <Check size={14} /> : <Icon size={14} />}
              </div>
              <span className="font-medium text-sm">{movement.name}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={onComplete}
        disabled={selectedMovements.size < 2}
        className="w-full py-3 bg-white text-red-600 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Klaar met bewegen
      </button>
    </div>
  );
}
