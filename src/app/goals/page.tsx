'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Brain, Target, Plus, CheckCircle, Circle, ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import { AuthService } from '@/lib/auth';

interface Goal {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  deadline?: string;
  progress: number;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    deadline: ''
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
        // Load goals from localStorage for now
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
    if (!newGoal.title.trim()) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      completed: false,
      createdAt: new Date().toISOString(),
      deadline: newGoal.deadline || undefined,
      progress: 0
    };

    const updatedGoals = [...goals, goal];
    saveGoals(updatedGoals);

    setNewGoal({ title: '', description: '', deadline: '' });
    setShowAddForm(false);
  };

  const toggleGoal = (id: string) => {
    const updatedGoals = goals.map(goal =>
      goal.id === id
        ? { ...goal, completed: !goal.completed, progress: goal.completed ? 0 : 100 }
        : goal
    );
    saveGoals(updatedGoals);
  };

  const updateProgress = (id: string, progress: number) => {
    const updatedGoals = goals.map(goal =>
      goal.id === id ? { ...goal, progress: Math.max(0, Math.min(100, progress)) } : goal
    );
    saveGoals(updatedGoals);
  };

  const deleteGoal = (id: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== id);
    saveGoals(updatedGoals);
  };

  const completedGoals = goals.filter(goal => goal.completed).length;
  const totalGoals = goals.length;
  const averageProgress = totalGoals > 0 ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / totalGoals) : 0;

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
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center">
              <Target className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">Doelen</h1>
              <p className="text-sm text-slate-500">Beheer je persoonlijke doelen</p>
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
        <div className="grid grid-cols-3 gap-4">
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
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Nieuw Doel Toevoegen</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Doel titel"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                />
                <textarea
                  placeholder="Beschrijving (optioneel)"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-500 text-slate-800 dark:text-white resize-none"
                  rows={3}
                />
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleAddGoal}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
                  >
                    Toevoegen
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
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
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Geen doelen gevonden</h3>
                <p className="text-slate-500 mb-4">Begin met het toevoegen van je eerste doel om je voortgang bij te houden.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
                >
                  <Plus size={16} className="inline mr-2" />
                  Eerste Doel Toevoegen
                </button>
              </div>
            ) : (
              goals.map((goal) => (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className="mt-1"
                    >
                      {goal.completed ? (
                        <CheckCircle size={24} className="text-green-500" />
                      ) : (
                        <Circle size={24} className="text-slate-300 dark:text-slate-600" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className={`text-lg font-semibold ${goal.completed ? 'line-through text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                            {goal.title}
                          </h3>
                          {goal.description && (
                            <p className="text-slate-600 dark:text-slate-400 mt-1">{goal.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          ×
                        </button>
                      </div>

                      {goal.deadline && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                          <Calendar size={14} />
                          Deadline: {new Date(goal.deadline).toLocaleDateString('nl-NL')}
                        </div>
                      )}

                      {!goal.completed && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Voortgang</span>
                            <span className="font-medium text-slate-800 dark:text-white">{goal.progress}%</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-300"
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
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}