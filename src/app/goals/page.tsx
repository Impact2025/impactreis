'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Target, Plus, CheckCircle, Circle, ArrowLeft, Calendar,
  Flame, Zap, ChevronDown, ChevronUp, Trash2, X
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { Celebration } from '@/components/robbins/celebration';
import { BottomNav } from '@/components/ui/bottom-nav';

interface Goal {
  id: string;
  title: string;
  description: string;
  why: string;
  painIfNot: string;
  pleasureIfDone: string;
  nextActions: string[];
  completed: boolean;
  createdAt: string;
  deadline?: string;
  progress: number;
  category: 'business' | 'health' | 'relationships' | 'personal';
}

const categoryConfig = {
  business:      { label: 'Business',    bg: '#eff6ff', text: '#1d4ed8' },
  health:        { label: 'Gezondheid',  bg: '#f0fdf4', text: '#16a34a' },
  relationships: { label: 'Relaties',    bg: '#fdf2f8', text: '#be185d' },
  personal:      { label: 'Persoonlijk', bg: '#f5f3ff', text: '#7c3aed' },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '', description: '', why: '', painIfNot: '', pleasureIfDone: '',
    nextActions: [''], deadline: '', category: 'business',
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) { router.push('/auth/login'); return; }
        const savedGoals = localStorage.getItem('goals');
        if (savedGoals) setGoals(JSON.parse(savedGoals));
      } catch { router.push('/auth/login'); }
      finally { setLoading(false); }
    };
    checkAuth();
  }, [router]);

  const saveGoals = (updated: Goal[]) => {
    setGoals(updated);
    localStorage.setItem('goals', JSON.stringify(updated));
  };

  const handleAddGoal = () => {
    if (!newGoal.title?.trim()) return;
    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description || '',
      why: newGoal.why || '',
      painIfNot: newGoal.painIfNot || '',
      pleasureIfDone: newGoal.pleasureIfDone || '',
      nextActions: (newGoal.nextActions || []).filter(a => a.trim()),
      completed: false,
      createdAt: new Date().toISOString(),
      deadline: newGoal.deadline || undefined,
      progress: 0,
      category: (newGoal.category as Goal['category']) || 'business',
    };
    saveGoals([...goals, goal]);
    setNewGoal({ title: '', description: '', why: '', painIfNot: '', pleasureIfDone: '', nextActions: [''], deadline: '', category: 'business' });
    setShowAddForm(false);
  };

  const toggleGoal = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (goal && !goal.completed) {
      setCelebrationMessage(`"${goal.title}" bereikt!`);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    saveGoals(goals.map(g =>
      g.id === id ? { ...g, completed: !g.completed, progress: g.completed ? 0 : 100 } : g
    ));
  };

  const updateProgress = (id: string, progress: number) => {
    saveGoals(goals.map(g =>
      g.id === id ? { ...g, progress: Math.max(0, Math.min(100, progress)) } : g
    ));
  };

  const deleteGoal = (id: string) => saveGoals(goals.filter(g => g.id !== id));

  const updateNextAction = (index: number, value: string) => {
    const actions = [...(newGoal.nextActions || [''])];
    actions[index] = value;
    setNewGoal({ ...newGoal, nextActions: actions });
  };

  const addNextAction = () =>
    setNewGoal({ ...newGoal, nextActions: [...(newGoal.nextActions || []), ''] });

  const completedGoals = goals.filter(g => g.completed).length;
  const totalGoals = goals.length;
  const averageProgress = totalGoals > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals)
    : 0;

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
        type="goal"
        message={celebrationMessage}
        subMessage="Je hebt bewezen dat je je woord houdt!"
        autoCloseDelay={3000}
      />
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
            <h1 className="text-[18px] font-bold text-[#0a0a14] tracking-tight">RPM Doelen</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00cc66] text-[#0a0a14] text-[13px] font-semibold rounded-[10px] active:scale-95 transition-transform"
          >
            <Plus size={15} strokeWidth={2.5} />
            Nieuw
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 py-5">
          <div className="bg-[#f4f4f7] rounded-[14px] p-4 text-center">
            <p className="text-[22px] font-bold text-[#0a0a14]">{totalGoals}</p>
            <p className="text-[11px] text-[#8a8a9a] font-medium mt-0.5">Totaal</p>
          </div>
          <div className="bg-[#f4f4f7] rounded-[14px] p-4 text-center">
            <p className="text-[22px] font-bold text-[#00cc66]">{completedGoals}</p>
            <p className="text-[11px] text-[#8a8a9a] font-medium mt-0.5">Voltooid</p>
          </div>
          <div className="bg-[#f4f4f7] rounded-[14px] p-4 text-center">
            <p className="text-[22px] font-bold text-[#0a0a14]">{averageProgress}%</p>
            <p className="text-[11px] text-[#8a8a9a] font-medium mt-0.5">Gemiddeld</p>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-[16px] border border-[#e8e8ec] p-5 mb-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-[#0a0a14]">Nieuw RPM Doel</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f4f4f7] text-[#8a8a9a]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.15em] mb-2">
                  Result — Wat wil je bereiken?
                </label>
                <input
                  type="text"
                  placeholder="Specifiek, meetbaar doel"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full bg-[#f4f4f7] border border-transparent focus:border-[#00cc66] outline-none rounded-[14px] px-4 py-3.5 text-[14px] text-[#0a0a14] placeholder:text-[#8a8a9a] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.15em] mb-2">
                  Categorie
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(categoryConfig) as [Goal['category'], typeof categoryConfig[keyof typeof categoryConfig]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setNewGoal({ ...newGoal, category: key })}
                      className="py-2.5 px-3 rounded-[12px] text-[13px] font-medium transition-all active:scale-95"
                      style={
                        newGoal.category === key
                          ? { backgroundColor: cfg.bg, color: cfg.text, outline: `1.5px solid ${cfg.text}` }
                          : { backgroundColor: '#f4f4f7', color: '#8a8a9a' }
                      }
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.15em] mb-2">
                  <Flame size={11} className="inline mr-1 text-[#f59e0b]" />
                  Purpose — Waarom moet dit?
                </label>
                <textarea
                  placeholder="Je emotionele brandstof. Waarom is dit echt belangrijk?"
                  value={newGoal.why}
                  onChange={(e) => setNewGoal({ ...newGoal, why: e.target.value })}
                  rows={3}
                  className="w-full bg-[#f4f4f7] border border-transparent focus:border-[#00cc66] outline-none rounded-[14px] px-4 py-3.5 text-[14px] text-[#0a0a14] placeholder:text-[#8a8a9a] resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.15em] mb-2">
                  Pijn — Als je dit NIET bereikt?
                </label>
                <textarea
                  placeholder="Welke pijn, spijt of verlies?"
                  value={newGoal.painIfNot}
                  onChange={(e) => setNewGoal({ ...newGoal, painIfNot: e.target.value })}
                  rows={2}
                  className="w-full bg-[#f4f4f7] border border-transparent focus:border-[#00cc66] outline-none rounded-[14px] px-4 py-3.5 text-[14px] text-[#0a0a14] placeholder:text-[#8a8a9a] resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.15em] mb-2">
                  Plezier — Hoe voelt het als het LUKT?
                </label>
                <textarea
                  placeholder="Visualiseer het succes. Welke emoties?"
                  value={newGoal.pleasureIfDone}
                  onChange={(e) => setNewGoal({ ...newGoal, pleasureIfDone: e.target.value })}
                  rows={2}
                  className="w-full bg-[#f4f4f7] border border-transparent focus:border-[#00cc66] outline-none rounded-[14px] px-4 py-3.5 text-[14px] text-[#0a0a14] placeholder:text-[#8a8a9a] resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.15em] mb-2">
                  <Zap size={11} className="inline mr-1" />
                  Massive Action — Volgende stappen
                </label>
                <div className="space-y-2">
                  {(newGoal.nextActions || ['']).map((action, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-6 h-6 shrink-0 bg-[#f4f4f7] rounded-[6px] text-[11px] font-semibold flex items-center justify-center text-[#8a8a9a]">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={`Actie ${index + 1}`}
                        value={action}
                        onChange={(e) => updateNextAction(index, e.target.value)}
                        className="flex-1 bg-[#f4f4f7] border border-transparent focus:border-[#00cc66] outline-none rounded-[12px] px-4 py-3 text-[14px] text-[#0a0a14] placeholder:text-[#8a8a9a] transition-colors"
                      />
                    </div>
                  ))}
                  <button
                    onClick={addNextAction}
                    className="flex items-center gap-1.5 text-[13px] text-[#00cc66] font-medium mt-1"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Actie toevoegen
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.15em] mb-2">
                  <Calendar size={11} className="inline mr-1" />
                  Deadline
                </label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full bg-[#f4f4f7] border border-transparent focus:border-[#00cc66] outline-none rounded-[14px] px-4 py-3.5 text-[14px] text-[#0a0a14] transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleAddGoal}
                  className="flex-1 py-3.5 bg-[#00cc66] text-[#0a0a14] text-[14px] font-semibold rounded-[14px] active:scale-95 transition-transform"
                >
                  Doel Toevoegen
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-3.5 bg-[#f4f4f7] text-[#0a0a14] text-[14px] font-medium rounded-[14px] active:scale-95 transition-transform"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-3 pb-4">
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-[#f0fdf4] rounded-full flex items-center justify-center mb-4">
                <Target size={28} className="text-[#00cc66]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#0a0a14] mb-2">Geen RPM doelen nog</h3>
              <p className="text-[13px] text-[#8a8a9a] max-w-[220px] leading-relaxed mb-6">
                Maak je eerste doel met het RPM systeem: Result, Purpose, Massive Action
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-5 py-3 bg-[#00cc66] text-[#0a0a14] text-[14px] font-semibold rounded-[14px] active:scale-95 transition-transform"
              >
                <Plus size={16} strokeWidth={2.5} />
                Eerste Doel Maken
              </button>
            </div>
          ) : (
            goals.map((goal) => {
              const cfg = categoryConfig[goal.category];
              const isExpanded = expandedGoal === goal.id;
              return (
                <div
                  key={goal.id}
                  className={`bg-white rounded-[16px] border p-5 transition-all ${
                    goal.completed ? 'border-[#00cc66]/30' : 'border-[#e8e8ec]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className="mt-0.5 shrink-0 active:scale-90 transition-transform"
                    >
                      {goal.completed
                        ? <CheckCircle size={22} className="text-[#00cc66]" />
                        : <Circle size={22} className="text-[#e8e8ec]" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ backgroundColor: cfg.bg, color: cfg.text }}
                        >
                          {cfg.label}
                        </span>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-[#8a8a9a] hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <h3 className={`text-[15px] font-semibold leading-snug ${
                        goal.completed ? 'line-through text-[#8a8a9a]' : 'text-[#0a0a14]'
                      }`}>
                        {goal.title}
                      </h3>

                      {goal.why && (
                        <div className="mt-2.5 bg-[#fef3c7] rounded-[10px] px-3 py-2">
                          <p className="text-[12px] text-[#92400e] leading-relaxed">
                            <Flame size={11} className="inline mr-1 text-[#f59e0b]" />
                            <span className="font-semibold">Waarom:</span> {goal.why}
                          </p>
                        </div>
                      )}

                      {goal.deadline && (
                        <div className="flex items-center gap-1.5 mt-2.5 text-[12px] text-[#8a8a9a]">
                          <Calendar size={12} />
                          Deadline: {new Date(goal.deadline).toLocaleDateString('nl-NL')}
                        </div>
                      )}

                      {!goal.completed && (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[#8a8a9a]">Voortgang</span>
                            <span className="text-[11px] font-semibold text-[#0a0a14]">{goal.progress}%</span>
                          </div>
                          <div className="relative h-2">
                            <div className="w-full h-2 bg-[#f4f4f7] rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-[#00cc66] rounded-full transition-all duration-300"
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                            <input
                              type="range" min="0" max="100" value={goal.progress}
                              onChange={(e) => updateProgress(goal.id, parseInt(e.target.value))}
                              className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                        className="flex items-center gap-1 mt-3 text-[12px] text-[#00cc66] font-medium"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? 'Minder details' : 'Meer details'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#e8e8ec] space-y-3">
                      {goal.painIfNot && (
                        <div className="bg-red-50 rounded-[10px] px-3 py-2.5">
                          <p className="text-[12px] text-red-700 leading-relaxed">
                            <span className="font-semibold">Als ik dit NIET doe:</span> {goal.painIfNot}
                          </p>
                        </div>
                      )}
                      {goal.pleasureIfDone && (
                        <div className="bg-[#f0fdf4] rounded-[10px] px-3 py-2.5">
                          <p className="text-[12px] text-[#15803d] leading-relaxed">
                            <span className="font-semibold">Als dit LUKT:</span> {goal.pleasureIfDone}
                          </p>
                        </div>
                      )}
                      {goal.nextActions && goal.nextActions.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-[#8a8a9a] uppercase tracking-[0.15em] mb-2">
                            <Zap size={11} className="inline mr-1" />
                            Volgende Acties
                          </p>
                          <div className="space-y-1.5">
                            {goal.nextActions.map((action, index) => (
                              <div key={index} className="flex items-center gap-2 text-[13px] text-[#0a0a14]">
                                <span className="w-5 h-5 shrink-0 bg-[#f4f4f7] rounded-[5px] text-[10px] font-semibold flex items-center justify-center text-[#8a8a9a]">
                                  {index + 1}
                                </span>
                                {action}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
