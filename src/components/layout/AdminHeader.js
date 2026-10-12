'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/providers/ThemeProvider';
import { Logo } from '@/components/ui/Logo';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Search,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { OPERATIONAL_CITIES } from '@/lib/constants';
import { mockDataProvider } from '@/services/mock/MockDataProvider';
import { useNotification } from '@/providers/AppProviders';

export function AdminHeader({ onOpenMobile }) {
  const { theme, toggleTheme } = useTheme();
  const { notify } = useNotification();
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleResetData = () => {
    if (confirm('Reset all demo data back to default initial state?')) {
      mockDataProvider.resetAll();
      notify('Demo data has been reset to defaults.');
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      {/* Top Notice: Mock Demonstration Mode */}
      <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-blue-500/10 border-b border-teal-500/20 px-3 py-1 text-center text-[10px] sm:text-[11px] font-medium text-teal-800 dark:text-teal-300 flex items-center justify-center gap-1.5 overflow-hidden">
        <Sparkles className="w-3 h-3 text-teal-600 animate-pulse shrink-0" />
        <span className="truncate">
          <strong>Frontend Only Architecture</strong> — Mock Data active with repository abstraction.
        </span>
        <button
          onClick={handleResetData}
          className="ml-1 underline text-teal-700 dark:text-teal-400 hover:text-teal-900 flex items-center gap-1 font-semibold shrink-0"
          title="Reset local storage changes"
        >
          <RotateCcw className="w-2.5 h-2.5" /> Reset
        </button>
      </div>

      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6">
        {/* Left: Hamburger & Mobile Logo / Desktop City Switcher */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={onOpenMobile}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden shrink-0"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Brand Logo */}
          <Link href="/dashboard" className="flex lg:hidden items-center min-w-0">
            <Logo showText={true} size="sm" subtitle={null} />
          </Link>

          {/* Regional City Hub Filter */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs">
            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Operations Hub:
            </span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent border-0 font-bold text-teal-600 dark:text-teal-400 focus:outline-none cursor-pointer"
            >
              {OPERATIONAL_CITIES.map((c) => (
                <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Theme Toggle, Notifications, User Badge */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">
                    Live Operational Alerts
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold">
                    2 Urgent
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <p className="font-bold">Active ALS SOS Ambulance</p>
                      <p className="text-[11px] text-rose-700/80 dark:text-rose-400">
                        KA-09-EA-4421 dispatched to Kuvempunagar for Cardiac Emergency
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold">Prescription Review Pending</p>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
                        Order #ORD-MU-50123 has 2 Rx items awaiting pharmacist sign-off
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick status pill */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              System Online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
