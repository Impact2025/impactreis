import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WidgetProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  variant?: 'default' | 'wisdom' | 'growth' | 'energy';
  gradient?: boolean;
}

export const Widget: React.FC<WidgetProps> = ({
  title,
  subtitle,
  icon,
  children,
  className,
  actions,
  variant = 'default',
  gradient = false,
}) => {
  // Variant styling voor background en borders
  const variantStyles = {
    default: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    wisdom: gradient
      ? 'bg-gradient-to-br from-indigo-500 to-violet-600 border-indigo-400 text-white'
      : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800',
    growth: gradient
      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white'
      : 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800',
    energy: gradient
      ? 'bg-gradient-to-br from-amber-500 to-gold-600 border-amber-400 text-white'
      : 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-800',
  };

  // Icon styling per variant
  const iconStyles = {
    default: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    wisdom: gradient
      ? 'bg-white/20 text-white'
      : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    growth: gradient
      ? 'bg-white/20 text-white'
      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    energy: gradient
      ? 'bg-white/20 text-white'
      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  };

  // Text styling voor gradient variants
  const textStyles = gradient
    ? 'text-white'
    : 'text-slate-900 dark:text-white';

  const subtitleStyles = gradient
    ? 'text-white/90'
    : 'text-slate-500 dark:text-slate-400';

  return (
    <div
      className={cn(
        'rounded-bento p-6 shadow-soft border',
        'transition-all duration-300 ease-out',
        'hover:shadow-soft-lg',
        variantStyles[variant],
        className
      )}
    >
      {(title || icon || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={cn('p-2.5 rounded-xl', iconStyles[variant])}>
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className={cn('text-lg font-bold', textStyles)}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={cn('text-sm', subtitleStyles)}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
