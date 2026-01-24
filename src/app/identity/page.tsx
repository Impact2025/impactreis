'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, ArrowLeft, Plus, Check, X, Flame, Trophy, Target,
  Calendar, TrendingUp, Sparkles, Lock, Unlock
} from 'lucide-react';
import { AuthService } from '@/lib/auth';

interface IdentityStatement {
  id: string;
  statement: string;
  createdAt: string;
  isActive: boolean;
  proofCount: number;
  lastProofDate?: string;
  streak: number;
}

interface IdentityProof {
  id: string;
  identityId: string;
  proof: string;
  date: string;
}

const defaultIdentities = [
  "Ik ben iemand die altijd doorzet",
  "Ik ben een leider die waarde creëert",
  "Ik ben iemand die elke dag groeit",
  "Ik ben gefocust en doelgericht",
  "Ik ben iemand die zijn woord houdt",
  "Ik ben energiek en vol vitaliteit",
  "Ik ben iemand die prioriteert",
  "Ik ben consistent in mijn rituelen"
];

export default function IdentityPage() {
  const [identities, setIdentities] = useState<IdentityStatement[]>([]);
  const [proofs, setProofs] = useState<IdentityProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStatement, setNewStatement] = useState('');
  const [selectedIdentity, setSelectedIdentity] = useState<string | null>(null);
  const [newProof, setNewProof] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        const savedIdentities = localStorage.getItem('identities');
        const savedProofs = localStorage.getItem('identityProofs');

        if (savedIdentities) {
          setIdentities(JSON.parse(savedIdentities));
        }
        if (savedProofs) {
          setProofs(JSON.parse(savedProofs));
        }
      } catch (err) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const saveIdentities = (updated: IdentityStatement[]) => {
    setIdentities(updated);
    localStorage.setItem('identities', JSON.stringify(updated));
  };

  const saveProofs = (updated: IdentityProof[]) => {
    setProofs(updated);
    localStorage.setItem('identityProofs', JSON.stringify(updated));
  };

  const addIdentity = (statement: string) => {
    const newIdentity: IdentityStatement = {
      id: Date.now().toString(),
      statement,
      createdAt: new Date().toISOString(),
      isActive: true,
      proofCount: 0,
      streak: 0
    };

    saveIdentities([...identities, newIdentity]);
    setNewStatement('');
    setShowAddForm(false);
  };

  const toggleIdentity = (id: string) => {
    const updated = identities.map(i =>
      i.id === id ? { ...i, isActive: !i.isActive } : i
    );
    saveIdentities(updated);
  };

  const deleteIdentity = (id: string) => {
    const updated = identities.filter(i => i.id !== id);
    saveIdentities(updated);
    const updatedProofs = proofs.filter(p => p.identityId !== id);
    saveProofs(updatedProofs);
  };

  const addProof = () => {
    if (!selectedIdentity || !newProof.trim()) return;

    const proof: IdentityProof = {
      id: Date.now().toString(),
      identityId: selectedIdentity,
      proof: newProof.trim(),
      date: new Date().toISOString()
    };

    saveProofs([...proofs, proof]);

    // Update identity proof count and streak
    const today = new Date().toDateString();
    const updated = identities.map(i => {
      if (i.id === selectedIdentity) {
        const lastProofDay = i.lastProofDate ? new Date(i.lastProofDate).toDateString() : null;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = lastProofDay === yesterday || lastProofDay === today ? i.streak + 1 : 1;

        return {
          ...i,
          proofCount: i.proofCount + 1,
          lastProofDate: new Date().toISOString(),
          streak: newStreak
        };
      }
      return i;
    });
    saveIdentities(updated);

    setNewProof('');
    setSelectedIdentity(null);
  };

  const getProofsForIdentity = (identityId: string) => {
    return proofs
      .filter(p => p.identityId === identityId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const activeIdentities = identities.filter(i => i.isActive);
  const totalProofs = proofs.length;
  const longestStreak = identities.reduce((max, i) => Math.max(max, i.streak), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 dark:border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Shield className="text-amber-400" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Mijn Identiteit</h1>
                <p className="text-white/70">Wie ben jij? Bewijs het.</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
            >
              <Plus size={16} />
              Nieuwe Identiteit
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{activeIdentities.length}</div>
              <div className="text-sm text-white/70">Actieve Identiteiten</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{totalProofs}</div>
              <div className="text-sm text-white/70">Bewijzen Verzameld</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{longestStreak}d</div>
              <div className="text-sm text-white/70">Langste Streak</div>
            </div>
          </div>
        </div>
      </header>

      {/* Tony Quote */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-6 py-4">
        <p className="text-center text-amber-800 dark:text-amber-200 text-sm italic max-w-2xl mx-auto">
          "The strongest force in the human personality is the need to stay consistent
          with how we define ourselves."
          <span className="block text-xs mt-1 text-amber-600 dark:text-amber-400">— Tony Robbins</span>
        </p>
      </div>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Nieuwe Identiteit Claimen
                </h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Kies een bestaande identiteit of schrijf je eigen "Ik ben..." statement.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {defaultIdentities
                  .filter(d => !identities.some(i => i.statement === d))
                  .map((statement, index) => (
                    <button
                      key={index}
                      onClick={() => addIdentity(statement)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      {statement}
                    </button>
                  ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStatement}
                  onChange={(e) => setNewStatement(e.target.value)}
                  placeholder="Ik ben iemand die..."
                  className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-white"
                />
                <button
                  onClick={() => newStatement.trim() && addIdentity(newStatement.trim())}
                  disabled={!newStatement.trim()}
                  className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium disabled:opacity-50"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Add Proof Modal */}
          {selectedIdentity && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                  Bewijs Toevoegen
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Wat heb je vandaag gedaan dat bewijst: <br />
                  <strong className="text-slate-900 dark:text-white">
                    "{identities.find(i => i.id === selectedIdentity)?.statement}"
                  </strong>
                </p>
                <textarea
                  value={newProof}
                  onChange={(e) => setNewProof(e.target.value)}
                  placeholder="Beschrijf je actie of prestatie..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-white resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={addProof}
                    disabled={!newProof.trim()}
                    className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium disabled:opacity-50"
                  >
                    Bewijs Opslaan
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIdentity(null);
                      setNewProof('');
                    }}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-medium"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Identities List */}
          {identities.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700">
              <Shield size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                Claim je eerste identiteit
              </h3>
              <p className="text-slate-500 mb-4 max-w-md mx-auto">
                Je identiteit bepaalt je gedrag. Kies wie je wilt zijn, en bewijs het elke dag.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium"
              >
                <Plus size={16} className="inline mr-2" />
                Eerste Identiteit Claimen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {identities.map((identity) => {
                const recentProofs = getProofsForIdentity(identity.id);

                return (
                  <div
                    key={identity.id}
                    className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all ${
                      identity.isActive
                        ? 'border-slate-200 dark:border-slate-700'
                        : 'border-slate-100 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          identity.isActive
                            ? 'bg-slate-900 dark:bg-white'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}>
                          <Shield className={identity.isActive ? 'text-white dark:text-slate-900' : 'text-slate-400'} size={24} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                              "{identity.statement}"
                            </h3>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleIdentity(identity.id)}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                title={identity.isActive ? 'Deactiveren' : 'Activeren'}
                              >
                                {identity.isActive ? <Unlock size={16} /> : <Lock size={16} />}
                              </button>
                              <button
                                onClick={() => deleteIdentity(identity.id)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                            <div className="flex items-center gap-1">
                              <Trophy size={14} />
                              {identity.proofCount} bewijzen
                            </div>
                            <div className="flex items-center gap-1">
                              <Flame size={14} />
                              {identity.streak} dag streak
                            </div>
                            {identity.lastProofDate && (
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(identity.lastProofDate).toLocaleDateString('nl-NL')}
                              </div>
                            )}
                          </div>

                          {/* Recent Proofs */}
                          {recentProofs.length > 0 && (
                            <div className="space-y-2 mb-4">
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                Recente Bewijzen
                              </p>
                              {recentProofs.map((proof) => (
                                <div
                                  key={proof.id}
                                  className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                                >
                                  <Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <span>{proof.proof}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Proof Button */}
                          {identity.isActive && (
                            <button
                              onClick={() => setSelectedIdentity(identity.id)}
                              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              <Plus size={14} />
                              Bewijs toevoegen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-6 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, identity.proofCount * 10)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {identity.proofCount}/10
                        </span>
                      </div>
                      {identity.proofCount >= 10 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                          <Sparkles size={12} />
                          Identiteit versterkt! Je bent dit echt.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Insight Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Identiteit → Actie → Resultaat</h3>
                <p className="text-white/70 text-sm">
                  Je gedrag volgt je identiteit. Als je gelooft "Ik ben iemand die sport",
                  wordt sporten vanzelfsprekend. Verzamel bewijzen om je nieuwe identiteit
                  te versterken.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
