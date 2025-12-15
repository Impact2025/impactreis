import React from 'react';
import { cn } from '@/lib/utils';
import { Win } from '@/types';
import { Button } from '@/components/ui/button';

interface WinCardProps {
  win: Win;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Win Card Component
 * Displays een individuele win met category-based styling en impact level
 */
export const WinCard: React.FC<WinCardProps> = ({ win, onEdit, onDelete }) => {
  // Category-based gradient colors
  const categoryStyles = {
    business: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800',
    personal: 'bg-gradient-to-br from-amber-50 to-gold-50 dark:from-amber-950/30 dark:to-gold-950/30 border-amber-200 dark:border-amber-800',
    health: 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200 dark:border-rose-800',
    learning: 'bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border-indigo-200 dark:border-indigo-800',
  };

  // Category icons en labels
  const categoryConfig = {
    business: { label: 'Business', icon: '💼', color: 'text-emerald-600 dark:text-emerald-400' },
    personal: { label: 'Persoonlijk', icon: '⭐', color: 'text-amber-600 dark:text-amber-400' },
    health: { label: 'Gezondheid', icon: '❤️', color: 'text-rose-600 dark:text-rose-400' },
    learning: { label: 'Leren', icon: '📚', color: 'text-indigo-600 dark:text-indigo-400' },
  };

  // Impact level stars
  const renderImpactLevel = (level: number) => {
    return (
      <div className="flex gap-0.5" title={`Impact niveau: ${level}/5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'text-sm',
              i < level ? 'text-gold-500' : 'text-slate-300 dark:text-slate-600'
            )}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  // Format date als "2 weken geleden"
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Vandaag';
    if (diffDays === 1) return 'Gisteren';
    if (diffDays < 7) return `${diffDays} dagen geleden`;
    if (diffDays < 14) return '1 week geleden';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weken geleden`;
    if (diffDays < 60) return '1 maand geleden';
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} maanden geleden`;
    return `${Math.floor(diffDays / 365)} jaar geleden`;
  };

  const config = categoryConfig[win.category];
  const [isHovering, setIsHovering] = React.useState(false);

  return (
    <div
      className={cn(
        'rounded-bento border shadow-soft p-6',
        'transition-all duration-300 ease-out',
        'hover:shadow-soft-lg hover:-translate-y-0.5',
        categoryStyles[win.category],
        'group relative'
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header met category en impact */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <span className={cn('text-sm font-semibold', config.color)}>
            {config.label}
          </span>
        </div>
        {renderImpactLevel(win.impact_level)}
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        {win.title}
      </h3>

      {/* Description */}
      {win.description && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
          {win.description}
        </p>
      )}

      {/* Tags */}
      {win.tags && win.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {win.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium rounded-lg bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer met datum */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatRelativeDate(win.date)}
        </span>

        {/* Edit/Delete buttons - show on hover */}
        {isHovering && (onEdit || onDelete) && (
          <div className="flex gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 px-3"
              >
                ✏️
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 px-3 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600"
              >
                🗑️
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
