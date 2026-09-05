'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { JobMatch } from '@/data/jobs';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, XCircle, Sparkles, Building2, MapPin, Briefcase, ExternalLink, PlusCircle } from 'lucide-react';
import { AiInsightBadge } from '@/components/ui/AiInsightBadge';

interface JobDetailModalProps {
  job: JobMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, isOpen, onClose }) => {
  const { addToast, addSkillToRoadmap } = useApp();

  if (!job) return null;

  const allSkills = [
    ...job.strongSkills.map((s) => ({ name: s, isMatched: true })),
    ...job.missingSkills.map((s) => ({ name: s, isMatched: false })),
  ];

  const handleApply = () => {
    const domain = job.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const careerUrl = `https://www.${domain}.com/careers`;
    window.open(careerUrl, '_blank');
    addToast(`Opened official careers page for ${job.companyName}!`, 'success');
  };

  const handleAddMissingSkills = () => {
    if (job.missingSkills.length === 0) {
      addToast('You already satisfy 100% of skills required for this role!', 'info');
      return;
    }
    job.missingSkills.forEach((skName) => {
      addSkillToRoadmap({
        id: `sk_gen_${Date.now()}_${skName}`,
        name: skName,
        category: 'Job Requirement',
        demandPercentage: 85,
        trend: 'up',
        priority: 'High',
        status: 'Rising',
        studentLevel: 'None',
        requiredLevel: 'Advanced',
        gapSeverity: 'Critical',
        categoryColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        description: `Target competency for ${job.jobTitle} at ${job.companyName}.`,
      });
    });
    addToast(`Added ${job.missingSkills.length} missing skill(s) to your Career Roadmap!`, 'success');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={job.jobTitle} subtitle={`${job.companyName} • ${job.location}`}>
      <div className="space-y-6">
        {/* Header Match Summary Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 text-white flex items-center justify-between gap-4 shadow-soft-md">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-200">Compatibility Index</span>
            <h4 className="text-2xl font-black mt-0.5">{job.matchScore}% Skill Match</h4>
            <p className="text-xs text-brand-100 mt-1">
              You satisfy {job.matchedSkillsCount} out of {job.totalRequiredSkillsCount} required key competencies.
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300 mb-0.5" />
            <span className="text-xs font-black">{job.matchScore}%</span>
          </div>
        </div>

        {/* Company Quick Details */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</span>
            <p className="text-xs font-extrabold text-slate-800 mt-0.5">{job.department}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</span>
            <p className="text-xs font-extrabold text-slate-800 mt-0.5">{job.location.split(' ')[0]}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Salary Range</span>
            <p className="text-xs font-extrabold text-emerald-600 mt-0.5">{job.salaryRange}</p>
          </div>
        </div>

        {/* Skill Match Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-extrabold text-slate-900">Skill Match Breakdown</h5>
            <span className="text-xs text-slate-500 font-semibold">
              Verified against target JD signals
            </span>
          </div>

          <div className="space-y-2">
            {allSkills.map((sk) => (
              <div
                key={sk.name}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-sm font-semibold transition-all ${
                  sk.isMatched
                    ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                    : 'bg-rose-50/60 border-rose-200 text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {sk.isMatched ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  {sk.name}
                </span>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                    sk.isMatched
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {sk.isMatched ? 'Matched in Profile ✓' : 'Missing Gap ✕'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Transparent AI Explanation Note */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <AiInsightBadge label="Transparent Match Rationale" variant="blue" />
          </div>
          <p className="text-slate-700 leading-relaxed font-medium">
            "{job.matchExplanation}"
          </p>
          <p className="text-[11px] text-slate-500 italic">
            * Your match score is computed using deterministic cosine and requirement weights against active industry postings.
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleAddMissingSkills}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>Add Gaps to Roadmap</span>
          </button>
          <button
            onClick={handleApply}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore Role & Apply</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
