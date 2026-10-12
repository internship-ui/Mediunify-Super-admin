'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';

export function Dropdown({ trigger, items = [], align = 'right' }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div onClick={() => setOpen(!open)}>
        {trigger || (
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div
          className={cn(
            'absolute z-30 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/80 dark:border-slate-800 py-1.5 focus:outline-none animate-in fade-in zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div
                  key={index}
                  className="my-1 border-t border-slate-100 dark:border-slate-800"
                />
              );
            }
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  setOpen(false);
                  item.onClick && item.onClick();
                }}
                disabled={item.disabled}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                  item.danger && 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
