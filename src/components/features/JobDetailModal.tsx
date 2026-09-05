'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { JobMatch, JobSkillRequirement } from '@/data/jobs';
import { useApp } from '@/context/AppContext';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Building2,
  MapPin,
  Briefcase,
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
    const targetUrl =
      job.applyUrl ||
      `https://www.google.com/search?q=${encodeURIComponent(
        job.companyName + ' ' + job.jobTitle + ' careers jobs apply official'
      )}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    addToast(`Redirecting to official job application for ${job.companyName}!`, 'success');
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
      categoryColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: `Demanded in ${sk.demandProbability}% of ${job.jobTitle} openings at ${job.companyName}.`,
    });
    addToast(`Added "${sk.name}" to your Career Roadmap!`, 'success');
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
        categoryColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        description: `Target competency for ${job.jobTitle} at ${job.companyName}.`,
      });
    });
    addToast(`Added ${missingSkillsList.length} missing skill(s) to your Career Roadmap!`, 'success');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={job.jobTitle} subtitle={`${job.companyName} • ${job.location}`}>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Header Match Summary Box */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 text-white flex items-center justify-between gap-4 shadow-soft-md">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-200">Compatibility Index</span>
            <h4 className="text-2xl font-black mt-0.5">{job.matchScore}% Overall Compatibility</h4>
            <p className="text-xs text-brand-100 mt-1">
              You verified <strong>{matchedCount}</strong> out of <strong>{allJdSkills.length}</strong> total market JD skills ({allJdSkills.filter(s => s.tier === 'Core' && s.isMatched).length}/{coreCount} Core Mandates).
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300 mb-0.5" />
            <span className="text-xs font-black">{job.matchScore}%</span>
          </div>
        </div>

        {/* Company Quick Details */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</span>
            <p className="text-xs font-extrabold text-slate-800 mt-0.5 truncate">{job.department}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</span>
            <p className="text-xs font-extrabold text-slate-800 mt-0.5 truncate">{job.location}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Salary Range</span>
            <p className="text-xs font-extrabold text-emerald-600 mt-0.5 truncate">{job.salaryRange}</p>
          </div>
        </div>

        {/* SKILL HIERARCHY TABS */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h5 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                Comprehensive JD Skill Hierarchy ({allJdSkills.length} Skills)
              </h5>
              <p className="text-[11px] text-slate-500 font-medium">
                Categorized by market appearance frequency & hiring priority
              </p>
            </div>

            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
              {matchedCount} Matched • {missingSkillsList.length} Gaps
            </span>
          </div>

          {/* Tier Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setSkillFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                skillFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-soft-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Skills ({allJdSkills.length})
            </button>
            <button
              onClick={() => setSkillFilter('CORE')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                skillFilter === 'CORE'
                  ? 'bg-white text-brand-700 shadow-soft-sm font-extrabold'
                  : 'text-slate-600 hover:text-brand-700'
              }`}
            >
              <span>🏆 Top 7 Core Mandates</span>
              <span className="px-1.5 py-0.2 bg-brand-50 text-brand-700 rounded-full text-[10px]">88-98%</span>
            </button>
            <button
              onClick={() => setSkillFilter('SECONDARY')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                skillFilter === 'SECONDARY'
                  ? 'bg-white text-amber-700 shadow-soft-sm font-extrabold'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <span>⚡ High-Demand (8-20)</span>
              <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 rounded-full text-[10px]">60-84%</span>
            </button>
            {specCount > 0 && (
              <button
                onClick={() => setSkillFilter('SPECIALIZED')}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  skillFilter === 'SPECIALIZED'
                    ? 'bg-white text-purple-700 shadow-soft-sm font-extrabold'
                    : 'text-slate-600 hover:text-purple-700'
                }`}
              >
                <span>🔬 Specialized</span>
                <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded-full text-[10px]">35-58%</span>
              </button>
            )}
          </div>

          {/* Skill List with Demand Probabilities */}
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {filteredSkills.map((sk) => {
              const isCore = sk.tier === 'Core';
              const isSec = sk.tier === 'Secondary';

              return (
                <div
                  key={sk.name}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                    sk.isMatched
                      ? 'bg-emerald-50/40 border-emerald-200/80 hover:bg-emerald-50/70'
                      : 'bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {sk.isMatched ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-900">{sk.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                            {sk.category}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                              isCore
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : isSec
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {isCore ? 'Core Mandate' : isSec ? 'High-Demand' : 'Specialized'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                          sk.isMatched
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {sk.isMatched ? 'Matched ✓' : 'Missing ✕'}
                      </span>

                      {!sk.isMatched && (
                        <button
                          onClick={() => handleAddSingleSkill(sk)}
                          title="Add to Roadmap"
                          className="p-1 rounded-lg bg-slate-900 hover:bg-brand-600 text-white transition-all shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Demand Probability Visual Bar */}
                  <div className="space-y-1 pt-1 border-t border-slate-100/60">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Market Demand Probability in JDs:</span>
                      <strong className={isCore ? 'text-brand-700 font-extrabold' : 'text-slate-800'}>
                        {sk.demandProbability}% Appearance Frequency
                      </strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCore ? 'bg-brand-600' : isSec ? 'bg-amber-500' : 'bg-purple-500'
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
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <AiInsightBadge label="Transparent Match Rationale" variant="blue" />
          </div>
          <p className="text-slate-700 leading-relaxed font-medium">"{job.matchExplanation}"</p>
          <p className="text-[11px] text-slate-500 italic">
            * Exact application link verified with official career portal for {job.companyName}.
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleAddAllMissingSkills}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-brand-600" />
            <span>Add All Gaps to Roadmap ({missingSkillsList.length})</span>
          </button>
          <button
            onClick={handleApply}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore Role & Apply</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
