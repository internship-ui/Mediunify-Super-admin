'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Pill, CalendarCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNavigation() {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Patients', href: '/patients', icon: Users },
    { label: 'Appointments', href: '/appointments', icon: CalendarCheck },
    { label: 'Pharmacy', href: '/pharmacy', icon: Pill },
    { label: 'SOS Alert', href: '/emergency-sos', icon: AlertTriangle, danger: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 lg:hidden flex items-center justify-around py-2 px-1 shadow-lg">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors',
              isActive
                ? 'text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
              item.danger && 'text-rose-600 dark:text-rose-400 font-bold'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
