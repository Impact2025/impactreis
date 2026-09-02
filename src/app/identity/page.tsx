'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowLeft, Plus, Check, X, Flame } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/ui/bottom-nav';

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
  'Ik ben iemand die altijd doorzet',
  'Ik ben een leider die waarde creëert',
  'Ik ben iemand die elke dag groeit',
  'Ik ben gefocust en doelgericht',
  'Ik ben iemand die zijn woord houdt',
  'Ik ben energiek en vol vitaliteit',
  'Ik ben iemand die prioriteert',
  'Ik ben consistent in mijn rituelen',
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
        if (!AuthService.getUser()) { router.push('/auth/login'); return; }
        const profile = await api.identity.getProfile();
        setIdentities(profile.statements ?? []);
        setProofs(profile.proofs ?? []);
      } catch { /* nog geen profiel of offline — laat de lege staat zien */ }
      finally { setLoading(false); }
    };
    checkAuth();
  }, [router]);

  const persist = async (nextIdentities: IdentityStatement[], nextProofs: IdentityProof[]) => {
    setIdentities(nextIdentities);
    setProofs(nextProofs);
    await api.identity.updateProfile({ statements: nextIdentities, proofs: nextProofs });
  };

  const addIdentity = (statement: string) => {
    const newIdentity: IdentityStatement = {
      id: Date.now().toString(),
      statement,
      createdAt: new Date().toISOString(),
      isActive: true,
      proofCount: 0,
      streak: 0,
    };
    persist([...identities, newIdentity], proofs);
    setNewStatement('');
    setShowAddForm(false);
  };

  const toggleIdentity = (id: string) => {
    persist(identities.map(i => i.id === id ? { ...i, isActive: !i.isActive } : i), proofs);
  };

  const deleteIdentity = (id: string) => {
    persist(identities.filter(i => i.id !== id), proofs.filter(p => p.identityId !== id));
  };

  const addProof = () => {
    if (!selectedIdentity || !newProof.trim()) return;
    const proof: IdentityProof = {
      id: Date.now().toString(),
      identityId: selectedIdentity,
      proof: newProof.trim(),
      date: new Date().toISOString(),
    };
    const today = new Date().toDateString();
    const updatedIdentities = identities.map(i => {
      if (i.id === selectedIdentity) {
        const lastProofDay = i.lastProofDate ? new Date(i.lastProofDate).toDateString() : null;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = lastProofDay === yesterday || lastProofDay === today ? i.streak + 1 : 1;
        return { ...i, proofCount: i.proofCount + 1, lastProofDate: new Date().toISOString(), streak: newStreak };
      }
      return i;
    });
    persist(updatedIdentities, [...proofs, proof]);
    setNewProof('');
    setSelectedIdentity(null);
  };

  const getProofsForIdentity = (identityId: string) =>
    proofs
      .filter(p => p.identityId === identityId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-card flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const availableDefaults = defaultIdentities.filter(d => !identities.some(i => i.statement === d));

  return (
    <div className="min-h-screen bg-surface-card pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-card border-b border-line">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-sunken transition-colors"
            >
              <ArrowLeft size={18} className="text-ink" />
            </Link>
            <h1 className="text-[17px] font-semibold text-ink">Identiteit</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white shadow-[0_2px_12px_rgba(81,96,80,0.35)] active:scale-95 transition-transform"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">
        {/* Add form */}
        {showAddForm && (
          <div className="rounded-[16px] bg-surface-inverse p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white text-[15px] font-semibold">Nieuwe identiteit</span>
              <button
                onClick={() => { setShowAddForm(false); setNewStatement(''); }}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
            <textarea
              value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
              placeholder="Ik ben iemand die..."
              rows={3}
              className="w-full bg-white/10 text-white placeholder-white/40 rounded-[12px] px-4 py-3 text-[14px] outline-none resize-none border border-white/10 focus:border-primary transition-colors"
            />
            <button
              onClick={() => newStatement.trim() && addIdentity(newStatement.trim())}
              disabled={!newStatement.trim()}
              className="mt-3 w-full py-3 bg-primary text-white rounded-[12px] text-[14px] font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              Toevoegen
            </button>
          </div>
        )}

        {/* Suggestion chips */}
        {availableDefaults.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-ink-soft uppercase tracking-wider mb-2">Suggesties</p>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {availableDefaults.map((statement, index) => (
                <button
                  key={index}
                  onClick={() => addIdentity(statement)}
                  className="flex-shrink-0 px-3 py-2 rounded-full border border-line bg-surface-sunken text-ink text-[12px] font-medium hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
                >
                  {statement}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Proof modal */}
        {selectedIdentity && (
          <div
            className="fixed inset-0 z-50 flex items-end bg-black/40"
            onClick={() => { setSelectedIdentity(null); setNewProof(''); }}
          >
            <div
              className="w-full bg-surface-card rounded-t-[24px] p-5 max-w-lg mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-line rounded-full mx-auto mb-5" />
              <p className="text-[11px] text-ink-soft mb-1 uppercase tracking-wider">Bewijs voor</p>
              <p className="text-[15px] font-semibold text-ink mb-4 leading-snug">
                &ldquo;{identities.find(i => i.id === selectedIdentity)?.statement}&rdquo;
              </p>
              <textarea
                value={newProof}
                onChange={(e) => setNewProof(e.target.value)}
                placeholder="Wat heb je gedaan dat dit bewijst?"
                rows={3}
                autoFocus
                className="w-full bg-surface-sunken text-ink placeholder-ink-soft rounded-[12px] px-4 py-3 text-[14px] outline-none resize-none border border-line focus:border-primary transition-colors mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={addProof}
                  disabled={!newProof.trim()}
                  className="flex-1 py-3 bg-primary text-white rounded-[12px] text-[14px] font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
                >
                  Bewijs opslaan
                </button>
                <button
                  onClick={() => { setSelectedIdentity(null); setNewProof(''); }}
                  className="px-5 py-3 bg-surface-sunken text-ink rounded-[12px] text-[14px] font-medium"
                >
                  Annuleer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {identities.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center mb-4">
              <Shield size={28} className="text-ink-soft" />
            </div>
            <p className="text-[16px] font-semibold text-ink mb-2">Claim je eerste identiteit</p>
            <p className="text-[13px] text-ink-soft max-w-[240px] leading-relaxed mb-6">
              Je identiteit bepaalt je gedrag. Kies wie je wilt zijn.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full text-[14px] font-semibold active:scale-95 transition-transform"
            >
              <Plus size={16} />
              Begin nu
            </button>
          </div>
        )}

        {/* Identity cards */}
        {identities.length > 0 && (
          <div className="space-y-3">
            {identities.map((identity) => {
              const recentProofs = getProofsForIdentity(identity.id);
              return (
                <div
                  key={identity.id}
                  className={`rounded-[16px] border border-line p-5 bg-surface-card transition-opacity ${identity.isActive ? 'opacity-100' : 'opacity-50'}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-[15px] font-semibold text-ink leading-snug flex-1">
                      &ldquo;{identity.statement}&rdquo;
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleIdentity(identity.id)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${identity.isActive ? 'bg-primary' : 'bg-line'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${identity.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <button
                        onClick={() => deleteIdentity(identity.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-sunken transition-colors"
                      >
                        <X size={13} className="text-ink-soft" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                      <Check size={10} />
                      {identity.proofCount} {identity.proofCount === 1 ? 'bewijs' : 'bewijzen'}
                    </span>
                    {identity.streak > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-soft text-tertiary text-[11px] font-semibold">
                        <Flame size={10} />
                        {identity.streak} dag streak
                      </span>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="h-1.5 rounded-full bg-surface-sunken overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min(100, identity.proofCount * 10)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-ink-soft mt-1 text-right">{Math.min(identity.proofCount, 10)}/10</p>
                  </div>

                  {recentProofs.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {recentProofs.map((proof) => (
                        <div key={proof.id} className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check size={9} className="text-primary" />
                          </div>
                          <p className="text-[12px] text-ink-soft leading-relaxed">{proof.proof}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {identity.isActive && (
                    <button
                      onClick={() => setSelectedIdentity(identity.id)}
                      className="flex items-center gap-1.5 text-primary text-[12px] font-medium hover:opacity-80 transition-opacity"
                    >
                      <Plus size={13} />
                      + Bewijs toevoegen
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
