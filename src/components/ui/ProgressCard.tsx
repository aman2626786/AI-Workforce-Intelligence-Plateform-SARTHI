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
    blue: { bar: 'bg-sky-600', text: 'text-sky-600', bg: 'bg-sky-50' },
    emerald: { bar: 'bg-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    amber: { bar: 'bg-sky-600', text: 'text-sky-600', bg: 'bg-sky-50' },
    purple: { bar: 'bg-sky-600', text: 'text-sky-600', bg: 'bg-sky-50' },
  };

  const selected = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-3xl bg-white border border-sky-200/80 shadow-soft-sm hover:shadow-soft-md transition-all ${
        onClick ? 'cursor-pointer hover:border-sky-400' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[15px] font-extrabold text-slate-800">{title}</span>
        <span className={`text-lg font-black ${selected.text}`}>{percentage}%</span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${selected.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>

      {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
    </div>
  );
};
