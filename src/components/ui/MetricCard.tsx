import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  badgeText?: string;
  badgeVariant?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  badgeText,
  badgeVariant = 'blue',
  className = '',
}) => {
  const badgeStyles = {
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-rose-50 text-rose-700 border-rose-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className={`p-6 rounded-3xl bg-white border border-sky-200/90 shadow-soft-sm hover:border-sky-300 hover:shadow-soft-md transition-all ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        {badgeText && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeStyles[badgeVariant]}`}>
            {badgeText}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span className={`font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
