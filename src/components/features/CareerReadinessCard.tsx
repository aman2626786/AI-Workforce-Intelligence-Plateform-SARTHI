import React from 'react';

interface CareerReadinessCardProps {
  role: string;
  location: string;
  company: string;
  readinessScore: number;
}

export const CareerReadinessCard: React.FC<CareerReadinessCardProps> = ({
  role,
  location,
  company,
  readinessScore,
}) => {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (readinessScore / 100) * circumference;

  return (
    <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-sky-200 shadow-soft-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all min-w-0">
      <div className="space-y-3 flex-1 min-w-0">
        <div>
          <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold tracking-wide uppercase border border-sky-200">
            Target Career Profile
          </span>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">{role}</h2>
          <p className="text-slate-600 text-sm sm:text-base mt-1 font-normal">
            Optimized against 10,000+ real-time market job postings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium pt-1 max-w-full">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 truncate max-w-full">
            Role: <span className="text-slate-900 font-semibold ml-1">{role}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 truncate max-w-full">
            Location: <span className="text-slate-900 font-semibold ml-1">{location}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 truncate max-w-full">
            Target: <span className="text-slate-900 font-semibold ml-1">{company}</span>
          </div>
        </div>
      </div>

      {/* Circular Readiness Meter */}
      <div className="flex flex-col items-center justify-center shrink-0 self-center md:self-auto">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="56"
              cy="56"
              r="40"
              stroke="#f0f9ff"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="56"
              cy="56"
              r="40"
              stroke={readinessScore >= 70 ? '#059669' : '#0284c7'}
              strokeWidth="9"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-slate-900">{readinessScore}%</span>
            <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">Ready</span>
          </div>
        </div>
        <span className="text-xs font-medium text-slate-500 mt-2">Overall Match Score</span>
      </div>
    </div>
  );
};
