import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WidgetProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export const Widget: React.FC<WidgetProps> = ({
  title,
  subtitle,
  icon,
  children,
  className,
  actions,
}) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm',
        'border border-slate-100 dark:border-slate-700',
        className
      )}
    >
      {(title || icon || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
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
