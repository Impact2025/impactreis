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
import { BottomNav } from '@/components/ui/bottom-nav';

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
        if (!currentUser) { router.push('/auth/login'); return; }
        const savedSessions = localStorage.getItem('focusSessions');
        if (savedSessions) setSessions(JSON.parse(savedSessions));
      } catch { router.push('/auth/login'); }
      finally { setLoading(false); }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, timeLeft]);

  const saveSessions = (updated: FocusSession[]) => {
    setSessions(updated);
    localStorage.setItem('focusSessions', JSON.stringify(updated));
  };

  const handleSessionComplete = () => {
    setIsActive(false);
    if (currentSession === 'work') {
      setShowCelebration(true);
      const session: FocusSession = {
        id: Date.now().toString(),
        duration: 25,
        completedAt: new Date().toISOString(),
        type: 'work',
        energyBefore,
        energyAfter,
      };
      saveSessions([...sessions, session]);
      setTimeout(() => {
        setShowCelebration(false);
        setShowMovementBreak(true);
      }, 3000);
    } else {
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
    if (showGoalInput && !sessionGoal.trim()) return;
    setShowGoalInput(false);
    setIsActive(true);
  };

  const pauseTimer = () => setIsActive(false);

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
    const idx = Math.floor(Math.random() * powerQuestions.length);
    setCurrentPowerQuestion(powerQuestions[idx]);
    setShowPowerQuestion(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const todaySessions = sessions.filter(s =>
    new Date(s.completedAt).toDateString() === new Date().toDateString()
  );
  const workSessions = todaySessions.filter(s => s.type === 'work');
  const totalFocusTime = workSessions.reduce((t, s) => t + s.duration, 0);
  const completedSessions = workSessions.length;
  const totalDuration = currentSession === 'work' ? 25 * 60 : 5 * 60;
  const progress = (1 - timeLeft / totalDuration) * 100;

  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progress) / 100;
  const isWorkMode = currentSession === 'work';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#00cc66] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (showCelebration) {
    return (
      <Celebration
        type="focus"
        message="Focus Sessie Voltooid!"
        subMessage={`${completedSessions + 1} sessies vandaag — ${totalFocusTime + 25} minuten deep work`}
        autoCloseDelay={3000}
      />
    );
  }

  if (showMovementBreak) {
    return (
      <div className="min-h-screen bg-[#f4f4f7] flex items-center justify-center p-6 pb-28">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fef3c7] rounded-full text-[#f59e0b] text-[13px] font-semibold mb-4">
              <Flame className="w-4 h-4" />
              Bewegings Pauze
            </div>
            <h1 className="text-[22px] font-bold text-[#0a0a14] mb-2 leading-tight">
              "Emotion is created by motion"
            </h1>
            <p className="text-[13px] text-[#8a8a9a]">
              Beweeg je lichaam om je energie te resetten
            </p>
          </div>
          <MovementBreakMini onComplete={handleMovementComplete} />
          <p className="text-center text-[12px] text-[#8a8a9a] mt-6 italic">
            "Change your physiology, change your state" — Tony Robbins
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] pb-28">
      {/* Header */}
      <header className="bg-[#ffffff] border-b border-[#e8e8ec] px-5 py-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[#f4f4f7] text-[#0a0a14] active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </Link>
            <h1 className="text-[18px] font-bold text-[#0a0a14] tracking-tight">Focus Sessies</h1>
          </div>
          <button
            onClick={showRandomPowerQuestion}
            className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-[#fef3c7] text-[#f59e0b] active:scale-95 transition-transform"
            title="Power vraag"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      {/* Power Question Modal */}
      {showPowerQuestion && (
        <div className="fixed inset-0 bg-[#0a0a14]/50 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-[20px] p-7 max-w-sm w-full text-center shadow-xl">
            <div className="w-14 h-14 bg-[#fef3c7] rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={26} className="text-[#f59e0b]" />
            </div>
            <p className="text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.15em] mb-3">
              Power Question
            </p>
            <p className="text-[17px] font-semibold text-[#0a0a14] mb-6 leading-snug italic">
              "{currentPowerQuestion}"
            </p>
            <button
              onClick={() => setShowPowerQuestion(false)}
              className="w-full py-3.5 bg-[#0a0a14] text-white text-[14px] font-semibold rounded-[14px] active:scale-95 transition-transform"
            >
              Doorgaan met focus
            </button>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-5">
        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 py-5">
          <div className="bg-[#f4f4f7] rounded-[14px] p-4 text-center">
            <p className="text-[22px] font-bold text-[#0a0a14]">{completedSessions}</p>
            <p className="text-[11px] text-[#8a8a9a] font-medium mt-0.5">Sessies</p>
          </div>
          <div className="bg-[#f4f4f7] rounded-[14px] p-4 text-center">
            <p className="text-[22px] font-bold text-[#0a0a14]">{totalFocusTime}</p>
            <p className="text-[11px] text-[#8a8a9a] font-medium mt-0.5">Minuten</p>
          </div>
          <div className="bg-[#f4f4f7] rounded-[14px] p-4 text-center">
            <p className="text-[22px] font-bold text-[#00cc66]">{Math.round(totalFocusTime / 25)}</p>
            <p className="text-[11px] text-[#8a8a9a] font-medium mt-0.5">Pomodoros</p>
          </div>
        </div>

        {/* Session Goal Input */}
        {showGoalInput && currentSession === 'work' && (
          <div className="bg-white rounded-[16px] border border-[#e8e8ec] p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-[#f59e0b]" />
              <span className="text-[14px] font-semibold text-[#0a0a14]">
                Wat ga je focussen deze sessie?
              </span>
            </div>
            <input
              type="text"
              value={sessionGoal}
              onChange={(e) => setSessionGoal(e.target.value)}
              placeholder="Bijv: Hoofdstuk 3 schrijven, emails beantwoorden..."
              className="w-full bg-[#f4f4f7] border border-transparent focus:border-[#00cc66] outline-none rounded-[14px] px-4 py-3.5 text-[14px] text-[#0a0a14] placeholder:text-[#8a8a9a] transition-colors"
            />
            <div className="mt-4">
              <div className="flex items-center justify-between text-[12px] mb-2">
                <span className="text-[#8a8a9a]">Energie nu</span>
                <span className="font-semibold text-[#0a0a14]">{energyBefore}/10</span>
              </div>
              <input
                type="range" min="1" max="10" value={energyBefore}
                onChange={(e) => setEnergyBefore(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#00cc66' }}
              />
            </div>
          </div>
        )}

        {/* Current goal display */}
        {!showGoalInput && sessionGoal && currentSession === 'work' && (
          <div className="bg-[#fef3c7] rounded-[14px] px-4 py-3 mb-4 flex items-center gap-2">
            <Zap size={15} className="text-[#f59e0b] shrink-0" />
            <span className="text-[13px] font-semibold text-[#92400e]">Focus: {sessionGoal}</span>
          </div>
        )}

        {/* Timer Card */}
        <div className="bg-white rounded-[20px] border border-[#e8e8ec] p-6 mb-4 text-center">
          {/* SVG Timer Ring */}
          <div className="relative w-52 h-52 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="#f4f4f7" strokeWidth="10" />
              <circle
                cx="100" cy="100" r={radius}
                fill="none"
                stroke={isWorkMode ? '#0a0a14' : '#00cc66'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-2 ${
                isWorkMode ? 'bg-[#0a0a14] text-white' : 'bg-[#f0fdf4] text-[#00cc66]'
              }`}>
                {isWorkMode ? <Timer size={11} /> : <Coffee size={11} />}
                {isWorkMode ? 'Focus' : 'Pauze'}
              </div>
              <div className="text-[44px] font-bold text-[#0a0a14] font-mono leading-none">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-5">
            {!isActive ? (
              <button
                onClick={startTimer}
                disabled={showGoalInput && !sessionGoal.trim() && currentSession === 'work'}
                className={`flex items-center gap-2 px-8 py-4 text-[15px] font-semibold rounded-[14px] active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed ${
                  isWorkMode ? 'bg-[#0a0a14] text-white' : 'bg-[#00cc66] text-[#0a0a14]'
                }`}
              >
                <Play size={20} />
                Start
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="flex items-center gap-2 px-8 py-4 bg-[#f4f4f7] text-[#0a0a14] text-[15px] font-semibold rounded-[14px] active:scale-95 transition-transform"
              >
                <Pause size={20} />
                Pauzeer
              </button>
            )}
            <button
              onClick={resetTimer}
              className="w-14 h-14 flex items-center justify-center bg-[#f4f4f7] text-[#8a8a9a] rounded-[14px] active:scale-95 transition-transform"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          {/* Session type switcher */}
          <div className="inline-flex bg-[#f4f4f7] rounded-[12px] p-1 gap-1">
            <button
              onClick={switchToWork}
              className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all ${
                currentSession === 'work' ? 'bg-[#0a0a14] text-white shadow-sm' : 'text-[#8a8a9a]'
              }`}
            >
              Focus (25min)
            </button>
            <button
              onClick={switchToBreak}
              className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all ${
                currentSession === 'break' ? 'bg-[#0a0a14] text-white shadow-sm' : 'text-[#8a8a9a]'
              }`}
            >
              Pauze (5min)
            </button>
          </div>
        </div>

        {/* Today's Sessions */}
        <div className="bg-white rounded-[20px] border border-[#e8e8ec] p-5 mb-4">
          <h3 className="text-[15px] font-semibold text-[#0a0a14] mb-4">Vandaag Voltooid</h3>
          <div className="space-y-2">
            {todaySessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-[#f4f4f7] rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock size={22} className="text-[#8a8a9a]" />
                </div>
                <p className="text-[13px] text-[#8a8a9a]">Geen sessies vandaag</p>
                <p className="text-[12px] text-[#8a8a9a] mt-1">Start je eerste focus sessie!</p>
              </div>
            ) : (
              todaySessions.map((session) => (
                <div key={session.id} className="flex items-center gap-3 p-3 rounded-[12px] bg-[#f4f4f7]">
                  <div className="w-9 h-9 rounded-[10px] bg-white flex items-center justify-center shrink-0">
                    {session.type === 'work'
                      ? <Timer size={16} className="text-[#0a0a14]" />
                      : <Coffee size={16} className="text-[#00cc66]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-[#0a0a14]">
                      {session.type === 'work' ? 'Focus Sessie' : 'Pauze'}
                    </p>
                    <p className="text-[11px] text-[#8a8a9a]">
                      {session.duration} min — {new Date(session.completedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <CheckCircle size={18} className="text-[#00cc66] shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
