import React from 'react';
import { Target, MapPin, Building2, Sparkles } from 'lucide-react';

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
    <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-soft-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Background Subtle Shapes */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="space-y-4 flex-1">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Target Career Profile
          </span>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{role}</h2>
          <p className="text-brand-100 text-sm mt-1">
            Optimized against 10,000+ real-time market job postings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-brand-100 pt-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm">
            <Target className="w-4 h-4 text-brand-200" />
            <span>Role: <strong className="text-white">{role}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm">
            <MapPin className="w-4 h-4 text-brand-200" />
            <span>Location: <strong className="text-white">{location}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm">
            <Building2 className="w-4 h-4 text-brand-200" />
            <span>Target: <strong className="text-white">{company}</strong></span>
          </div>
        </div>
      </div>

      {/* Circular Readiness Meter */}
      <div className="flex flex-col items-center justify-center shrink-0">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="56"
              cy="56"
              r="40"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="56"
              cy="56"
              r="40"
              stroke="#ffffff"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-white">{readinessScore}%</span>
            <span className="text-[10px] font-bold text-brand-200 uppercase tracking-wider">Ready</span>
          </div>
        </div>
        <span className="text-xs font-semibold text-brand-100 mt-2">Overall Match Score</span>
      </div>
    </div>
  );
};
