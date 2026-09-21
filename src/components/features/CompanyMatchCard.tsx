import React from 'react';
import { JobMatch } from '@/data/jobs';
import { MapPin, Building2, Check, X, ArrowRight, Sparkles } from 'lucide-react';

interface CompanyMatchCardProps {
  job: JobMatch;
  onViewMatch: (job: JobMatch) => void;
}

export const CompanyMatchCard: React.FC<CompanyMatchCardProps> = ({ job, onViewMatch }) => {
  return (
    <div className="p-6 rounded-3xl bg-white border border-sky-200/90 shadow-soft-sm hover:border-sky-300 hover:shadow-soft-md transition-all flex flex-col justify-between gap-5 group">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={job.companyLogo}
              alt={job.companyName}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-sm"
            />
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                {job.jobTitle}
              </h4>
              <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {job.companyName}
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-normal">{job.department}</span>
              </p>
            </div>
          </div>

          {/* Match Ring Badge */}
          <div className="flex flex-col items-end">
            <div className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm sm:text-base shadow-xs">
              {job.matchScore}% Match
            </div>
            <span className="text-xs text-slate-400 font-medium mt-1">
              {job.matchedSkillsCount}/{job.totalRequiredSkillsCount} skills matched
            </span>
          </div>
        </div>

        {/* Location & Salary */}
        <div className="flex items-center justify-between text-sm text-slate-600 font-medium pb-4 border-b border-slate-100">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-400" />
            {job.location}
          </span>
          <span className="font-semibold text-slate-900">{job.salaryRange}</span>
        </div>

        {/* Strong Skills */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Matched Strong Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {job.strongSkills.map((sk, idx) => (
              <span
                key={`strong-${sk}-${idx}`}
                className="px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                {sk}
              </span>
            ))}
          </div>
        </div>

        {/* Missing Skills */}
        {job.missingSkills.length > 0 && (
          <div className="mt-3.5 space-y-1.5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missing Skill Gaps</div>
            <div className="flex flex-wrap gap-1.5">
              {job.missingSkills.map((sk, idx) => (
                <span
                  key={`missing-${sk}-${idx}`}
                  className="px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5 text-rose-600" />
                  {sk}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          Job Type: <span className="text-slate-800 font-semibold">{job.type}</span>
        </span>
        <button
          onClick={() => onViewMatch(job)}
          className="text-xs sm:text-sm font-semibold text-sky-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 cursor-pointer"
        >
          View Match Analysis
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
