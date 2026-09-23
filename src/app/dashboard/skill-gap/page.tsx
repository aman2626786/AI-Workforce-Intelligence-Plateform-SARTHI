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
  const { skills, profile, addSkillToRoadmap, activeRole, roadmap, isLoading } = useApp();

  const roadmapSkillKeys = useMemo(() => {
    return new Set(roadmap.map((r) => r.skillName.toLowerCase().replace(/[^a-z0-9]/g, '')));
  }, [roadmap]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'Met' | 'Partial' | 'Critical'>('ALL');

  const criticalGaps = useMemo(() => skills.filter((s) => s.gapSeverity === 'Critical'), [skills]);
  const partialGaps = useMemo(() => skills.filter((s) => s.gapSeverity === 'Partial'), [skills]);
  const metSkills = useMemo(() => skills.filter((s) => s.gapSeverity === 'Met'), [skills]);

  // Accurate weighted match score calculation without artificial 10% floor
  const calculatedMatchScore = useMemo(() => {
    if (!skills.length) {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`matchskill_score_${activeRole}`);
        if (cached) return Number(cached);
      }
      return profile?.readinessScore || 0;
    }
    let totalWeight = 0;
    let earnedWeight = 0;
    skills.forEach((s) => {
      const weight = s.priority === 'Critical' || s.priority === 'High' ? 3 : s.priority === 'Medium' ? 2 : 1;
      totalWeight += weight;
      if (s.studentLevel === 'Advanced') earnedWeight += weight * 1.0;
      else if (s.studentLevel === 'Intermediate') earnedWeight += weight * 0.65;
      else if (s.studentLevel === 'Basic') earnedWeight += weight * 0.35;
    });
    const score = Math.round((earnedWeight / Math.max(1, totalWeight)) * 100);
    if (typeof window !== 'undefined' && score > 0) {
      localStorage.setItem(`matchskill_score_${activeRole}`, String(score));
    }
    return score;
  }, [skills, profile?.readinessScore, activeRole]);

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Skill Gap Analysis</h1>
        <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
          Comparing your verified resume skills against {skills.length} market-demanded competencies for {activeRole}.
        </p>
      </div>

      {/* INTUITION GUIDANCE BANNER */}
      <div className="p-5 sm:p-6 rounded-3xl bg-sky-50/70 border border-sky-200 text-sm text-slate-700 shadow-soft-sm">
        <div className="space-y-1.5">
          <h3 className="text-slate-900 text-sm sm:text-base font-semibold">How Skill Gap Intelligence Works</h3>
          <p className="text-slate-600 leading-relaxed font-normal">
            Employer job descriptions demand Tier 1 Core Mandates (Top 7), Tier 2 High-Demand Secondary (8-20), and Tier 3 Specialized Tools. Your score is dynamically calculated by weighting verified proficiencies. Click &ldquo;Add to Career Roadmap&rdquo; on any gap to generate target learning milestones.
          </p>
        </div>
      </div>

      {/* SKILL GAP SCORE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          title="Overall Skill Match Score"
          value={`${calculatedMatchScore}%`}
          subtitle={`Calculated against ${skills.length} target market standards`}
          badgeText={calculatedMatchScore >= 75 ? 'Job Ready' : calculatedMatchScore >= 50 ? 'Moderate Fit' : 'Fresher Baseline'}
          badgeVariant={calculatedMatchScore >= 75 ? 'emerald' : 'blue'}
        />
        <MetricCard
          title="Critical Missing Skill Gaps"
          value={criticalGaps.length}
          subtitle="Immediate impact on employer shortlisting"
          badgeText={`${criticalGaps.length} High Priority`}
          badgeVariant="rose"
        />
        <MetricCard
          title="Skills Meeting Employer Requirement"
          value={metSkills.length}
          subtitle="Verified matching competencies from resume"
          badgeText={`${metSkills.length} Met`}
          badgeVariant="emerald"
        />
      </div>

      {/* TIER FILTERING & SEARCH CONTROLS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-sky-200 shadow-soft-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* TIER TABS */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl overflow-x-auto text-sm font-medium">
            <button
              onClick={() => setSelectedTier('ALL')}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedTier === 'ALL'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Skills ({skills.length})
            </button>
            <button
              onClick={() => setSelectedTier('TIER_1')}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedTier === 'TIER_1'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Top 7 Core Mandates ({tier1Count})
            </button>
            <button
              onClick={() => setSelectedTier('TIER_2')}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedTier === 'TIER_2'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Secondary High-Demand ({tier2Count})
            </button>
            <button
              onClick={() => setSelectedTier('TIER_3')}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedTier === 'TIER_3'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Specialized ({tier3Count})
            </button>
          </div>

          {/* SEARCH BOX */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gaps or tools..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-800"
            />
          </div>
        </div>

        {/* SEVERITY FILTER BADGES */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 flex-wrap text-xs sm:text-sm font-medium text-slate-600">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mr-1">Filter Gaps:</span>
          <button
            onClick={() => setSelectedSeverity('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              selectedSeverity === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            All Competencies ({skills.length})
          </button>
          <button
            onClick={() => setSelectedSeverity('Met')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedSeverity === 'Met'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Meets Requirement ({metSkills.length})
          </button>
          <button
            onClick={() => setSelectedSeverity('Partial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedSeverity === 'Partial'
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            Partial Gap ({partialGaps.length})
          </button>
          <button
            onClick={() => setSelectedSeverity('Critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedSeverity === 'Critical'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Critical Missing Gaps ({criticalGaps.length})
          </button>
        </div>
      </div>

      {/* DETAILED SKILL COMPARISON MATRIX */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Your Skill vs Employer Requirement Grid</h3>
            <p className="text-sm text-slate-600 font-medium">Showing {filteredSkills.length} of {skills.length} industry competency standards</p>
          </div>
        </div>

        {filteredSkills.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No matching skills found for the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSkills.map((sk) => (
              <SkillComparison
                key={sk.id}
                skill={sk}
                onAddToRoadmap={addSkillToRoadmap}
                isInRoadmap={roadmapSkillKeys.has(sk.name.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
