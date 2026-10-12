'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import { NAVIGATION_CATEGORIES } from '@/data/navigation';
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  CalendarCheck,
  Video,
  Stethoscope,
  Pill,
  FlaskConical,
  ScanLine,
  UserCheck,
  PackageCheck,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Building2,
  MapPin,
  Wallet,
  BarChart3,
  ShieldAlert,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Activity,
  CreditCard,
  Truck,
  Bike,
  TestTube2,
  X,
} from 'lucide-react';

const ICON_MAP = {
  LayoutDashboard,
  Users,
  HeartHandshake,
  CalendarCheck,
  Video,
  Stethoscope,
  Pill,
  FlaskConical,
  ScanLine,
  UserCheck,
  PackageCheck,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Building2,
  MapPin,
  Wallet,
  BarChart3,
  ShieldAlert,
  FileText,
  Settings,
  Activity,
  CreditCard,
  Truck,
  Bike,
  TestTube2,
};

export function AdminSidebar({ isMobileOpen, onCloseMobile }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 shadow-sm',
          collapsed ? 'w-20' : 'w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo & Header */}
        <div className="flex items-center justify-between px-5 h-20 border-b border-slate-100 dark:border-slate-800">
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 overflow-hidden"
          >
            <Logo showText={!collapsed} size="md" />
          </Link>

          <div className="flex items-center gap-1">
            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop collapse button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {NAVIGATION_CATEGORIES.map((cat, catIdx) => (
            <div key={catIdx}>
              {!collapsed && (
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  {cat.title}
                </p>
              )}
              <div className="space-y-1">
                {cat.items.map((item) => {
                  const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      title={collapsed ? item.title : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative',
                        isActive
                          ? 'bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-700 dark:text-teal-300 border-l-4 border-teal-500 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                          isActive
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        )}
                      />
                      {!collapsed && (
                        <span className="flex-1 truncate">{item.title}</span>
                      )}

                      {!collapsed && item.badge && (
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                            item.badgeVariant === 'danger'
                              ? 'bg-rose-500 text-white animate-pulse'
                              : item.badgeVariant === 'warning'
                              ? 'bg-amber-500 text-white'
                              : 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Admin Profile */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-500/20">
              <Shield className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  Namith Gowda
                </p>
                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate">
                  Super Admin (Executive)
                </p>
              </div>
            )}
            {!collapsed && (
              <Link
                href="/login"
                className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
