'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
      <span>{message}</span>
    </div>
  );
}
