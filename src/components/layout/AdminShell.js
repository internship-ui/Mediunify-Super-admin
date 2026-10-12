'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Breadcrumbs } from './Breadcrumbs';
import { MobileNavigation } from './MobileNavigation';

export function AdminShell({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Sidebar Drawer */}
      <AdminSidebar
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 transition-all duration-300">
        <AdminHeader onOpenMobile={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 pb-24 lg:pb-8">
          <div className="mb-2">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavigation />
    </div>
  );
}
