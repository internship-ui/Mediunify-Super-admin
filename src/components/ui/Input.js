'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className,
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'block w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all',
            Icon ? 'pl-10 pr-3.5 py-2.5' : 'px-3.5 py-2.5',
            error && 'border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-500">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}
