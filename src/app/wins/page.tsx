'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Win, CreateWinData } from '@/types';
import { api } from '@/lib/api';
import { WinCard } from '@/components/wins/win-card';
import { AddWinModal } from '@/components/wins/add-win-modal';
import { Button } from '@/components/ui/button';

/**
 * Wins Page - Wall of Wins
 * Timeline view van alle wins met filtering en search
 */
export default function WinsPage() {
  const [wins, setWins] = useState<Win[]>([]);
  const [filteredWins, setFilteredWins] = useState<Win[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Category filters
  const categories = [
    { value: 'all', label: 'Alles', icon: '🏆' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'personal', label: 'Persoonlijk', icon: '⭐' },
    { value: 'health', label: 'Gezondheid', icon: '❤️' },
    { value: 'learning', label: 'Leren', icon: '📚' },
  ];

  // Load wins
  useEffect(() => {
    loadWins();
  }, []);

  // Filter wins wanneer category of search verandert
  useEffect(() => {
    filterWins();
  }, [wins, selectedCategory, searchQuery]);

  const loadWins = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.wins.getAll();
      setWins(data);
    } catch (err) {
      setError('Kon wins niet laden. Probeer het opnieuw.');
      console.error('Error loading wins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterWins = () => {
    let filtered = [...wins];

    // Filter op category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((win) => win.category === selectedCategory);
    }

    // Filter op search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (win) =>
          win.title.toLowerCase().includes(query) ||
          win.description?.toLowerCase().includes(query) ||
          win.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sorteer op datum (nieuwste eerst)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredWins(filtered);
  };

  const handleAddWin = async (data: CreateWinData) => {
    try {
      const newWin = await api.wins.create(data);
      setWins([newWin, ...wins]);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error creating win:', err);
      throw err;
    }
  };

  const handleDeleteWin = async (id: number) => {
    if (!confirm('Weet je zeker dat je deze win wilt verwijderen?')) return;

    try {
      await api.wins.delete(id);
      setWins(wins.filter((win) => win.id !== id));
    } catch (err) {
      console.error('Error deleting win:', err);
      alert('Kon win niet verwijderen. Probeer het opnieuw.');
    }
  };

  // Groepeer wins per maand
  const groupWinsByMonth = (winsToGroup: Win[]) => {
    const groups: Record<string, Win[]> = {};

    winsToGroup.forEach((win) => {
      const date = new Date(win.date);
      const monthKey = date.toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: 'long',
      });

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(win);
    });

    return groups;
  };

  const groupedWins = groupWinsByMonth(filteredWins);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                🏆 Wall of Wins
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Jouw persoonlijke Cookie Jar - {wins.length} wins verzameld
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsModalOpen(true)}
              className="hidden sm:flex"
            >
              + Nieuwe Win
            </Button>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={cn(
                    'px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-200',
                    'flex items-center gap-2',
                    selectedCategory === cat.value
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Zoek in je wins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 pl-12 rounded-xl',
                  'bg-slate-100 dark:bg-slate-700',
                  'border-2 border-transparent',
                  'focus:border-indigo-500 focus:outline-none',
                  'text-slate-900 dark:text-white',
                  'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                  'transition-colors'
                )}
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Wins laden...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-6 rounded-bento bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button variant="primary" onClick={loadWins} className="mt-4">
              Opnieuw proberen
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredWins.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {searchQuery || selectedCategory !== 'all'
                ? 'Geen wins gevonden'
                : 'Tijd voor je eerste win!'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? 'Probeer een andere zoekopdracht of filter.'
                : 'Start met het bijhouden van je successen. Elke stap vooruit is een win waard!'}
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button variant="primary" size="lg" onClick={() => setIsModalOpen(true)}>
                + Eerste Win Toevoegen
              </Button>
            )}
          </div>
        )}

        {/* Timeline */}
        {!isLoading && !error && filteredWins.length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedWins).map(([month, monthWins]) => (
              <div key={month}>
                {/* Month header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                    {month}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
                </div>

                {/* Wins grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {monthWins.map((win) => (
                    <WinCard
                      key={win.id}
                      win={win}
                      onDelete={() => handleDeleteWin(win.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 sm:hidden',
          'w-14 h-14 rounded-full',
          'bg-indigo-600 text-white shadow-lg',
          'flex items-center justify-center',
          'hover:bg-indigo-700 active:scale-95',
          'transition-all duration-200',
          'z-50'
        )}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Add Win Modal */}
      <AddWinModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddWin}
      />
    </div>
  );
}
