'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  description,
  accentColor = 'teal',
  onClick,
}) {
  const accents = {
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    navy: 'bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-600/20',
    coral: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    red: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        {Icon && (
          <div
            className={cn(
              'p-2.5 rounded-xl border',
              accents[accentColor] || accents.teal
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {value}
        </h3>
        {change && (
          <div
            className={cn(
              'flex items-center text-xs font-semibold px-2 py-0.5 rounded-full',
              isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            <span>{change}</span>
          </div>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}
