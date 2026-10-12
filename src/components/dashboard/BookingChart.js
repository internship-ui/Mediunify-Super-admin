'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

const MODALITY_DATA = [
  { modality: 'Doctor OPD', count: 184, fill: '#1E3A8A' },
  { modality: 'Video Call', count: 96, fill: '#00C2CB' },
  { modality: 'Pharmacy', count: 212, fill: '#00B894' },
  { modality: 'Lab Pathology', count: 142, fill: '#7BC96F' },
  { modality: 'Radiology / MRI', count: 48, fill: '#FF7F50' },
  { modality: 'Home Nursing', count: 32, fill: '#647488' },
];

export function BookingChart() {
  return (
    <Card className="h-full">
      <CardHeader
        title="Service Modality Bookings"
        subtitle="Distribution of patient requests booked today across Karnataka"
      />
      <CardContent className="pt-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={MODALITY_DATA}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#647488' }} />
              <YAxis
                type="category"
                dataKey="modality"
                tick={{ fontSize: 11, fill: '#647488' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-slate-900 text-white p-2.5 shadow-xl border border-slate-800 text-xs">
                        <span className="font-semibold">{data.modality}:</span>{' '}
                        <span className="font-bold text-teal-400">{data.count} bookings</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
