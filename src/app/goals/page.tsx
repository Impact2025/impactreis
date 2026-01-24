'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Target, Plus, CheckCircle, Circle, ArrowLeft, Calendar,
  Flame, Heart, Zap, ChevronDown, ChevronUp, Trash2, Edit2, X
} from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { Celebration } from '@/components/robbins/celebration';

interface Goal {
  id: string;
  title: string;
  description: string;
  // RPM System fields
  why: string; // Purpose - emotional fuel
  painIfNot: string; // What it costs if NOT achieved
  pleasureIfDone: string; // How it feels when achieved
  nextActions: string[]; // Massive Action Plan
  completed: boolean;
  createdAt: string;
  deadline?: string;
  progress: number;
  category: 'business' | 'health' | 'relationships' | 'personal';
}

const categoryConfig = {
  business: { label: 'Business', color: 'from-blue-500 to-indigo-600', icon: Target },
  health: { label: 'Gezondheid', color: 'from-emerald-500 to-green-600', icon: Heart },
  relationships: { label: 'Relaties', color: 'from-pink-500 to-rose-600', icon: Heart },
  personal: { label: 'Persoonlijk', color: 'from-purple-500 to-violet-600', icon: Zap },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    why: '',
    painIfNot: '',
    pleasureIfDone: '',
    nextActions: [''],
    deadline: '',
    category: 'business'
  });
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }
        const savedGoals = localStorage.getItem('goals');
        if (savedGoals) {
          setGoals(JSON.parse(savedGoals));
        }
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const saveGoals = (updatedGoals: Goal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem('goals', JSON.stringify(updatedGoals));
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
      category: newGoal.category as Goal['category'] || 'business'
    };

    const updatedGoals = [...goals, goal];
    saveGoals(updatedGoals);

    setNewGoal({
      title: '',
      description: '',
      why: '',
      painIfNot: '',
      pleasureIfDone: '',
      nextActions: [''],
      deadline: '',
      category: 'business'
    });
    setShowAddForm(false);
  };

  const toggleGoal = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (goal && !goal.completed) {
      setCelebrationMessage(`"${goal.title}" bereikt!`);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }

    const updatedGoals = goals.map(g =>
      g.id === id
        ? { ...g, completed: !g.completed, progress: g.completed ? 0 : 100 }
        : g
    );
    saveGoals(updatedGoals);
  };

  const updateProgress = (id: string, progress: number) => {
    const updatedGoals = goals.map(g =>
      g.id === id ? { ...g, progress: Math.max(0, Math.min(100, progress)) } : g
    );
    saveGoals(updatedGoals);
  };

  const deleteGoal = (id: string) => {
    const updatedGoals = goals.filter(g => g.id !== id);
    saveGoals(updatedGoals);
  };

  const updateNextAction = (index: number, value: string) => {
    const actions = [...(newGoal.nextActions || [''])];
    actions[index] = value;
    setNewGoal({ ...newGoal, nextActions: actions });
  };

  const addNextAction = () => {
    setNewGoal({ ...newGoal, nextActions: [...(newGoal.nextActions || []), ''] });
  };

  const completedGoals = goals.filter(g => g.completed).length;
  const totalGoals = goals.length;
  const averageProgress = totalGoals > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / totalGoals)
    : 0;

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
        type="goal"
        message={celebrationMessage}
        subMessage="Je hebt bewezen dat je je woord houdt!"
        autoCloseDelay={3000}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center">
              <Target className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">RPM Doelen</h1>
              <p className="text-sm text-slate-500">Result • Purpose • Massive Action</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg font-medium hover:shadow-lg transition-all active:scale-95"
          >
            <Plus size={16} />
            Nieuw Doel
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalGoals}</div>
            <div className="text-sm text-slate-500">Totaal</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedGoals}</div>
            <div className="text-sm text-slate-500">Voltooid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{averageProgress}%</div>
            <div className="text-sm text-slate-500">Gemiddeld</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Add Goal Form */}
          {showAddForm && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Nieuw RPM Doel
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Result */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Target size={16} className="inline mr-2" />
                    RESULT - Wat wil je bereiken?
                  </label>
                  <input
                    type="text"
                    placeholder="Specifiek, meetbaar doel"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Categorie
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setNewGoal({ ...newGoal, category: key as Goal['category'] })}
                        className={`p-3 rounded-xl text-sm font-medium transition-all ${
                          newGoal.category === key
                            ? `bg-gradient-to-r ${config.color} text-white`
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purpose - WHY */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                    <Flame size={16} className="inline mr-2" />
                    PURPOSE - WAAROM moet dit gebeuren?
                  </label>
                  <textarea
                    placeholder="Dit is je emotionele brandstof. Wat drijft je? Waarom is dit belangrijk?"
                    value={newGoal.why}
                    onChange={(e) => setNewGoal({ ...newGoal, why: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 outline-none focus:border-amber-500 text-slate-800 dark:text-white resize-none"
                    rows={3}
                  />
                </div>

                {/* Pain/Pleasure */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                    <label className="block text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                      PIJN - Wat kost het als je dit NIET bereikt?
                    </label>
                    <textarea
                      placeholder="Welke pijn, spijt of verlies ervaar je als je dit niet doet?"
                      value={newGoal.painIfNot}
                      onChange={(e) => setNewGoal({ ...newGoal, painIfNot: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 outline-none focus:border-red-500 text-slate-800 dark:text-white resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      PLEZIER - Hoe voelt het als dit GELUKT is?
                    </label>
                    <textarea
                      placeholder="Visualiseer het succes. Welke emoties, trots, vreugde?"
                      value={newGoal.pleasureIfDone}
                      onChange={(e) => setNewGoal({ ...newGoal, pleasureIfDone: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700 outline-none focus:border-green-500 text-slate-800 dark:text-white resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Massive Action Plan */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Zap size={16} className="inline mr-2" />
                    MASSIVE ACTION - Concrete volgende stappen
                  </label>
                  <div className="space-y-2">
                    {(newGoal.nextActions || ['']).map((action, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium flex items-center justify-center text-slate-500">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          placeholder={`Actie ${index + 1}`}
                          value={action}
                          onChange={(e) => updateNextAction(index, e.target.value)}
                          className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                        />
                      </div>
                    ))}
                    <button
                      onClick={addNextAction}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Actie toevoegen
                    </button>
                  </div>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Calendar size={16} className="inline mr-2" />
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddGoal}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
                  >
                    Doel Toevoegen
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-medium"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Goals List */}
          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700">
                <Target size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  Geen RPM doelen nog
                </h3>
                <p className="text-slate-500 mb-4">
                  Maak je eerste doel met het RPM systeem: Result, Purpose, Massive Action
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium"
                >
                  <Plus size={16} className="inline mr-2" />
                  Eerste Doel Maken
                </button>
              </div>
            ) : (
              goals.map((goal) => {
                const config = categoryConfig[goal.category];
                const isExpanded = expandedGoal === goal.id;

                return (
                  <div
                    key={goal.id}
                    className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all ${
                      goal.completed
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                        : 'border-slate-200 dark:border-slate-700 hover:shadow-lg'
                    }`}
                  >
                    {/* Goal Header */}
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleGoal(goal.id)}
                          className="mt-1"
                        >
                          {goal.completed ? (
                            <CheckCircle size={24} className="text-emerald-500" />
                          ) : (
                            <Circle size={24} className="text-slate-300 dark:text-slate-600" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r ${config.color} text-white mb-2`}>
                                {config.label}
                              </div>
                              <h3 className={`text-lg font-semibold ${
                                goal.completed
                                  ? 'line-through text-slate-500'
                                  : 'text-slate-800 dark:text-white'
                              }`}>
                                {goal.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => deleteGoal(goal.id)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* WHY - Always visible */}
                          {goal.why && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-3">
                              <p className="text-sm text-amber-800 dark:text-amber-200">
                                <Flame size={14} className="inline mr-1" />
                                <strong>WAAROM:</strong> {goal.why}
                              </p>
                            </div>
                          )}

                          {goal.deadline && (
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                              <Calendar size={14} />
                              Deadline: {new Date(goal.deadline).toLocaleDateString('nl-NL')}
                            </div>
                          )}

                          {/* Progress */}
                          {!goal.completed && (
                            <div className="space-y-2 mb-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">Voortgang</span>
                                <span className="font-medium text-slate-800 dark:text-white">{goal.progress}%</span>
                              </div>
                              <div className="relative">
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                  <div
                                    className={`bg-gradient-to-r ${config.color} h-2 rounded-full transition-all duration-300`}
                                    style={{ width: `${goal.progress}%` }}
                                  />
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={goal.progress}
                                  onChange={(e) => updateProgress(goal.id, parseInt(e.target.value))}
                                  className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                                />
                              </div>
                            </div>
                          )}

                          {/* Expand/Collapse */}
                          <button
                            onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                            className="text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {isExpanded ? 'Minder details' : 'Meer details'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-0 border-t border-slate-200 dark:border-slate-700 mt-2">
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          {goal.painIfNot && (
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                              <p className="text-sm text-red-800 dark:text-red-200">
                                <strong>Als ik dit NIET doe:</strong><br />
                                {goal.painIfNot}
                              </p>
                            </div>
                          )}
                          {goal.pleasureIfDone && (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                              <p className="text-sm text-green-800 dark:text-green-200">
                                <strong>Als dit LUKT:</strong><br />
                                {goal.pleasureIfDone}
                              </p>
                            </div>
                          )}
                        </div>

                        {goal.nextActions && goal.nextActions.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              <Zap size={14} className="inline mr-1" />
                              Volgende Acties:
                            </p>
                            <div className="space-y-1">
                              {goal.nextActions.map((action, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <span className="w-5 h-5 bg-slate-100 dark:bg-slate-700 rounded text-xs flex items-center justify-center">
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

          {/* Tony Quote */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              "Setting goals is the first step in turning the invisible into the visible."
              <span className="block text-xs mt-1">— Tony Robbins</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
