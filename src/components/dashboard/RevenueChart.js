'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/formatters';

const REVENUE_DATA = [
  { time: '08:00 AM', revenue: 4200, orders: 12 },
  { time: '10:00 AM', revenue: 9800, orders: 28 },
  { time: '12:00 PM', revenue: 18400, orders: 49 },
  { time: '02:00 PM', revenue: 27900, orders: 74 },
  { time: '04:00 PM', revenue: 38200, orders: 98 },
  { time: '06:00 PM', revenue: 42800, orders: 114 },
];

export function RevenueChart() {
  return (
    <Card className="h-full">
      <CardHeader
        title="Revenue Trends (Today)"
        subtitle="Gross platform collection across consultations, pharmacy & diagnostics"
      />
      <CardContent className="pt-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={REVENUE_DATA}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B894" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00B894" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: '#647488' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#647488' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${val / 1000}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-slate-900 text-white p-3 shadow-xl border border-slate-800 text-xs">
                        <p className="font-semibold text-teal-400">{data.time}</p>
                        <p className="mt-1 font-bold text-sm">
                          {formatCurrency(data.revenue)}
                        </p>
                        <p className="text-slate-400 mt-0.5">
                          {data.orders} Completed Checkouts
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#00B894"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
