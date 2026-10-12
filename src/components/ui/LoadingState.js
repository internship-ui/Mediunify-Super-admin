'use client';

import React from 'react';

export function LoadingState({ message = 'Loading MediUnify records...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-teal-100 dark:border-teal-950" />
        <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" />
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        {message}
      </p>
    </div>
  );
}
