'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { STATUS_BADGE_VARIANTS } from '@/lib/constants';

export function Badge({
  children,
  className,
  variant,
  status,
  size = 'md',
}) {
  let styleClass = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';

  if (status && STATUS_BADGE_VARIANTS[status]) {
    styleClass = STATUS_BADGE_VARIANTS[status];
  } else if (variant === 'teal') {
    styleClass = 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/60';
  } else if (variant === 'navy') {
    styleClass = 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60';
  } else if (variant === 'warning') {
    styleClass = 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60';
  } else if (variant === 'danger') {
    styleClass = 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60';
  } else if (variant === 'success') {
    styleClass = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60';
  }

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-colors',
        styleClass,
        sizes[size],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children || status}
    </span>
  );
}
