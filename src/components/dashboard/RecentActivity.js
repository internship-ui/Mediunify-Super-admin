'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  AlertTriangle,
  Pill,
  Calendar,
  FileCheck,
  Stethoscope,
  Truck,
} from 'lucide-react';

const RECENT_ACTIVITIES = [
  {
    id: 'act-1',
    icon: AlertTriangle,
    iconColor: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60',
    title: 'ALS Ambulance Dispatched',
    subtitle: 'KA-09-EA-4421 en route to Kuvempunagar for Cardiac Emergency',
    time: '2 mins ago',
    badge: 'Critical SOS',
    badgeStatus: 'Critical - Red',
  },
  {
    id: 'act-2',
    icon: Pill,
    iconColor: 'text-teal-500 bg-teal-50 dark:bg-teal-950/60',
    title: 'Express Pharmacy Dispatched',
    subtitle: 'Rider #18 out for delivery for patient Kavitha Suresh (MU-84921)',
    time: '18 mins ago',
    badge: 'Pharmacy',
    badgeStatus: 'Out for Delivery',
  },
  {
    id: 'act-3',
    icon: Calendar,
    iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60',
    title: 'Cardiology Consultation Started',
    subtitle: 'Dr. Rajesh Kumar began OPD session for Hemanth Gowda (Token #4)',
    time: '35 mins ago',
    badge: 'In-Clinic',
    badgeStatus: 'In-Progress',
  },
  {
    id: 'act-4',
    icon: FileCheck,
    iconColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60',
    title: 'Lab Pathology Report Released',
    subtitle: 'Thyroid profile ready for patient Kavitha Suresh — Marked with abnormal TSH flag',
    time: '1 hour ago',
    badge: 'Lab Report',
    badgeStatus: 'Report Ready',
  },
  {
    id: 'act-5',
    icon: Stethoscope,
    iconColor: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60',
    title: 'Doctor KYC Verification',
    subtitle: 'Dr. Vikramaditya Hegde (DM Neurology) documents approved by Clinical Director',
    time: '2 hours ago',
    badge: 'Doctor KYC',
    badgeStatus: 'Verified',
  },
];

export function RecentActivity() {
  return (
    <Card className="h-full">
      <CardHeader
        title="Live Platform Activity"
        subtitle="Real-time operational events across Karnataka network"
      />
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {RECENT_ACTIVITIES.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.id}
                className="flex items-start gap-3.5 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${act.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {act.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {act.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {act.subtitle}
                  </p>
                  <div className="mt-2">
                    <Badge status={act.badgeStatus} size="sm">
                      {act.badge}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
