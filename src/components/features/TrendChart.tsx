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

  // Dynamic keys extraction (excluding month)
  const metricKeys = data && data.length > 0 ? Object.keys(data[0]).filter((k) => k !== 'month') : [];
  const COLOR_PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#0284c7', '#ec4899', '#14b8a6', '#f97316'];

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
              formatter={(value: any, name: any) => [`${value}% Demand`, `${name}`]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600 }}
            />
            {metricKeys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key}
                stroke={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                strokeWidth={idx === 0 || idx === 3 ? 3 : 2.5}
                strokeDasharray={idx === 3 ? '5 5' : undefined}
                dot={{ r: 4, fill: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
