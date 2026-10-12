'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
  footer,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-2.5 sm:p-4 text-center">
        <div
          className={cn(
            'relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-2xl transition-all sm:my-8 w-full border border-slate-200 dark:border-slate-800 my-4',
            maxWidth
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              {title && (
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 max-h-[75vh] overflow-y-auto">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
