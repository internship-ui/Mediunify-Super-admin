'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/dashboard/StatCard';
import { exportToCSV } from '@/services/exportService';
import { formatCurrency } from '@/lib/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, Download, TrendingUp, Users, CalendarCheck, ShieldCheck } from 'lucide-react';

const MONTHLY_GROWTH = [
  { month: 'May 2026', consultations: 1200, pharmacyOrders: 1800, labTests: 950 },
  { month: 'Jun 2026', consultations: 1450, pharmacyOrders: 2100, labTests: 1100 },
  { month: 'Jul 2026', consultations: 1780, pharmacyOrders: 2500, labTests: 1350 },
  { month: 'Aug 2026', consultations: 2150, pharmacyOrders: 3100, labTests: 1680 },
  { month: 'Sep 2026', consultations: 2600, pharmacyOrders: 3800, labTests: 2050 },
  { month: 'Oct 2026 (MTD)', consultations: 3100, pharmacyOrders: 4400, labTests: 2400 },
];

const CITY_BREAKDOWN = [
  { city: 'Mysuru', share: 45, color: '#00B894' },
  { city: 'Bengaluru', share: 38, color: '#1E3A8A' },
  { city: 'Hubballi-Dharwad', share: 10, color: '#00C2CB' },
  { city: 'Mangaluru', share: 7, color: '#FF7F50' },
];

export function ReportsPage() {
  const handleExportSummary = () => {
    exportToCSV('mediunify_executive_report', MONTHLY_GROWTH, [
      { header: 'Reporting Month', accessorKey: 'month' },
      { header: 'Completed Consultations', accessorKey: 'consultations' },
      { header: 'Pharmacy Orders', accessorKey: 'pharmacyOrders' },
      { header: 'Diagnostics & Lab Tests', accessorKey: 'labTests' },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Healthcare Reports & Executive Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational growth trends, service modality volumes, and regional healthcare utilization across Karnataka.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Download}
          onClick={handleExportSummary}
        >
          Export Executive Metrics CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Consultations YTD"
          value="18,450"
          change="+24% YoY"
          isPositive={true}
          icon={CalendarCheck}
          accentColor="navy"
          description="Physical OPD & Telehealth"
        />
        <StatCard
          title="Doorstep Deliveries YTD"
          value="26,100"
          change="+31% YoY"
          isPositive={true}
          icon={TrendingUp}
          accentColor="teal"
          description="Average delivery: 24 mins"
        />
        <StatCard
          title="Active Care Members"
          value="5,250"
          change="84% Renewal Rate"
          isPositive={true}
          icon={ShieldCheck}
          accentColor="green"
          description="Care+ & Family Shield"
        />
        <StatCard
          title="Patient Satisfaction"
          value="4.88 / 5.0"
          change="Based on 4,920 ratings"
          isPositive={true}
          icon={Users}
          accentColor="purple"
          description="NPS Score: 78"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader
              title="6-Month Healthcare Utilization Volume"
              subtitle="Monthly comparison of consultations, medicine deliveries, and diagnostics"
            />
            <CardContent className="pt-4">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MONTHLY_GROWTH} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#647488' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#647488' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-xl bg-slate-900 text-white p-3 shadow-xl border border-slate-800 text-xs">
                              <p className="font-bold text-teal-400 mb-1">{data.month}</p>
                              <p>Consultations: {data.consultations}</p>
                              <p>Pharmacy: {data.pharmacyOrders}</p>
                              <p>Lab Tests: {data.labTests}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="consultations" fill="#1E3A8A" radius={[4, 4, 0, 0]} name="Consultations" />
                    <Bar dataKey="pharmacyOrders" fill="#00B894" radius={[4, 4, 0, 0]} name="Pharmacy Orders" />
                    <Bar dataKey="labTests" fill="#00C2CB" radius={[4, 4, 0, 0]} name="Lab Tests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader
              title="City Distribution Share"
              subtitle="Regional patient traffic breakdown"
            />
            <CardContent className="pt-4 flex flex-col items-center">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={CITY_BREAKDOWN}
                      dataKey="share"
                      nameKey="city"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {CITY_BREAKDOWN.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full space-y-2 mt-4 text-xs">
                {CITY_BREAKDOWN.map((c) => (
                  <div key={c.city} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{c.city}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{c.share}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
