'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, Play, Pause, RotateCcw, ArrowLeft, Timer, Coffee,
  CheckCircle, Clock, Zap, HelpCircle, Flame
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
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
  // Standaard 25 min (Pomodoro); overschreven zodra de AIPA-intake een voorkeur oplevert
  // (focusBlockDurationMinutes: 25 | 50 | 90) — zie fetchWorkMinutes hieronder.
  const [workMinutes, setWorkMinutes] = useState(25);
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
  const [goalFromCoach, setGoalFromCoach] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) { router.push('/auth/login'); return; }
        const savedSessions = localStorage.getItem('focusSessions');
        if (savedSessions) setSessions(JSON.parse(savedSessions));

        try {
          const { profile } = await api.onboarding.profile();
          const minutes = profile?.schedule?.focusBlockDurationMinutes;
          if (minutes) {
            setWorkMinutes(minutes);
            setTimeLeft(minutes * 60);
          }
        } catch {
          // geen profiel of onboarding nog niet gedaan — gewoon de standaard 25 min
        }

        // Synergie coach ↔ PA: de #1-prioriteit die vanochtend is gezet (ochtendritueel)
        // wordt het voorgestelde focus-sessiedoel, i.p.v. een leeg invoerveld.
        try {
          const today = new Date().toISOString().split('T')[0];
          const logs = await api.logs.getByTypeAndDate('morning', today);
          const rawData = logs?.[0]?.data;
          const parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
          const intentie = parsedData?.intentie ?? logs?.[0]?.intentie;
          if (intentie && typeof intentie === 'string' && intentie.trim()) {
            setSessionGoal(intentie.trim());
            setGoalFromCoach(true);
          }
        } catch {
          // geen ochtendritueel vandaag — gewoon een leeg invoerveld
        }
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
        duration: workMinutes,
        completedAt: new Date().toISOString(),
        type: 'work',
        energyBefore,
        energyAfter,
      };
      saveSessions([...sessions, session]);

      // Schrijf ook echt naar focus_sessions in de DB (was tot nu toe alleen localStorage),
      // zodat avond/week deze sessie kunnen terugzien. localStorage blijft de instant-UI-cache.
      const today = new Date().toISOString().split('T')[0];
      api.focus.create({
        date: today,
        startTime: new Date(Date.now() - workMinutes * 60 * 1000).toTimeString().slice(0, 8),
        goal: sessionGoal || null,
      }).then((created: any) => {
        if (created?.id) {
          return api.focus.update(created.id, {
            completed: true,
            durationMinutes: workMinutes,
            completedAt: new Date().toISOString(),
            energyBefore,
            energyAfter,
            sessionType: 'work',
          });
        }
      }).catch(() => {
        // Offline of DB-fout: sessie staat al veilig in localStorage, niet blokkerend.
      });

      setTimeout(() => {
        setShowCelebration(false);
        setShowMovementBreak(true);
      }, 3000);
    } else {
      setIsBreak(false);
      setCurrentSession('work');
      setTimeLeft(workMinutes * 60);
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
    setTimeLeft(currentSession === 'work' ? workMinutes * 60 : 5 * 60);
    setShowGoalInput(true);
    setSessionGoal('');
  };

  const switchToWork = () => {
    setIsActive(false);
    setIsBreak(false);
    setCurrentSession('work');
    setTimeLeft(workMinutes * 60);
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
  const totalDuration = currentSession === 'work' ? workMinutes * 60 : 5 * 60;
  const progress = (1 - timeLeft / totalDuration) * 100;

  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progress) / 100;
  const isWorkMode = currentSession === 'work';

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-card flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (showCelebration) {
    return (
      <Celebration
        type="focus"
        message="Focus Sessie Voltooid!"
        subMessage={`${completedSessions + 1} sessies vandaag — ${totalFocusTime + workMinutes} minuten deep work`}
        autoCloseDelay={3000}
      />
    );
  }

  if (showMovementBreak) {
    return (
      <div className="min-h-screen bg-surface-sunken flex items-center justify-center p-6 pb-28">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-tertiary-soft rounded-full text-tertiary text-[13px] font-semibold mb-4">
              <Flame className="w-4 h-4" />
              Bewegings Pauze
            </div>
            <h1 className="text-[22px] font-bold text-ink mb-2 leading-tight">
              "Emotion is created by motion"
            </h1>
            <p className="text-[13px] text-ink-soft">
              Beweeg je lichaam om je energie te resetten
            </p>
          </div>
          <MovementBreakMini onComplete={handleMovementComplete} />
          <p className="text-center text-[12px] text-ink-soft mt-6 italic">
            "Change your physiology, change your state" — Tony Robbins
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-card pb-28">
      {/* Header */}
      <header className="bg-surface-card border-b border-line px-5 py-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-surface-sunken text-ink active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </Link>
            <h1 className="text-[18px] font-bold text-ink tracking-tight">Focus Sessies</h1>
          </div>
          <button
            onClick={showRandomPowerQuestion}
            className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-tertiary-soft text-tertiary active:scale-95 transition-transform"
            title="Power vraag"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      {/* Power Question Modal */}
      {showPowerQuestion && (
        <div className="fixed inset-0 bg-surface-inverse/50 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-[20px] p-7 max-w-sm w-full text-center shadow-xl">
            <div className="w-14 h-14 bg-tertiary-soft rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={26} className="text-tertiary" />
            </div>
            <p className="text-[11px] font-bold text-ink-soft uppercase tracking-[0.15em] mb-3">
              Power Question
            </p>
            <p className="text-[17px] font-semibold text-ink mb-6 leading-snug italic">
              "{currentPowerQuestion}"
            </p>
            <button
              onClick={() => setShowPowerQuestion(false)}
              className="w-full py-3.5 bg-surface-inverse text-white text-[14px] font-semibold rounded-[14px] active:scale-95 transition-transform"
            >
              Doorgaan met focus
            </button>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-5">
        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 py-5">
          <div className="bg-surface-sunken rounded-[14px] p-4 text-center">
            <p className="text-[22px] font-bold text-ink">{completedSessions}</p>
            <p className="text-[11px] text-ink-soft font-medium mt-0.5">Sessies</p>
          </div>
          <div className="bg-surface-sunken rounded-[14px] p-4 text-center">
            <p className="text-[22px] font-bold text-ink">{totalFocusTime}</p>
            <p className="text-[11px] text-ink-soft font-medium mt-0.5">Minuten</p>
          </div>
          <div className="bg-surface-sunken rounded-[14px] p-4 text-center">
            <p className="text-[22px] font-bold text-primary">{Math.round(totalFocusTime / workMinutes)}</p>
            <p className="text-[11px] text-ink-soft font-medium mt-0.5">Pomodoros</p>
          </div>
        </div>

        {/* Session Goal Input */}
        {showGoalInput && currentSession === 'work' && (
          <div className="bg-white rounded-[16px] border border-line p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-tertiary" />
              <span className="text-[14px] font-semibold text-ink">
                Wat ga je focussen deze sessie?
              </span>
            </div>
            {goalFromCoach && (
              <div className="flex items-center gap-1.5 mb-2.5">
                <Brain size={12} className="text-primary" />
                <span className="text-[11px] font-medium text-primary">Voorgesteld vanuit je ochtendritueel</span>
              </div>
            )}
            <input
              type="text"
              value={sessionGoal}
              onChange={(e) => { setSessionGoal(e.target.value); setGoalFromCoach(false); }}
              placeholder="Bijv: Hoofdstuk 3 schrijven, emails beantwoorden..."
              className="w-full bg-surface-sunken border border-transparent focus:border-primary outline-none rounded-[14px] px-4 py-3.5 text-[14px] text-ink placeholder:text-ink-soft transition-colors"
            />
            <div className="mt-4">
              <div className="flex items-center justify-between text-[12px] mb-2">
                <span className="text-ink-soft">Energie nu</span>
                <span className="font-semibold text-ink">{energyBefore}/10</span>
              </div>
              <input
                type="range" min="1" max="10" value={energyBefore}
                onChange={(e) => setEnergyBefore(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#516050' }}
              />
            </div>
          </div>
        )}

        {/* Current goal display */}
        {!showGoalInput && sessionGoal && currentSession === 'work' && (
          <div className="bg-tertiary-soft rounded-[14px] px-4 py-3 mb-4 flex items-center gap-2">
            <Zap size={15} className="text-tertiary shrink-0" />
            <span className="text-[13px] font-semibold text-tertiary">Focus: {sessionGoal}</span>
          </div>
        )}

        {/* Timer Card */}
        <div className="bg-white rounded-[20px] border border-line p-6 mb-4 text-center">
          {/* SVG Timer Ring */}
          <div className="relative w-52 h-52 mx-auto mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="#f4f3f1" strokeWidth="10" />
              <circle
                cx="100" cy="100" r={radius}
                fill="none"
                stroke={isWorkMode ? '#2f312f' : '#516050'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-2 ${
                isWorkMode ? 'bg-surface-inverse text-white' : 'bg-primary-muted text-primary'
              }`}>
                {isWorkMode ? <Timer size={11} /> : <Coffee size={11} />}
                {isWorkMode ? 'Focus' : 'Pauze'}
              </div>
              <div className="text-[44px] font-bold text-ink font-mono leading-none">
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
                  isWorkMode ? 'bg-surface-inverse text-white' : 'bg-primary text-white'
                }`}
              >
                <Play size={20} />
                Start
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="flex items-center gap-2 px-8 py-4 bg-surface-sunken text-ink text-[15px] font-semibold rounded-[14px] active:scale-95 transition-transform"
              >
                <Pause size={20} />
                Pauzeer
              </button>
            )}
            <button
              onClick={resetTimer}
              className="w-14 h-14 flex items-center justify-center bg-surface-sunken text-ink-soft rounded-[14px] active:scale-95 transition-transform"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          {/* Session type switcher */}
          <div className="inline-flex bg-surface-sunken rounded-[12px] p-1 gap-1">
            <button
              onClick={switchToWork}
              className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all ${
                currentSession === 'work' ? 'bg-surface-inverse text-white shadow-sm' : 'text-ink-soft'
              }`}
            >
              Focus ({workMinutes}min)
            </button>
            <button
              onClick={switchToBreak}
              className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all ${
                currentSession === 'break' ? 'bg-surface-inverse text-white shadow-sm' : 'text-ink-soft'
              }`}
            >
              Pauze (5min)
            </button>
          </div>
        </div>

        {/* Today's Sessions */}
        <div className="bg-white rounded-[20px] border border-line p-5 mb-4">
          <h3 className="text-[15px] font-semibold text-ink mb-4">Vandaag Voltooid</h3>
          <div className="space-y-2">
            {todaySessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-surface-sunken rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock size={22} className="text-ink-soft" />
                </div>
                <p className="text-[13px] text-ink-soft">Geen sessies vandaag</p>
                <p className="text-[12px] text-ink-soft mt-1">Start je eerste focus sessie!</p>
              </div>
            ) : (
              todaySessions.map((session) => (
                <div key={session.id} className="flex items-center gap-3 p-3 rounded-[12px] bg-surface-sunken">
                  <div className="w-9 h-9 rounded-[10px] bg-white flex items-center justify-center shrink-0">
                    {session.type === 'work'
                      ? <Timer size={16} className="text-ink" />
                      : <Coffee size={16} className="text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-ink">
                      {session.type === 'work' ? 'Focus Sessie' : 'Pauze'}
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      {session.duration} min — {new Date(session.completedAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <CheckCircle size={18} className="text-primary shrink-0" />
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
