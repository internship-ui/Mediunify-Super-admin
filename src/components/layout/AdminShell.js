'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Breadcrumbs } from './Breadcrumbs';

export function AdminShell({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Sidebar */}
      <AdminSidebar
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 transition-all duration-300">
        <AdminHeader onOpenMobile={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="mb-2">
            <Breadcrumbs />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
