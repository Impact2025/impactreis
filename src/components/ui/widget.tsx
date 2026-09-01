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
    default: 'bg-surface-card border-line',
    wisdom: gradient
      ? 'bg-accent border-accent text-white'
      : 'bg-surface-card border-accent',
    growth: gradient
      ? 'bg-primary border-primary text-white'
      : 'bg-surface-card border-primary-light',
    energy: gradient
      ? 'bg-tertiary border-tertiary text-white'
      : 'bg-surface-card border-tertiary',
  };

  // Icon styling per variant
  const iconStyles = {
    default: 'bg-accent-soft text-accent',
    wisdom: gradient
      ? 'bg-white/20 text-white'
      : 'bg-accent-soft text-accent',
    growth: gradient
      ? 'bg-white/20 text-white'
      : 'bg-primary-muted text-primary',
    energy: gradient
      ? 'bg-white/20 text-white'
      : 'bg-tertiary-soft text-tertiary',
  };

  // Text styling voor gradient variants
  const textStyles = gradient
    ? 'text-white'
    : 'text-ink';

  const subtitleStyles = gradient
    ? 'text-white/90'
    : 'text-ink-soft';

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
