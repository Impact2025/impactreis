import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

interface BentoGridItemProps {
  children: ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2 | 3;
  variant?: 'default' | 'wisdom' | 'growth' | 'energy';
}

/**
 * Bento Grid Container
 * Een flexibel grid systeem voor het dashboard met soft minimalist styling
 */
export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  className,
  cols = 2,
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div
      className={cn(
        'grid gap-6',
        gridCols[cols],
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Bento Grid Item
 * Individuele card in de bento grid met responsive span support
 */
export const BentoGridItem: React.FC<BentoGridItemProps> = ({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  variant = 'default',
}) => {
  const colSpanClasses = {
    1: 'col-span-1',
    2: 'col-span-1 lg:col-span-2',
    3: 'col-span-1 lg:col-span-3',
    4: 'col-span-1 lg:col-span-4',
  };

  const rowSpanClasses = {
    1: 'row-span-1',
    2: 'row-span-1 lg:row-span-2',
    3: 'row-span-1 lg:row-span-3',
  };

  const variantStyles = {
    default: 'bg-surface-card border-line',
    wisdom: 'bg-accent-soft border-accent',
    growth: 'bg-primary-muted border-primary-light',
    energy: 'bg-tertiary-soft border-tertiary',
  };

  return (
    <div
      className={cn(
        'rounded-bento border shadow-soft',
        'transition-all duration-300 ease-out',
        'hover:shadow-soft-lg hover:-translate-y-0.5',
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  );
};
