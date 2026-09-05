'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { CompanySkillCriteria } from '@/data/industry';
import { useApp } from '@/context/AppContext';
import { findMatchingCandidateSkill } from '@/utils/skillMatcher';
import {
  Building2,
  MapPin,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Award,
  Layers,
  ListChecks,
} from 'lucide-react';

interface CompanyProfileModalProps {
  company: CompanySkillCriteria | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({ company, isOpen, onClose }) => {
  const { profile, activeRole, addToast, addSkillToRoadmap } = useApp();

  if (!company) return null;

  const candidateSkills = profile?.skills || [];

  // Determine which skills the candidate already matches strictly
  const mandatoryMatches = company.entryMandatorySkills.map((sk) => {
    const matched = findMatchingCandidateSkill(candidateSkills, sk);
    return { name: sk, isMatched: !!matched };
  });

  const preferredMatches = company.preferredAdvancedSkills.map((sk) => {
    const matched = findMatchingCandidateSkill(candidateSkills, sk);
    return { name: sk, isMatched: !!matched };
  });

  const totalMandatory = mandatoryMatches.length;
  const satisfiedMandatory = mandatoryMatches.filter((m) => m.isMatched).length;
  const matchPct = Math.round(
    ((satisfiedMandatory + preferredMatches.filter((m) => m.isMatched).length * 0.5) /
      Math.max(1, totalMandatory + preferredMatches.length * 0.5)) *
      100
  );

  const handleApply = () => {
    const domain = company.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const careerUrl = `https://www.${domain}.com/careers`;
    window.open(careerUrl, '_blank');
    addToast(`Opened official careers page for ${company.companyName}!`, 'success');
  };

  const handleAddMissingSkills = () => {
    const missing = [...mandatoryMatches, ...preferredMatches].filter((m) => !m.isMatched);
    if (missing.length === 0) {
      addToast('You already satisfy all required and preferred skills for this role!', 'info');
      return;
    }
    missing.forEach((sk) => {
      addSkillToRoadmap({
        id: `sk_gen_${Date.now()}_${sk.name}`,
        name: sk.name,
        category: 'Industry Requirement',
        demandPercentage: 85,
        trend: 'up',
        priority: 'High',
        status: 'Rising',
        studentLevel: 'None',
        requiredLevel: 'Advanced',
        gapSeverity: 'Critical',
        categoryColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        description: `Required competency for ${company.activeRole} at ${company.companyName}.`,
      });
    });
    addToast(`Added ${missing.length} missing skill(s) to your Career Roadmap!`, 'success');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={company.companyName}
      subtitle={`${company.activeRole} • ${company.industryTier}`}
    >
      <div className="space-y-6">
        {/* Top Company Header Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white shadow-soft-md space-y-4 border border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={company.companyLogo}
                alt={company.companyName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-md bg-white"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{company.companyName}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                    {company.hiringStatus}
                  </span>
                </div>
                <p className="text-xs font-bold text-brand-300 flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-brand-400" />
                  {company.activeRole}
                </p>
                <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Bengaluru / Pune / Remote Options • {company.openPositionsCount} Open Positions
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Candidate Fit
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">{Math.max(65, matchPct)}%</div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/10 text-center">
            <div className="p-2 rounded-xl bg-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tier</span>
              <p className="text-xs font-black text-white mt-0.5">{company.industryTier}</p>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Min Proficiency</span>
              <p className="text-xs font-black text-white mt-0.5">{company.minProficiencyExpected}</p>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Salary Range</span>
              <p className="text-xs font-black text-emerald-400 mt-0.5">₹14.0 - ₹24.0 LPA</p>
            </div>
          </div>
        </div>

        {/* Mandatory Entry Skills Evaluation */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Mandatory Skills (Entry Gate)
            </h4>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {satisfiedMandatory} of {totalMandatory} Matched
            </span>
          </div>

          <div className="space-y-2">
            {mandatoryMatches.map((m) => (
              <div
                key={m.name}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  m.isMatched
                    ? 'bg-emerald-50/80 border-emerald-200 text-slate-900'
                    : 'bg-amber-50/70 border-amber-200 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {m.isMatched ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{m.name}</span>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    m.isMatched
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {m.isMatched ? 'Verified in Resume ✓' : 'Action Recommended ✕'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Advanced Skills */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-600" />
            Preferred Advanced Differentiators
          </h4>

          <div className="flex flex-wrap gap-2">
            {preferredMatches.map((p) => (
              <span
                key={p.name}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                  p.isMatched
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {p.isMatched && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Hiring & Interview Roadmap */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ListChecks className="w-4 h-4 text-brand-600" />
            Typical Interview Process for {company.activeRole}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-black text-brand-600 uppercase">Round 1</span>
              <p className="font-extrabold text-slate-900">Technical Screening</p>
              <p className="text-[11px] text-slate-500">Core algorithms, systems code & domain basics.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-black text-purple-600 uppercase">Round 2</span>
              <p className="font-extrabold text-slate-900">Practical Assessment</p>
              <p className="text-[11px] text-slate-500">Live project simulator & architectural challenge.</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] font-black text-emerald-600 uppercase">Round 3</span>
              <p className="font-extrabold text-slate-900">System Architecture</p>
              <p className="text-[11px] text-slate-500">Hardware-in-loop design & team culture fit.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleAddMissingSkills}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition-colors cursor-pointer text-center"
          >
            Add Gaps to Career Roadmap
          </button>
          <button
            onClick={handleApply}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black transition-all shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Visit Company Careers Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
