'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200',
        hover && 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, title, subtitle, action }) {
  return (
    <div
      className={cn(
        'px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4',
        className
      )}
    >
      <div>
        {title && (
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return (
    <div
      className={cn(
        'px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
