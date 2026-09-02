'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Target, Plus, CheckCircle, Circle, ArrowLeft, Calendar,
  Flame, Zap, ChevronDown, ChevronUp, Trash2, X, Mountain
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { getCurrentQuarter } from '@/lib/weekflow.service';
import type { GoalAction } from '@/lib/goal-actions';
import { Celebration } from '@/components/robbins/celebration';
import { BottomNav } from '@/components/ui/bottom-nav';

const MAX_ACTIVE_ROCKS = 7;

interface Goal {
  id: string;
  title: string;
  description: string;
  why: string;
  painIfNot: string;
  pleasureIfDone: string;
  nextActions: GoalAction[];
  completed: boolean;
  createdAt: string;
  deadline?: string;
  progress: number;
  category: 'business' | 'health' | 'relationships' | 'personal';
  isRock?: boolean;
  quarter?: string | null;
}

const categoryConfig = {
  business:      { label: 'Business',    bg: '#d4e1ef', text: '#53606c' },
  health:        { label: 'Gezondheid',  bg: '#f7fff2', text: '#516050' },
  relationships: { label: 'Relaties',    bg: '#ffdbd1', text: '#884b3b' },
  personal:      { label: 'Persoonlijk', bg: '#e9e8e5', text: '#444842' },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [rockLimitMessage, setRockLimitMessage] = useState<string | null>(null);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  // Het formulier werkt met kale strings voor nieuwe acties (eenvoudige UX bij het aanmaken) —
  // de server zet dit om naar de GoalAction-vorm (completed/leverage) via normalizeNextActions().
  const [newGoal, setNewGoal] = useState<Omit<Partial<Goal>, 'nextActions'> & { nextActions: string[] }>({
    title: '', description: '', why: '', painIfNot: '', pleasureIfDone: '',
    nextActions: [''], deadline: '', category: 'business',
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!AuthService.getUser()) { router.push('/auth/login'); return; }
        const savedGoals = await api.goals.getAll();
        setGoals(savedGoals as Goal[]);
      } catch { /* geen doelen of offline — laat de lege staat zien */ }
      finally { setLoading(false); }
    };
    checkAuth();
  }, [router]);

  const handleAddGoal = async () => {
    if (!newGoal.title?.trim()) return;
    const created = await api.goals.create({
      title: newGoal.title,
      description: newGoal.description || '',
      why: newGoal.why || '',
      painIfNot: newGoal.painIfNot || '',
      pleasureIfDone: newGoal.pleasureIfDone || '',
      nextActions: (newGoal.nextActions || []).filter(a => a.trim()),
      deadline: newGoal.deadline || undefined,
      category: newGoal.category || 'business',
    });
    setGoals(prev => [...prev, created as Goal]);
    setNewGoal({ title: '', description: '', why: '', painIfNot: '', pleasureIfDone: '', nextActions: [''], deadline: '', category: 'business' });
    setShowAddForm(false);
  };

  const toggleGoal = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    if (!goal.completed) {
      setCelebrationMessage(`"${goal.title}" bereikt!`);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    const updated = await api.goals.update(id, { completed: !goal.completed, progress: goal.completed ? 0 : 100 });
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updated } : g));
  };

  const updateProgress = async (id: string, progress: number) => {
    const clamped = Math.max(0, Math.min(100, progress));
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress: clamped } : g));
    await api.goals.update(id, { progress: clamped });
  };

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    await api.goals.delete(id);
  };

  const currentQuarter = getCurrentQuarter();
  const activeRocks = goals.filter(g => g.isRock && g.quarter === currentQuarter && !g.completed);

  const toggleRock = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    if (!goal.isRock && activeRocks.length >= MAX_ACTIVE_ROCKS) {
      setRockLimitMessage(`Je hebt al ${MAX_ACTIVE_ROCKS} Rocks dit kwartaal — rond je een minder belangrijke af of laat er eerst een los.`);
      setTimeout(() => setRockLimitMessage(null), 4000);
      return;
    }
    const updated = await api.goals.update(id, { isRock: !goal.isRock, quarter: currentQuarter });
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updated } : g));
  };

  // 80/20: een actie markeren als hefboom betekent "dit is een van de weinige die er echt toe
  // doen" — geen volledige Eisenhower-matrix, gewoon een aan/uit-vlag per actie.
  const updateAction = async (goalId: string, actionId: string, changes: Partial<GoalAction>) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const nextActions = goal.nextActions.map(a => a.id === actionId ? { ...a, ...changes } : a);
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, nextActions } : g));
    await api.goals.update(goalId, { nextActions });
  };

  const toggleActionCompleted = (goalId: string, action: GoalAction) =>
    updateAction(goalId, action.id, { completed: !action.completed });

  const toggleActionLeverage = (goalId: string, action: GoalAction) =>
    updateAction(goalId, action.id, { leverage: !action.leverage });

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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
    <div className="min-h-screen bg-surface pb-28">
      {/* Header */}
      <header className="bg-surface border-b border-line px-5 py-4 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-surface-sunken text-ink active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </Link>
            <h1 className="text-[18px] font-bold text-ink tracking-tight">RPM Doelen</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-[10px] active:scale-95 transition-transform"
          >
            <Plus size={15} strokeWidth={2.5} />
            Nieuw
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 py-5">
          <div className="bg-surface-sunken rounded-[14px] p-4 text-center">
            <p className="text-[22px] font-bold text-ink">{totalGoals}</p>
            <p className="text-[11px] text-ink-soft font-medium mt-0.5">Totaal</p>
          </div>
          <div className="bg-surface-sunken rounded-[14px] p-4 text-center">
            <p className="text-[22px] font-bold text-primary">{completedGoals}</p>
            <p className="text-[11px] text-ink-soft font-medium mt-0.5">Voltooid</p>
          </div>
          <div className="bg-surface-sunken rounded-[14px] p-4 text-center">
            <p className="text-[22px] font-bold text-ink">{averageProgress}%</p>
            <p className="text-[11px] text-ink-soft font-medium mt-0.5">Gemiddeld</p>
          </div>
        </div>

        {/* Rocks dit kwartaal */}
        {activeRocks.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Mountain size={15} className="text-tertiary" />
              <h2 className="text-[13px] font-bold text-ink uppercase tracking-wide">
                Rocks — {currentQuarter} ({activeRocks.length}/{MAX_ACTIVE_ROCKS})
              </h2>
            </div>
            <div className="space-y-2.5">
              {activeRocks.map((rock) => (
                <div key={rock.id} className="bg-tertiary-soft rounded-[14px] p-4 border border-tertiary/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[14px] font-semibold text-ink flex-1 pr-3">{rock.title}</p>
                    <span className="text-[13px] font-bold text-tertiary tabular-nums shrink-0">{rock.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary rounded-full transition-all duration-300" style={{ width: `${Math.max(2, rock.progress)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {rockLimitMessage && (
          <div className="rounded-[14px] bg-red-50 border border-red-100 px-4 py-3 mb-5">
            <p className="text-[12px] text-red-600">{rockLimitMessage}</p>
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-surface-card rounded-card border border-line p-5 mb-5 shadow-organic">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-ink">Nieuw RPM Doel</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-sunken text-ink-soft"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-[0.15em] mb-2">
                  Result — Wat wil je bereiken?
                </label>
                <input
                  type="text"
                  placeholder="Specifiek, meetbaar doel"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full bg-surface-sunken border border-transparent focus:border-primary outline-none rounded-[14px] px-4 py-3.5 text-[14px] text-ink placeholder:text-ink-soft transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-[0.15em] mb-2">
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
                          : { backgroundColor: '#f4f3f1', color: '#444842' }
                      }
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-[0.15em] mb-2">
                  <Flame size={11} className="inline mr-1 text-tertiary" />
                  Purpose — Waarom moet dit?
                </label>
                <textarea
                  placeholder="Je emotionele brandstof. Waarom is dit echt belangrijk?"
                  value={newGoal.why}
                  onChange={(e) => setNewGoal({ ...newGoal, why: e.target.value })}
                  rows={3}
                  className="w-full bg-surface-sunken border border-transparent focus:border-primary outline-none rounded-[14px] px-4 py-3.5 text-[14px] text-ink placeholder:text-ink-soft resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-[0.15em] mb-2">
                  Pijn — Als je dit NIET bereikt?
                </label>
                <textarea
                  placeholder="Welke pijn, spijt of verlies?"
                  value={newGoal.painIfNot}
                  onChange={(e) => setNewGoal({ ...newGoal, painIfNot: e.target.value })}
                  rows={2}
                  className="w-full bg-surface-sunken border border-transparent focus:border-primary outline-none rounded-[14px] px-4 py-3.5 text-[14px] text-ink placeholder:text-ink-soft resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-[0.15em] mb-2">
                  Plezier — Hoe voelt het als het LUKT?
                </label>
                <textarea
                  placeholder="Visualiseer het succes. Welke emoties?"
                  value={newGoal.pleasureIfDone}
                  onChange={(e) => setNewGoal({ ...newGoal, pleasureIfDone: e.target.value })}
                  rows={2}
                  className="w-full bg-surface-sunken border border-transparent focus:border-primary outline-none rounded-[14px] px-4 py-3.5 text-[14px] text-ink placeholder:text-ink-soft resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-[0.15em] mb-2">
                  <Zap size={11} className="inline mr-1" />
                  Massive Action — Volgende stappen
                </label>
                <div className="space-y-2">
                  {(newGoal.nextActions || ['']).map((action, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-6 h-6 shrink-0 bg-surface-sunken rounded-[6px] text-[11px] font-semibold flex items-center justify-center text-ink-soft">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={`Actie ${index + 1}`}
                        value={action}
                        onChange={(e) => updateNextAction(index, e.target.value)}
                        className="flex-1 bg-surface-sunken border border-transparent focus:border-primary outline-none rounded-[12px] px-4 py-3 text-[14px] text-ink placeholder:text-ink-soft transition-colors"
                      />
                    </div>
                  ))}
                  <button
                    onClick={addNextAction}
                    className="flex items-center gap-1.5 text-[13px] text-primary font-medium mt-1"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Actie toevoegen
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-[0.15em] mb-2">
                  <Calendar size={11} className="inline mr-1" />
                  Deadline
                </label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full bg-surface-sunken border border-transparent focus:border-primary outline-none rounded-[14px] px-4 py-3.5 text-[14px] text-ink transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleAddGoal}
                  className="flex-1 py-3.5 bg-primary text-white text-[14px] font-semibold rounded-[14px] active:scale-95 transition-transform"
                >
                  Doel Toevoegen
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-3.5 bg-surface-sunken text-ink text-[14px] font-medium rounded-[14px] active:scale-95 transition-transform"
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
              <div className="w-16 h-16 bg-primary-muted rounded-full flex items-center justify-center mb-4">
                <Target size={28} className="text-primary" />
              </div>
              <h3 className="text-[16px] font-semibold text-ink mb-2">Geen RPM doelen nog</h3>
              <p className="text-[13px] text-ink-soft max-w-[220px] leading-relaxed mb-6">
                Maak je eerste doel met het RPM systeem: Result, Purpose, Massive Action
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-5 py-3 bg-primary text-white text-[14px] font-semibold rounded-[14px] active:scale-95 transition-transform"
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
                    goal.completed ? 'border-primary/30' : 'border-line'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className="mt-0.5 shrink-0 active:scale-90 transition-transform"
                    >
                      {goal.completed
                        ? <CheckCircle size={22} className="text-primary" />
                        : <Circle size={22} className="text-line" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ backgroundColor: cfg.bg, color: cfg.text }}
                        >
                          {cfg.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleRock(goal.id)}
                            title={goal.isRock ? 'Rock verwijderen' : 'Markeer als Rock'}
                            className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                              goal.isRock ? 'text-tertiary bg-tertiary-soft' : 'text-ink-soft hover:text-tertiary'
                            }`}
                          >
                            <Mountain size={14} />
                          </button>
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-full text-ink-soft hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h3 className={`text-[15px] font-semibold leading-snug ${
                        goal.completed ? 'line-through text-ink-soft' : 'text-ink'
                      }`}>
                        {goal.title}
                      </h3>

                      {goal.why && (
                        <div className="mt-2.5 bg-tertiary-soft rounded-[10px] px-3 py-2">
                          <p className="text-[12px] text-tertiary leading-relaxed">
                            <Flame size={11} className="inline mr-1 text-tertiary" />
                            <span className="font-semibold">Waarom:</span> {goal.why}
                          </p>
                        </div>
                      )}

                      {goal.deadline && (
                        <div className="flex items-center gap-1.5 mt-2.5 text-[12px] text-ink-soft">
                          <Calendar size={12} />
                          Deadline: {new Date(goal.deadline).toLocaleDateString('nl-NL')}
                        </div>
                      )}

                      {!goal.completed && (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-ink-soft">Voortgang</span>
                            <span className="text-[11px] font-semibold text-ink">{goal.progress}%</span>
                          </div>
                          <div className="relative h-2">
                            <div className="w-full h-2 bg-surface-sunken rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-primary rounded-full transition-all duration-300"
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
                        className="flex items-center gap-1 mt-3 text-[12px] text-primary font-medium"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? 'Minder details' : 'Meer details'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-line space-y-3">
                      {goal.painIfNot && (
                        <div className="bg-red-50 rounded-[10px] px-3 py-2.5">
                          <p className="text-[12px] text-red-700 leading-relaxed">
                            <span className="font-semibold">Als ik dit NIET doe:</span> {goal.painIfNot}
                          </p>
                        </div>
                      )}
                      {goal.pleasureIfDone && (
                        <div className="bg-primary-muted rounded-[10px] px-3 py-2.5">
                          <p className="text-[12px] text-primary-dark leading-relaxed">
                            <span className="font-semibold">Als dit LUKT:</span> {goal.pleasureIfDone}
                          </p>
                        </div>
                      )}
                      {goal.nextActions && goal.nextActions.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-ink-soft uppercase tracking-[0.15em] mb-2">
                            <Zap size={11} className="inline mr-1" />
                            Volgende Acties
                          </p>
                          <div className="space-y-1.5">
                            {goal.nextActions.map((action) => (
                              <div key={action.id} className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleActionCompleted(goal.id, action)}
                                  className="shrink-0 active:scale-90 transition-transform"
                                >
                                  {action.completed
                                    ? <CheckCircle size={17} className="text-primary" />
                                    : <Circle size={17} className="text-line" />}
                                </button>
                                <span className={`flex-1 text-[13px] ${action.completed ? 'line-through text-ink-soft' : 'text-ink'}`}>
                                  {action.text}
                                </span>
                                <button
                                  onClick={() => toggleActionLeverage(goal.id, action)}
                                  title={action.leverage ? 'Hefboom verwijderen' : 'Markeer als hefboom (80/20)'}
                                  className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-full transition-colors ${
                                    action.leverage ? 'text-tertiary bg-tertiary-soft' : 'text-line hover:text-tertiary'
                                  }`}
                                >
                                  <Flame size={12} />
                                </button>
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
