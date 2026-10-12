'use client';

import React from 'react';
import { Button } from './Button';
import { FileQuestion } from 'lucide-react';

export function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your filters or search keywords to find what you are looking for.',
  icon: Icon = FileQuestion,
  actionText,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 my-4">
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 mb-4 ring-8 ring-slate-50/50 dark:ring-slate-800/50">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-5">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
