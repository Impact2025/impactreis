'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Play, Pause, RotateCcw, ArrowLeft, Timer, Coffee, CheckCircle, Clock } from 'lucide-react';
import { AuthService } from '@/lib/auth';

interface FocusSession {
  id: string;
  duration: number;
  completedAt: string;
  type: 'work' | 'break';
}

export default function FocusPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<'work' | 'break'>('work');
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
        // Load sessions from localStorage
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

    const session: FocusSession = {
      id: Date.now().toString(),
      duration: currentSession === 'work' ? 25 : 5,
      completedAt: new Date().toISOString(),
      type: currentSession
    };

    const updatedSessions = [...sessions, session];
    saveSessions(updatedSessions);

    // Auto-switch between work and break
    if (currentSession === 'work') {
      setIsBreak(true);
      setCurrentSession('break');
      setTimeLeft(5 * 60); // 5 minute break
    } else {
      setIsBreak(false);
      setCurrentSession('work');
      setTimeLeft(25 * 60); // 25 minute work session
    }
  };

  const startTimer = () => {
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(currentSession === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchToWork = () => {
    setIsActive(false);
    setIsBreak(false);
    setCurrentSession('work');
    setTimeLeft(25 * 60);
  };

  const switchToBreak = () => {
    setIsActive(false);
    setIsBreak(true);
    setCurrentSession('break');
    setTimeLeft(5 * 60);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
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
              <p className="text-sm text-slate-500">Blijf gefocust met Pomodoro</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-3 gap-4">
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

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          {/* Timer */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-6 border border-slate-200 dark:border-slate-700 text-center">
            <div className="mb-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                currentSession === 'work'
                  ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                  : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              }`}>
                {currentSession === 'work' ? <Timer size={16} /> : <Coffee size={16} />}
                {currentSession === 'work' ? 'Focus Tijd' : 'Pauze'}
              </div>
            </div>

            <div className="text-6xl font-bold text-slate-800 dark:text-white mb-8 font-mono">
              {formatTime(timeLeft)}
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              {!isActive ? (
                <button
                  onClick={startTimer}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
                >
                  <Play size={20} />
                  Start
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <Pause size={20} />
                  Pauzeer
                </button>
              )}

              <button
                onClick={resetTimer}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <RotateCcw size={20} />
                Reset
              </button>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={switchToWork}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentSession === 'work'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Werk (25min)
              </button>
              <button
                onClick={switchToBreak}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentSession === 'break'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Pauze (5min)
              </button>
            </div>
          </div>

          {/* Session Switcher */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={switchToWork}
              className={`p-4 rounded-xl border transition-all ${
                currentSession === 'work'
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md'
              }`}
            >
              <Timer size={24} className={`mb-2 ${currentSession === 'work' ? 'text-orange-600' : 'text-slate-400'}`} />
              <div className="font-semibold text-slate-800 dark:text-white">Focus Sessie</div>
              <div className="text-sm text-slate-500">25 minuten</div>
            </button>

            <button
              onClick={switchToBreak}
              className={`p-4 rounded-xl border transition-all ${
                currentSession === 'break'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md'
              }`}
            >
              <Coffee size={24} className={`mb-2 ${currentSession === 'break' ? 'text-green-600' : 'text-slate-400'}`} />
              <div className="font-semibold text-slate-800 dark:text-white">Korte Pauze</div>
              <div className="text-sm text-slate-500">5 minuten</div>
            </button>
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
                        {session.duration} minuten • {new Date(session.completedAt).toLocaleTimeString('nl-NL', {
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