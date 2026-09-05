import React from 'react';
import { JobMatch } from '@/data/jobs';
import { MapPin, Building2, Check, X, ArrowRight, Sparkles } from 'lucide-react';

interface CompanyMatchCardProps {
  job: JobMatch;
  onViewMatch: (job: JobMatch) => void;
}

export const CompanyMatchCard: React.FC<CompanyMatchCardProps> = ({ job, onViewMatch }) => {
  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between gap-5 group">
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
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">
                {job.jobTitle}
              </h4>
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {job.companyName}
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-normal">{job.department}</span>
              </p>
            </div>
          </div>

          {/* Match Ring Badge */}
          <div className="flex flex-col items-end">
            <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-sm flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {job.matchScore}% Match
            </div>
            <span className="text-[10px] text-slate-400 font-semibold mt-1">
              {job.matchedSkillsCount}/{job.totalRequiredSkillsCount} skills matched
            </span>
          </div>
        </div>

        {/* Location & Salary */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-4 border-b border-slate-100">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {job.location}
          </span>
          <span className="font-bold text-slate-800">{job.salaryRange}</span>
        </div>

        {/* Strong Skills */}
        <div className="mt-4 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Matched Strong Skills</div>
          <div className="flex flex-wrap gap-1.5">
            {job.strongSkills.map((sk, idx) => (
              <span
                key={`strong-${sk}-${idx}`}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
              >
                <Check className="w-3 h-3 text-emerald-600" />
                {sk}
              </span>
            ))}
          </div>
        </div>

        {/* Missing Skills */}
        {job.missingSkills.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Missing Skill Gaps</div>
            <div className="flex flex-wrap gap-1.5">
              {job.missingSkills.map((sk, idx) => (
                <span
                  key={`missing-${sk}-${idx}`}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1"
                >
                  <X className="w-3 h-3 text-rose-600" />
                  {sk}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Button CTA */}
      <button
        onClick={() => onViewMatch(job)}
        className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-brand-600 hover:text-white text-slate-800 text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-2 group-hover:border-brand-600"
      >
        View Match Analysis
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
