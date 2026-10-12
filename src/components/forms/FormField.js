'use client';

import React from 'react';

export function FormField({ label, error, required, children, helperText }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
}
