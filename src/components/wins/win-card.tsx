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
    business: 'bg-primary-muted border-primary-light',
    personal: 'bg-tertiary-soft border-tertiary',
    health: 'bg-error-soft border-error',
    learning: 'bg-accent-soft border-accent',
  };

  // Category icons en labels
  const categoryConfig = {
    business: { label: 'Business', icon: '💼', color: 'text-primary' },
    personal: { label: 'Persoonlijk', icon: '⭐', color: 'text-tertiary' },
    health: { label: 'Gezondheid', icon: '❤️', color: 'text-error' },
    learning: { label: 'Leren', icon: '📚', color: 'text-accent' },
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
              i < level ? 'text-tertiary' : 'text-outline'
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
      <h3 className="text-lg font-bold text-ink mb-2">
        {win.title}
      </h3>

      {/* Description */}
      {win.description && (
        <p className="text-sm text-ink-soft mb-4 line-clamp-3">
          {win.description}
        </p>
      )}

      {/* Tags */}
      {win.tags && win.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {win.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium rounded-lg bg-surface-card/60 text-ink-soft border border-line"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer met datum */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-outline">
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
                className="h-8 px-3 hover:bg-error-soft hover:text-error"
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
