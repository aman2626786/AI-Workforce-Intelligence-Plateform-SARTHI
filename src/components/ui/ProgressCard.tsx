import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  percentage: number;
  icon?: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'purple';
  subtitle?: string;
  onClick?: () => void;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  percentage,
  icon: Icon,
  color = 'blue',
  subtitle,
  onClick,
}) => {
  const colorMap = {
    blue: { bar: 'bg-brand-600', text: 'text-brand-600', bg: 'bg-brand-50' },
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
    purple: { bar: 'bg-purple-600', text: 'text-purple-600', bg: 'bg-purple-50' },
  };

  const selected = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border border-slate-200/90 shadow-soft-sm hover:shadow-soft-md transition-all ${
        onClick ? 'cursor-pointer hover:border-brand-300' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={`p-2 rounded-xl ${selected.bg} ${selected.text}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <span className="text-sm font-bold text-slate-800">{title}</span>
        </div>
        <span className={`text-base font-extrabold ${selected.text}`}>{percentage}%</span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${selected.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>

      {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
    </div>
  );
};
