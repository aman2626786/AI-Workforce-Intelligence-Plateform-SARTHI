'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendPoint } from '@/data/industry';

interface TrendChartProps {
  data: TrendPoint[];
  title?: string;
  subtitle?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title = 'Skill Demand Trajectory over Time',
  subtitle = '% of Target Job Listings Mentioning Skill (Last 6 Months)',
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft-sm h-80 flex items-center justify-center">
        <span className="text-xs text-slate-400 font-semibold animate-pulse">Loading trend visualization...</span>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-100 self-start sm:self-auto">
          ● Real-Time Signal
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderRadius: '12px',
                color: '#ffffff',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              }}
              itemStyle={{ color: '#f8fafc', fontSize: '12px', fontWeight: 600 }}
              labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700 }}
              formatter={(value: any) => [`${value}% Demand`, '']}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="SQL"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: '#2563eb' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Python"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#10b981' }}
            />
            <Line
              type="monotone"
              dataKey="PowerBI"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#f59e0b' }}
            />
            <Line
              type="monotone"
              dataKey="GenAI"
              stroke="#8b5cf6"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#8b5cf6' }}
            />
            <Line
              type="monotone"
              dataKey="Cloud"
              stroke="#0284c7"
              strokeWidth={2}
              dot={{ r: 3, fill: '#0284c7' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
