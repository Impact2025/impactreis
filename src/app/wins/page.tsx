'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, Sparkles, Plus, Search, X } from 'lucide-react';
import { Win, CreateWinData } from '@/types';
import { api } from '@/lib/api';
import { AddWinModal } from '@/components/wins/add-win-modal';
import { BottomNav } from '@/components/ui/bottom-nav';
import { AuthService } from '@/lib/auth';

const CATEGORIES = [
  { value: 'all',      label: 'Alles',       emoji: '🏆' },
  { value: 'business', label: 'Business',    emoji: '💼' },
  { value: 'personal', label: 'Persoonlijk', emoji: '⭐' },
  { value: 'health',   label: 'Gezondheid',  emoji: '❤️' },
  { value: 'learning', label: 'Leren',       emoji: '📚' },
];

const CAT_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  business: { bg: '#f0fdf4', text: '#16a34a', badge: '#dcfce7' },
  personal: { bg: '#fef9ee', text: '#b45309', badge: '#fef3c7' },
  health:   { bg: '#fdf2f8', text: '#be185d', badge: '#fce7f3' },
  learning: { bg: '#eff6ff', text: '#1d4ed8', badge: '#dbeafe' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getRank(total: number) {
  if (total >= 100) return 'Legend';
  if (total >= 50)  return 'Elite';
  if (total >= 25)  return 'Pro';
  if (total >= 10)  return 'Rising';
  return 'Starter';
}

export default function WinsPage() {
  const router                                  = useRouter();
  const [wins, setWins]                         = useState<Win[]>([]);
  const [filtered, setFiltered]                 = useState<Win[]>([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [selectedCat, setSelectedCat]           = useState('all');
  const [searchQuery, setSearchQuery]           = useState('');
  const [searchOpen, setSearchOpen]             = useState(false);
  const streak                                  = 12; // TODO: from API

  useEffect(() => {
    if (!AuthService.getUser()) { router.push('/auth/login'); return; }
    loadWins();
  }, []);

  useEffect(() => { applyFilters(); }, [wins, selectedCat, searchQuery]);

  const loadWins = async () => {
    try {
      setIsLoading(true);
      setWins(await api.wins.getAll());
    } catch { /* silent */ }
    finally  { setIsLoading(false); }
  };

  const applyFilters = () => {
    let f = [...wins];
    if (selectedCat !== 'all') f = f.filter(w => w.category === selectedCat);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(w =>
        w.title.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q) ||
        w.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    f.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFiltered(f);
  };

  const handleAdd = async (data: CreateWinData) => {
    const w = await api.wins.create(data);
    setWins(p => [w, ...p]);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Win verwijderen?')) return;
    await api.wins.delete(id);
    setWins(p => p.filter(w => w.id !== id));
  };

  /* Group by month */
  const grouped = filtered.reduce<Record<string, Win[]>>((acc, w) => {
    const key = new Date(w.date).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long' });
    (acc[key] ??= []).push(w);
    return acc;
  }, {});

  const rank = getRank(wins.length);

  return (
    <div className="min-h-screen bg-white pb-28">

      {/* ══ HEADER ══════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e8e8ec]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-full bg-[#f4f4f7] flex items-center justify-center text-[#0a0a14] hover:bg-[#e8e8ec] transition-colors"
          >
            <ArrowLeft size={17} />
          </Link>
          <h1 className="text-[16px] font-bold text-[#0a0a14]">Wall of Wins</h1>
          <button
            onClick={() => setSearchOpen(v => !v)}
            className="w-9 h-9 rounded-full bg-[#f4f4f7] flex items-center justify-center hover:bg-[#e8e8ec] transition-colors"
          >
            <Trophy size={17} className="text-[#f59e0b]" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5">

        {/* ══ HERO ════════════════════════════════════════════ */}
        <div className="rounded-[20px] bg-[#f0fdf4] mt-5 mb-6 px-5 pt-7 pb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#dcfce7] flex items-center justify-center mx-auto mb-4">
            <Sparkles size={22} className="text-[#00cc66]" />
          </div>
          <h2 className="text-[30px] font-bold text-[#0a0a14] leading-tight mb-2">
            Keep Winning.
          </h2>
          <p className="text-[13px] text-[#8a8a9a] leading-relaxed mb-5">
            Success is a habit. Document your journey<br />and celebrate every milestone.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#00cc66] text-[#0a0a14] font-bold text-[14px] shadow-[0_4px_18px_rgba(0,204,102,0.38)] active:scale-[0.97] transition-transform"
          >
            <Plus size={16} strokeWidth={2.5} />
            Celebrate New Win
          </button>
        </div>

        {/* ══ STATS ROW ═══════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          <div className="rounded-[14px] bg-[#f4f4f7] px-3 py-4 text-center">
            <p className="text-[9px] font-bold text-[#8a8a9a] uppercase tracking-[0.14em] mb-2">Total Wins</p>
            <p className="text-[26px] font-bold text-[#0a0a14] leading-none">{wins.length}</p>
          </div>
          <div className="rounded-[14px] border border-[#fde68a] bg-[#fef3c7] px-3 py-4 text-center">
            <p className="text-[9px] font-bold text-[#f59e0b] uppercase tracking-[0.14em] mb-2">Streak</p>
            <p className="text-[26px] font-bold text-[#0a0a14] leading-none">{streak}</p>
          </div>
          <div className="rounded-[14px] bg-[#f4f4f7] px-3 py-4 text-center">
            <p className="text-[9px] font-bold text-[#8a8a9a] uppercase tracking-[0.14em] mb-2">Rank</p>
            <p className="text-[18px] font-bold text-[#0a0a14] leading-none mt-0.5">{rank}</p>
          </div>
        </div>

        {/* ══ SEARCH ══════════════════════════════════════════ */}
        {searchOpen && (
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8a9a]" />
            <input
              autoFocus
              type="text"
              placeholder="Zoek in je wins..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-3 rounded-[12px] bg-[#f4f4f7] text-[13px] text-[#0a0a14] placeholder-[#8a8a9a] outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <X size={14} className="text-[#8a8a9a]" />
              </button>
            )}
          </div>
        )}

        {/* ══ FILTERS ══════════════════════════════════════════ */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-5 px-5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCat(cat.value)}
              className={`flex-none flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all active:scale-95 ${
                selectedCat === cat.value
                  ? 'bg-[#0a0a14] text-white'
                  : 'bg-[#f4f4f7] text-[#8a8a9a] hover:bg-[#e8e8ec]'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* ══ LOADING ══════════════════════════════════════════ */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-[#00cc66] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ══ EMPTY STATE ══════════════════════════════════════ */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#f0fdf4] flex items-center justify-center mx-auto mb-4">
              <Trophy size={28} className="text-[#00cc66]" />
            </div>
            <h3 className="text-[18px] font-bold text-[#0a0a14] mb-2">
              {searchQuery || selectedCat !== 'all' ? 'Geen wins gevonden' : 'Eerste win!'}
            </h3>
            <p className="text-[13px] text-[#8a8a9a] max-w-[240px] mx-auto mb-6 leading-relaxed">
              {searchQuery || selectedCat !== 'all'
                ? 'Probeer een andere filter.'
                : 'Elke stap vooruit telt. Leg jouw eerste win vast!'}
            </p>
            {!searchQuery && selectedCat === 'all' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#00cc66] text-[#0a0a14] font-bold text-[13px] shadow-[0_4px_12px_rgba(0,204,102,0.3)]"
              >
                <Plus size={15} /> Win toevoegen
              </button>
            )}
          </div>
        )}

        {/* ══ TIMELINE ════════════════════════════════════════ */}
        {!isLoading && filtered.length > 0 && (
          <section className="space-y-8">
            <h2 className="text-[15px] font-bold text-[#0a0a14]">Your Recent Successes</h2>
            {Object.entries(grouped).map(([month, mWins]) => (
              <div key={month}>
                {/* Month divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-[#e8e8ec]" />
                  <span className="text-[10px] font-bold text-[#8a8a9a] uppercase tracking-[0.15em]">{month}</span>
                  <div className="h-px flex-1 bg-[#e8e8ec]" />
                </div>

                {/* 2-col grid */}
                <div className="grid grid-cols-2 gap-3">
                  {mWins.map(win => {
                    const c = CAT_COLORS[win.category] ?? { bg: '#f4f4f7', text: '#8a8a9a', badge: '#e8e8ec' };
                    const catLabel = CATEGORIES.find(x => x.value === win.category);
                    return (
                      <div
                        key={win.id}
                        className="group relative rounded-[16px] border border-[#e8e8ec] overflow-hidden"
                        style={{ background: c.bg }}
                      >
                        <div className="p-4">
                          {/* Category badge */}
                          <div className="flex items-center justify-between mb-2.5">
                            <span
                              className="text-[8px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
                              style={{ background: c.badge, color: c.text }}
                            >
                              {catLabel?.label ?? win.category}
                            </span>
                            {win.impact_level >= 4 && <span className="text-[12px]">⭐</span>}
                          </div>

                          {/* Title */}
                          <p className="text-[13px] font-bold text-[#0a0a14] leading-snug mb-1">
                            {win.title}
                          </p>

                          {/* Description */}
                          {win.description && (
                            <p className="text-[11px] text-[#8a8a9a] leading-relaxed line-clamp-2 mb-2">
                              {win.description}
                            </p>
                          )}

                          {/* Date */}
                          <p className="text-[10px] text-[#8a8a9a]">{formatDate(win.date)}</p>
                        </div>

                        {/* Delete on hover */}
                        <button
                          onClick={() => handleDelete(win.id)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 border border-[#e8e8ec] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 text-[#8a8a9a]"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ══ MASTERMIND STATUS CARD ══════════════════════════ */}
        {wins.length >= 5 && (
          <div className="mt-8 rounded-[20px] bg-gradient-to-br from-[#f59e0b] via-[#f97316] to-[#ef4444] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Trophy size={14} className="text-white/90" />
                <span className="text-[8px] font-bold tracking-[0.2em] text-white/80 uppercase">
                  Mastermind Status
                </span>
              </div>
              <span className="text-[22px]">🏅</span>
            </div>
            <h3 className="text-[19px] font-bold text-white leading-tight mb-1.5">
              Top {Math.max(1, Math.round(100 - wins.length * 1.5))}% Performer
            </h3>
            <p className="text-[12px] text-white/80 leading-relaxed">
              Je win rate is met 14% gestegen deze maand.<br />Houd het momentum vast!
            </p>
          </div>
        )}

        <div className="h-6" />
      </main>

      {/* ══ FAB (mobile, above nav) ══════════════════════════ */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed z-40 bottom-24 right-5 w-[52px] h-[52px] rounded-full bg-[#00cc66] flex items-center justify-center shadow-[0_4px_20px_rgba(0,204,102,0.45)] active:scale-95 transition-transform sm:hidden"
      >
        <Plus size={22} strokeWidth={2.5} className="text-[#0a0a14]" />
      </button>

      <AddWinModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAdd}
      />

      <BottomNav fab={{ onClick: () => setIsModalOpen(true), label: 'Win toevoegen' }} />
    </div>
  );
}
