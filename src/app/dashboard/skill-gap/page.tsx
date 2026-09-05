'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { SkillComparison } from '@/components/features/SkillComparison';
import { MetricCard } from '@/components/ui/MetricCard';
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lightbulb,
  Search,
  Filter,
  Layers,
  Star,
  Award,
  Zap,
} from 'lucide-react';

export default function SkillGapPage() {
  const { skills, profile, addSkillToRoadmap, activeRole, openAiDrawerWithTopic } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'Met' | 'Partial' | 'Critical'>('ALL');

  const criticalGaps = useMemo(() => skills.filter((s) => s.gapSeverity === 'Critical'), [skills]);
  const partialGaps = useMemo(() => skills.filter((s) => s.gapSeverity === 'Partial'), [skills]);
  const metSkills = useMemo(() => skills.filter((s) => s.gapSeverity === 'Met'), [skills]);

  // Accurate weighted match score calculation
  const calculatedMatchScore = useMemo(() => {
    if (!skills.length) return profile?.readinessScore || 30;
    let totalWeight = 0;
    let earnedWeight = 0;
    skills.forEach((s) => {
      const weight = s.priority === 'Critical' || s.priority === 'High' ? 3 : s.priority === 'Medium' ? 2 : 1;
      totalWeight += weight;
      if (s.studentLevel === 'Advanced') earnedWeight += weight * 1.0;
      else if (s.studentLevel === 'Intermediate') earnedWeight += weight * 0.65;
      else if (s.studentLevel === 'Basic') earnedWeight += weight * 0.35;
    });
    return Math.max(10, Math.round((earnedWeight / Math.max(1, totalWeight)) * 100));
  }, [skills, profile?.readinessScore]);

  // Filter skills based on search, tier, and severity
  const filteredSkills = useMemo(() => {
    return skills.filter((sk) => {
      const matchesSearch =
        sk.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sk.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sk.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = selectedSeverity === 'ALL' || sk.gapSeverity === selectedSeverity;

      let matchesTier = true;
      if (selectedTier === 'TIER_1') matchesTier = (sk.tierRank || 0) <= 7;
      else if (selectedTier === 'TIER_2') matchesTier = (sk.tierRank || 0) > 7 && (sk.tierRank || 0) <= 20;
      else if (selectedTier === 'TIER_3') matchesTier = (sk.tierRank || 0) > 20;

      return matchesSearch && matchesSeverity && matchesTier;
    });
  }, [skills, searchQuery, selectedTier, selectedSeverity]);

  const tier1Count = useMemo(() => skills.filter((s) => (s.tierRank || 0) <= 7).length, [skills]);
  const tier2Count = useMemo(() => skills.filter((s) => (s.tierRank || 0) > 7 && (s.tierRank || 0) <= 20).length, [skills]);
  const tier3Count = useMemo(() => skills.filter((s) => (s.tierRank || 0) > 20).length, [skills]);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Skill Gap Analysis</h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Comparing your verified resume skills against <strong className="text-slate-900">{skills.length} market-demanded competencies</strong> for <strong className="text-slate-900">{activeRole}</strong>.
          </p>
        </div>

        <button
          onClick={() => openAiDrawerWithTopic('Skill Gap Prioritization Strategy')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-brand-600" />
          Ask AI Gap Strategy
        </button>
      </div>

      {/* INTUITION GUIDANCE BANNER */}
      <div className="p-4 rounded-2xl bg-brand-50/80 border border-brand-200 text-xs text-slate-700 flex items-start gap-3 shadow-soft-sm">
        <Lightbulb className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-brand-900 text-sm font-extrabold block">💡 How Skill Gap Intelligence Works:</strong>
          <p className="leading-relaxed">
            Employer Job Descriptions demand <strong>Tier 1 Core Mandates (Top 7)</strong>, <strong>Tier 2 High-Demand Secondary (8-20)</strong>, and <strong>Tier 3 Specialized Tools</strong>. Your score is dynamically calculated by weighting verified proficiencies. Click <em>"Add to Career Roadmap"</em> on any gap to generate target learning milestones.
          </p>
        </div>
      </div>

      {/* SKILL GAP SCORE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          title="Overall Skill Match Score"
          value={`${calculatedMatchScore}%`}
          subtitle={`Calculated against ${skills.length} target market standards`}
          icon={Target}
          badgeText={calculatedMatchScore >= 75 ? 'Job Ready' : calculatedMatchScore >= 50 ? 'Moderate Fit' : 'Fresher Baseline'}
          badgeVariant={calculatedMatchScore >= 75 ? 'emerald' : calculatedMatchScore >= 50 ? 'blue' : 'amber'}
        />
        <MetricCard
          title="Critical Missing Skill Gaps"
          value={criticalGaps.length}
          subtitle="Immediate impact on employer shortlisting"
          icon={AlertTriangle}
          badgeText={`${criticalGaps.length} High Priority`}
          badgeVariant="amber"
        />
        <MetricCard
          title="Skills Meeting Employer Requirement"
          value={metSkills.length}
          subtitle="Verified matching competencies from resume"
          icon={CheckCircle2}
          badgeText={`${metSkills.length} Met`}
          badgeVariant="emerald"
        />
      </div>

      {/* TIER FILTERING & SEARCH CONTROLS */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-soft-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* TIER TABS */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setSelectedTier('ALL')}
              className={`px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedTier === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Skills ({skills.length})
            </button>
            <button
              onClick={() => setSelectedTier('TIER_1')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedTier === 'TIER_1'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-100/50'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              ★ Top 7 Core Mandates ({tier1Count})
            </button>
            <button
              onClick={() => setSelectedTier('TIER_2')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedTier === 'TIER_2'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-800 hover:bg-blue-100/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              ● Secondary High-Demand ({tier2Count})
            </button>
            <button
              onClick={() => setSelectedTier('TIER_3')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedTier === 'TIER_3'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-800 hover:bg-purple-100/50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              ✦ Specialized (21+) ({tier3Count})
            </button>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search required skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {/* STATUS QUICK FILTER CHIPS */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs font-bold">
          <span className="text-slate-400 font-semibold text-[11px] mr-1">Status Filter:</span>
          <button
            onClick={() => setSelectedSeverity('ALL')}
            className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
              selectedSeverity === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Status ({skills.length})
          </button>
          <button
            onClick={() => setSelectedSeverity('Met')}
            className={`px-2.5 py-1 rounded-md text-[11px] border transition-all cursor-pointer flex items-center gap-1 ${
              selectedSeverity === 'Met'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Meets Requirement ({metSkills.length})
          </button>
          <button
            onClick={() => setSelectedSeverity('Partial')}
            className={`px-2.5 py-1 rounded-md text-[11px] border transition-all cursor-pointer flex items-center gap-1 ${
              selectedSeverity === 'Partial'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Partial Gap ({partialGaps.length})
          </button>
          <button
            onClick={() => setSelectedSeverity('Critical')}
            className={`px-2.5 py-1 rounded-md text-[11px] border transition-all cursor-pointer flex items-center gap-1 ${
              selectedSeverity === 'Critical'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Critical Gap ({criticalGaps.length})
          </button>
        </div>
      </div>

      {/* DETAILED SKILL COMPARISON MATRIX */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Your Skill vs Employer Requirement Grid</h3>
            <p className="text-xs text-slate-500 font-medium">Showing {filteredSkills.length} of {skills.length} industry competency standards</p>
          </div>
        </div>

        {filteredSkills.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No matching skills found for the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSkills.map((sk) => (
              <SkillComparison key={sk.id} skill={sk} onAddToRoadmap={addSkillToRoadmap} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
