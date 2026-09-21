import React from 'react';

export interface SkillBadgeProps {
  type: 'Verified' | 'Resume Extracted' | 'Self Reported' | 'Rising' | 'Stable' | 'Emerging' | 'Declining';
  className?: string;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ type, className = '' }) => {
  switch (type) {
    case 'Verified':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          Verified
        </span>
      );
    case 'Resume Extracted':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${className}`}>
          Resume Extracted
        </span>
      );
    case 'Self Reported':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${className}`}>
          Self Reported
        </span>
      );
    case 'Emerging':
    case 'Rising':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${className}`}>
          {type}
        </span>
      );
    case 'Stable':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${className}`}>
          {type}
        </span>
      );
    case 'Declining':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
          {type}
        </span>
      );
    default:
      return null;
  }
};
