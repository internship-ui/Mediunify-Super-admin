'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Check, X, FileText, UserCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useNotification } from '@/providers/AppProviders';

const INITIAL_TASKS = [
  {
    id: 'tsk-1',
    type: 'Prescription Verification',
    entity: 'Order #ORD-MU-50123',
    detail: 'Telmisartan 40mg + Metformin 500mg SR for Hemanth Gowda (MU-84920)',
    time: '15m ago',
    urgent: true,
    link: '/pharmacy',
    actionText: 'Review Rx',
  },
  {
    id: 'tsk-2',
    type: 'Doctor Credentialing',
    entity: 'Dr. Sneha Manjunath',
    detail: 'KMC-84201 Dermatology Registration submitted for approval',
    time: '45m ago',
    urgent: false,
    link: '/doctors',
    actionText: 'Verify KYC',
  },
  {
    id: 'tsk-3',
    type: 'Equipment Return',
    entity: 'ResMed BiPAP (EQ-RNT-77204)',
    detail: 'Returned from Nagaraju K. V. — Awaiting deposit refund clearance of ₹10,000',
    time: '2h ago',
    urgent: false,
    link: '/equipment-rentals',
    actionText: 'Inspect & Settle',
  },
];

export function PendingTasks() {
  const { notify } = useNotification();
  const [tasks, setTasks] = React.useState(INITIAL_TASKS);

  const handleQuickApprove = (id, type) => {
    setTasks(tasks.filter((t) => t.id !== id));
    notify(`Approved task: ${type}`);
  };

  return (
    <Card className="h-full">
      <CardHeader
        title="Pending Admin Action Items"
        subtitle="Operational tasks requiring Super Admin sign-off"
        action={
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200">
            {tasks.length} Pending
          </span>
        }
      />
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              All tasks cleared! No urgent actions pending.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {task.type}
                    </span>
                    {task.urgent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        Urgent
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">{task.time}</span>
                </div>

                <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mt-0.5">
                  {task.entity}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {task.detail}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <Link href={task.link}>
                    <span className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 underline">
                      {task.actionText} →
                    </span>
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs"
                      onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}
                    >
                      Dismiss
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => handleQuickApprove(task.id, task.type)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
