'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] dark:bg-[#0F172A] p-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Page Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          The Super Admin module or record route you are searching for does not exist or has been relocated.
        </p>
        <Link href="/dashboard">
          <Button variant="primary" icon={ArrowLeft} className="w-full">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
