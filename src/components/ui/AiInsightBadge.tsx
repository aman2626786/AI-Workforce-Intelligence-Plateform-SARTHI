import React from 'react';
import { Sparkles } from 'lucide-react';

interface AiInsightBadgeProps {
  label?: string;
  variant?: 'blue' | 'purple' | 'emerald';
  className?: string;
}

export const AiInsightBadge: React.FC<AiInsightBadgeProps> = ({
  label = 'AI Insight',
  variant = 'blue',
  className = '',
}) => {
  const styles = {
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-sky-50 text-sky-700 border-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${styles[variant]} ${className}`}>
      <Sparkles className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};
