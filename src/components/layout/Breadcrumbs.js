'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0 || pathname === '/dashboard') {
    return (
      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5 py-1">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          Executive Dashboard
        </span>
      </div>
    );
  }

  return (
    <nav className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5 py-1">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>

      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        const formatted = segment
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            {isLast ? (
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatted}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
