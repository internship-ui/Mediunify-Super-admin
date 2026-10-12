'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useNotification } from '@/providers/AppProviders';

export default function LoginPage() {
  const router = useRouter();
  const { notify } = useNotification();
  const [email, setEmail] = useState('namith.admin@mediunify.org');
  const [password, setPassword] = useState('Admin@2026');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      notify('Logged in successfully as Super Admin');
      router.push('/dashboard');
    }, 600);
  };

  const handleRoleQuickLogin = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('Demo@2026');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      notify(`Logged in as ${roleEmail.split('@')[0]}`);
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/20 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl mb-4 p-2">
            <Image
              src="/images/mediunify-logo.png"
              alt="MediUnify"
              width={64}
              height={64}
              className="object-contain w-full h-full"
              priority
            />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1E3A8A] dark:text-blue-400">
            Medi<span className="text-[#00B894]">Unify</span>
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1">
            Super Admin Control Center
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Sign In to Command Portal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Access Karnataka healthcare operations, pharmacy, and SOS control.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Staff Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Remember session</span>
              </label>
              <span className="text-teal-600 font-medium">Secured with MFA</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={loading}
              icon={ArrowRight}
            >
              Authenticate & Enter
            </Button>
          </form>

          {/* Demonstration Quick Roles */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" /> Demo Quick Sign-In
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleRoleQuickLogin('namith.admin@mediunify.org')}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-left transition-colors"
              >
                <p className="font-bold text-teal-600 dark:text-teal-400 text-[11px]">Super Admin</p>
                <p className="text-[10px] text-slate-400 truncate">Executive Lead</p>
              </button>
              <button
                type="button"
                onClick={() => handleRoleQuickLogin('dr.sharath.c@mediunify.org')}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-left transition-colors"
              >
                <p className="font-bold text-blue-600 dark:text-blue-400 text-[11px]">Clinical Director</p>
                <p className="text-[10px] text-slate-400 truncate">Doctor Verification</p>
              </button>
              <button
                type="button"
                onClick={() => handleRoleQuickLogin('swamy.pharma@mediunify.org')}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-left transition-colors"
              >
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">Pharmacy Lead</p>
                <p className="text-[10px] text-slate-400 truncate">Rx Approvals</p>
              </button>
              <button
                type="button"
                onClick={() => handleRoleQuickLogin('shashi.ops@mediunify.org')}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-left transition-colors"
              >
                <p className="font-bold text-orange-600 dark:text-orange-400 text-[11px]">Operations Mgr</p>
                <p className="text-[10px] text-slate-400 truncate">SOS & Ambulance</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          MediUnify Healthtech Karnataka © 2026. Internal Administrative Use Only.
        </p>
      </div>
    </div>
  );
}
