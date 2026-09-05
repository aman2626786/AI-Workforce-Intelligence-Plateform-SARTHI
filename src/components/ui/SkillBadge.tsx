import React from 'react';
import { CheckCircle2, FileText, UserCheck, Sparkles, AlertCircle } from 'lucide-react';

export interface SkillBadgeProps {
  type: 'Verified' | 'Resume Extracted' | 'Self Reported' | 'Rising' | 'Stable' | 'Emerging' | 'Declining';
  className?: string;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ type, className = '' }) => {
  switch (type) {
    case 'Verified':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Verified
        </span>
      );
    case 'Resume Extracted':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 ${className}`}>
          <FileText className="w-3.5 h-3.5 text-purple-600" />
          Resume Extracted
        </span>
      );
    case 'Self Reported':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
          Self Reported
        </span>
      );
    case 'Emerging':
    case 'Rising':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 ${className}`}>
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          {type}
        </span>
      );
    case 'Stable':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
          {type}
        </span>
      );
    case 'Declining':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          {type}
        </span>
      );
    default:
      return null;
  }
};
