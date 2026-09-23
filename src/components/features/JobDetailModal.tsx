'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { JobMatch, JobSkillRequirement } from '@/data/jobs';
import { useApp } from '@/context/AppContext';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Plus,
  Layers,
  Award,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { AiInsightBadge } from '@/components/ui/AiInsightBadge';

interface JobDetailModalProps {
  job: JobMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, isOpen, onClose }) => {
  const { addToast, addSkillToRoadmap } = useApp();
  const [skillFilter, setSkillFilter] = useState<'ALL' | 'CORE' | 'SECONDARY' | 'SPECIALIZED'>('ALL');

  if (!job) return null;

  // Fallback if jdSkills is not populated
  const allJdSkills: JobSkillRequirement[] = job.jdSkills && job.jdSkills.length > 0
    ? job.jdSkills
    : [
        ...job.strongSkills.map((s, idx) => ({
          name: s,
          category: 'Core Competency',
          demandProbability: Math.max(70, 98 - idx * 4),
          tier: (idx < 7 ? 'Core' : 'Secondary') as 'Core' | 'Secondary',
          isMatched: true,
        })),
        ...job.missingSkills.map((s, idx) => ({
          name: s,
          category: 'Required Skill',
          demandProbability: Math.max(60, 92 - idx * 5),
          tier: (idx < 3 ? 'Core' : 'Secondary') as 'Core' | 'Secondary',
          isMatched: false,
        })),
      ];

  const coreCount = allJdSkills.filter((s) => s.tier === 'Core').length;
  const secCount = allJdSkills.filter((s) => s.tier === 'Secondary').length;
  const specCount = allJdSkills.filter((s) => s.tier === 'Specialized').length;

  const filteredSkills = allJdSkills.filter((s) => {
    if (skillFilter === 'CORE') return s.tier === 'Core';
    if (skillFilter === 'SECONDARY') return s.tier === 'Secondary';
    if (skillFilter === 'SPECIALIZED') return s.tier === 'Specialized';
    return true;
  });

  const matchedCount = allJdSkills.filter((s) => s.isMatched).length;
  const missingSkillsList = allJdSkills.filter((s) => !s.isMatched);

  const handleApply = () => {
    // If the job has a synthetic careers dummy link or no link, use live Google search query
    let targetUrl = job.applyUrl;
    if (!targetUrl || targetUrl.includes('/jobs/') || targetUrl.includes('careers.')) {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(
        `${job.companyName} ${job.jobTitle} jobs careers official openings`
      )}`;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    addToast(`Opening live job listings for ${job.jobTitle} at ${job.companyName}!`, 'success');
  };

  const handleAddSingleSkill = (sk: JobSkillRequirement) => {
    addSkillToRoadmap({
      id: `sk_gen_${Date.now()}_${sk.name.replace(/\s+/g, '_')}`,
      name: sk.name,
      category: sk.category || 'Target JD Skill',
      demandPercentage: sk.demandProbability || 85,
      trend: 'up',
      priority: sk.tier === 'Core' ? 'High' : sk.tier === 'Secondary' ? 'Medium' : 'Low',
      status: 'Rising',
      studentLevel: 'None',
      requiredLevel: 'Advanced',
      gapSeverity: sk.tier === 'Core' ? 'Critical' : 'Partial',
      categoryColor: 'bg-sky-50 text-sky-700 border-sky-200',
      description: `Demanded in ${sk.demandProbability}% of ${job.jobTitle} openings at ${job.companyName}.`,
    });
  };

  const handleAddAllMissingSkills = () => {
    if (missingSkillsList.length === 0) {
      addToast('You already satisfy 100% of skills required for this role!', 'info');
      return;
    }
    missingSkillsList.forEach((sk) => {
      addSkillToRoadmap({
        id: `sk_gen_${Date.now()}_${sk.name.replace(/\s+/g, '_')}`,
        name: sk.name,
        category: sk.category || 'Target JD Skill',
        demandPercentage: sk.demandProbability || 85,
        trend: 'up',
        priority: sk.tier === 'Core' ? 'High' : 'Medium',
        status: 'Rising',
        studentLevel: 'None',
        requiredLevel: 'Advanced',
        gapSeverity: sk.tier === 'Core' ? 'Critical' : 'Partial',
        categoryColor: 'bg-sky-50 text-sky-700 border-sky-200',
        description: `Target competency for ${job.jobTitle} at ${job.companyName}.`,
      });
    });
    addToast(`Added ${missingSkillsList.length} missing skill(s) to your Career Roadmap!`, 'success');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={job.jobTitle} subtitle={`${job.companyName} • ${job.location}`}>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1 font-sans">
        {/* Header Match Summary Box */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white flex items-center justify-between gap-4 border border-slate-800 shadow-soft-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Match Compatibility</span>
            <h4 className="text-2xl font-bold mt-1 text-white">{job.matchScore}% Overall Compatibility</h4>
            <p className="text-xs text-slate-300 mt-1.5">
              You verified <strong className="text-white">{matchedCount}</strong> out of <strong className="text-white">{allJdSkills.length}</strong> total market JD skills ({allJdSkills.filter(s => s.tier === 'Core' && s.isMatched).length}/{coreCount} Core Mandates).
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-center shrink-0">
            <Sparkles className="w-5 h-5 text-sky-400 mb-0.5" />
            <span className="text-sm font-bold text-white">{job.matchScore}%</span>
          </div>
        </div>

        {/* Company Quick Details */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Department</span>
            <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{job.department}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Location</span>
            <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{job.location}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Salary Range</span>
            <p className="text-xs font-bold text-emerald-600 mt-0.5 truncate">{job.salaryRange}</p>
          </div>
        </div>

        {/* SKILL HIERARCHY TABS */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                JD Skill Requirements ({allJdSkills.length} Skills)
              </h5>
              <p className="text-xs text-slate-500 font-normal">
                Categorized by market appearance frequency & hiring priority
              </p>
            </div>

            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
              {matchedCount} Matched • {missingSkillsList.length} Gaps
            </span>
          </div>

          {/* Tier Filter Buttons - Clean, No Emojis */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setSkillFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                skillFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-soft-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Requirements ({allJdSkills.length})
            </button>
            <button
              onClick={() => setSkillFilter('CORE')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                skillFilter === 'CORE'
                  ? 'bg-white text-sky-700 shadow-soft-sm font-semibold'
                  : 'text-slate-600 hover:text-sky-700'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-sky-600" />
              <span>Core Mandates</span>
              <span className="px-1.5 py-0.2 bg-sky-50 text-sky-700 rounded-md text-[10px] font-semibold border border-sky-200/50">88-98%</span>
            </button>
            <button
              onClick={() => setSkillFilter('SECONDARY')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                skillFilter === 'SECONDARY'
                  ? 'bg-white text-slate-900 shadow-soft-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>High-Demand</span>
              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-semibold border border-emerald-200/50">60-84%</span>
            </button>
            {specCount > 0 && (
              <button
                onClick={() => setSkillFilter('SPECIALIZED')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  skillFilter === 'SPECIALIZED'
                    ? 'bg-white text-slate-900 shadow-soft-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Specialized</span>
                <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-semibold border border-indigo-200/50">35-58%</span>
              </button>
            )}
          </div>

          {/* Skill List with Demand Probabilities */}
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {filteredSkills.map((sk, idx) => {
              const isCore = sk.tier === 'Core';
              const isSec = sk.tier === 'Secondary';

              return (
                <div
                  key={`jd-skill-${sk.name}-${sk.tier}-${idx}`}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                    sk.isMatched
                      ? 'bg-emerald-50/30 border-emerald-200/70 hover:bg-emerald-50/60'
                      : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {sk.isMatched ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{sk.name}</span>
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                            {sk.category}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                              isCore
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : isSec
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}
                          >
                            {isCore ? 'Core Mandate' : isSec ? 'High-Demand' : 'Specialized'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border flex items-center gap-1 ${
                          sk.isMatched
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {sk.isMatched ? 'Matched' : 'Missing Gap'}
                      </span>

                      {!sk.isMatched && (
                        <button
                          onClick={() => handleAddSingleSkill(sk)}
                          title="Add to Roadmap"
                          className="p-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Demand Probability Visual Bar */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                      <span>Market Demand in JDs:</span>
                      <strong className="text-slate-800 font-semibold">
                        {sk.demandProbability}% Appearance Frequency
                      </strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCore ? 'bg-sky-600' : isSec ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${sk.demandProbability}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transparent AI Explanation Note */}
        <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <AiInsightBadge label="Match Rationale" variant="blue" />
          </div>
          <p className="text-slate-700 leading-relaxed font-normal">"{job.matchExplanation}"</p>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleAddAllMissingSkills}
            className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-soft-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add All Gaps to Roadmap ({missingSkillsList.length})</span>
          </button>
          <button
            onClick={handleApply}
            className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-soft-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Search Live Openings</span>
            <ExternalLink className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
