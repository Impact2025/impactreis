'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, Play, Pause, RotateCcw, ArrowLeft, Timer, Coffee,
  CheckCircle, Clock, Zap, HelpCircle, Flame
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { MovementBreakMini } from '@/components/robbins/movement-break';
import { Celebration } from '@/components/robbins/celebration';

interface FocusSession {
  id: string;
  duration: number;
  completedAt: string;
  type: 'work' | 'break';
  energyBefore?: number;
  energyAfter?: number;
}

const powerQuestions = [
  "Hoe kan ik dit proces leuk maken?",
  "Wat is de kleinste eerste stap die ik nu kan zetten?",
  "Wat zou een expert anders doen?",
  "Waar word ik enthousiast van aan dit project?",
  "Hoe kan ik hiermee waarde creëren?",
];

export default function FocusPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<'work' | 'break'>('work');
  const [showMovementBreak, setShowMovementBreak] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPowerQuestion, setShowPowerQuestion] = useState(false);
  const [currentPowerQuestion, setCurrentPowerQuestion] = useState('');
  const [energyBefore, setEnergyBefore] = useState(7);
  const [energyAfter, setEnergyAfter] = useState(7);
  const [sessionGoal, setSessionGoal] = useState('');
  const [showGoalInput, setShowGoalInput] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }
        const savedSessions = localStorage.getItem('focusSessions');
        if (savedSessions) {
          setSessions(JSON.parse(savedSessions));
        }
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const saveSessions = (updatedSessions: FocusSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('focusSessions', JSON.stringify(updatedSessions));
  };

  const handleSessionComplete = () => {
    setIsActive(false);

    if (currentSession === 'work') {
      // Show celebration for work session
      setShowCelebration(true);

      const session: FocusSession = {
        id: Date.now().toString(),
        duration: 25,
        completedAt: new Date().toISOString(),
        type: 'work',
        energyBefore,
        energyAfter
      };

      const updatedSessions = [...sessions, session];
      saveSessions(updatedSessions);

      // After celebration, show movement break
      setTimeout(() => {
        setShowCelebration(false);
        setShowMovementBreak(true);
      }, 3000);
    } else {
      // Break complete, back to work
      setIsBreak(false);
      setCurrentSession('work');
      setTimeLeft(25 * 60);
      setShowGoalInput(true);
    }
  };

  const handleMovementComplete = () => {
    setShowMovementBreak(false);
    setIsBreak(true);
    setCurrentSession('break');
    setTimeLeft(5 * 60);
  };

  const startTimer = () => {
    if (showGoalInput && !sessionGoal.trim()) {
      return; // Require goal
    }
    setShowGoalInput(false);
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(currentSession === 'work' ? 25 * 60 : 5 * 60);
    setShowGoalInput(true);
    setSessionGoal('');
  };

  const switchToWork = () => {
    setIsActive(false);
    setIsBreak(false);
    setCurrentSession('work');
    setTimeLeft(25 * 60);
    setShowGoalInput(true);
  };

  const switchToBreak = () => {
    setIsActive(false);
    setIsBreak(true);
    setCurrentSession('break');
    setTimeLeft(5 * 60);
    setShowGoalInput(false);
  };

  const showRandomPowerQuestion = () => {
    const randomIndex = Math.floor(Math.random() * powerQuestions.length);
    setCurrentPowerQuestion(powerQuestions[randomIndex]);
    setShowPowerQuestion(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const todaySessions = sessions.filter(session => {
    const today = new Date().toDateString();
    return new Date(session.completedAt).toDateString() === today;
  });

  const totalFocusTime = todaySessions
    .filter(session => session.type === 'work')
    .reduce((total, session) => total + session.duration, 0);

  const completedSessions = todaySessions.filter(session => session.type === 'work').length;
  const progress = (1 - timeLeft / (currentSession === 'work' ? 25 * 60 : 5 * 60)) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (showCelebration) {
    return (
      <Celebration
        type="focus"
        message="Focus Sessie Voltooid!"
        subMessage={`${completedSessions + 1} sessies vandaag - ${totalFocusTime + 25} minuten deep work`}
        autoCloseDelay={3000}
      />
    );
  }

  if (showMovementBreak) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white mb-4">
              <Flame className="w-5 h-5 animate-pulse" />
              <span className="font-medium">Bewegings Pauze</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              "Emotion is created by motion"
            </h1>
            <p className="text-white/80">
              Beweeg je lichaam om je energie te resetten voor de volgende sessie
            </p>
          </div>

          <MovementBreakMini onComplete={handleMovementComplete} />

          <p className="text-center text-white/60 text-sm mt-6 italic">
            "Change your physiology, change your state"
            <span className="block text-xs mt-1">— Tony Robbins</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Timer className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Focus Sessies</h1>
              <p className="text-sm text-slate-500">State-first deep work</p>
            </div>
          </div>

          {/* Power Question Button */}
          <button
            onClick={showRandomPowerQuestion}
            className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
            title="Stuck? Get a Power Question"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{completedSessions}</div>
            <div className="text-sm text-slate-500">Sessies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{totalFocusTime}</div>
            <div className="text-sm text-slate-500">Minuten</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{Math.round(totalFocusTime / 25)}</div>
            <div className="text-sm text-slate-500">Pomodoros</div>
          </div>
        </div>
      </div>

      {/* Power Question Modal */}
      {showPowerQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Power Question
            </h3>
            <p className="text-xl text-slate-700 dark:text-slate-300 mb-6 italic">
              "{currentPowerQuestion}"
            </p>
            <button
              onClick={() => setShowPowerQuestion(false)}
              className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium"
            >
              Doorgaan met focus
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          {/* Goal Input */}
          {showGoalInput && currentSession === 'work' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="text-amber-500" size={20} />
                <h3 className="font-semibold text-slate-800 dark:text-white">Wat ga je focussen deze sessie?</h3>
              </div>
              <input
                type="text"
                value={sessionGoal}
                onChange={(e) => setSessionGoal(e.target.value)}
                placeholder="Bijv: Hoofdstuk 3 schrijven, emails beantwoorden..."
                className="w-full p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              {/* Energy Before */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-500">Energie nu</span>
                  <span className="font-medium text-slate-900 dark:text-white">{energyBefore}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyBefore}
                  onChange={(e) => setEnergyBefore(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>
          )}

          {/* Current Goal Display */}
          {!showGoalInput && sessionGoal && currentSession === 'work' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <Zap size={16} />
                <span className="font-medium">Focus: {sessionGoal}</span>
              </div>
            </div>
          )}

          {/* Timer */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-6 border border-slate-200 dark:border-slate-700 text-center">
            {/* Progress Ring */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-200 dark:text-slate-700"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="url(#timerGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={553}
                  strokeDashoffset={553 - (553 * progress) / 100}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={currentSession === 'work' ? '#f97316' : '#22c55e'} />
                    <stop offset="100%" stopColor={currentSession === 'work' ? '#ef4444' : '#10b981'} />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                  currentSession === 'work'
                    ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                    : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                }`}>
                  {currentSession === 'work' ? <Timer size={12} /> : <Coffee size={12} />}
                  {currentSession === 'work' ? 'Focus' : 'Pauze'}
                </div>
                <div className="text-5xl font-bold text-slate-800 dark:text-white font-mono">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {!isActive ? (
                <button
                  onClick={startTimer}
                  disabled={showGoalInput && !sessionGoal.trim() && currentSession === 'work'}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={24} />
                  Start
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex items-center gap-2 px-8 py-4 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <Pause size={24} />
                  Pauzeer
                </button>
              )}

              <button
                onClick={resetTimer}
                className="p-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <RotateCcw size={24} />
              </button>
            </div>

            {/* Session Type Switcher */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={switchToWork}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentSession === 'work'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Focus (25min)
              </button>
              <button
                onClick={switchToBreak}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentSession === 'break'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Pauze (5min)
              </button>
            </div>
          </div>

          {/* Tony Quote */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 italic text-center">
              "Where focus goes, energy flows."
              <span className="block text-xs text-slate-400 mt-1">— Tony Robbins</span>
            </p>
          </div>

          {/* Today's Sessions */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Vandaag Voltooid</h3>
            <div className="space-y-3">
              {todaySessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Clock size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Geen sessies vandaag</p>
                  <p className="text-sm">Start je eerste focus sessie!</p>
                </div>
              ) : (
                todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      session.type === 'work'
                        ? 'bg-orange-100 dark:bg-orange-900/20'
                        : 'bg-green-100 dark:bg-green-900/20'
                    }`}>
                      {session.type === 'work' ? (
                        <Timer size={16} className="text-orange-600 dark:text-orange-400" />
                      ) : (
                        <Coffee size={16} className="text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 dark:text-white">
                        {session.type === 'work' ? 'Focus Sessie' : 'Pauze'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {session.duration} min • {new Date(session.completedAt).toLocaleTimeString('nl-NL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <CheckCircle size={20} className="text-green-500" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
