'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { SkillComparison } from '@/components/features/SkillComparison';
import { MetricCard } from '@/components/ui/MetricCard';
import { Target, CheckCircle2, AlertTriangle, Plus, Sparkles, Map, Lightbulb } from 'lucide-react';

export default function SkillGapPage() {
  const { skills, profile, addSkillToRoadmap, activeRole, openAiDrawerWithTopic } = useApp();

  const criticalGaps = skills.filter((s) => s.gapSeverity === 'Critical');
  const metSkills = skills.filter((s) => s.gapSeverity === 'Met');

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Skill Gap Analysis</h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Compare your current skill levels with employer expectations for <strong className="text-slate-900">{activeRole}</strong>.
          </p>
        </div>

        <button
          onClick={() => openAiDrawerWithTopic('Skill Gap Prioritization Strategy')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-brand-600" />
          Ask AI Gap Strategy
        </button>
      </div>

      {/* INTUITION GUIDANCE BANNER */}
      <div className="p-4 rounded-2xl bg-brand-50/80 border border-brand-200 text-xs text-slate-700 flex items-start gap-3 shadow-soft-sm">
        <Lightbulb className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-brand-900 text-sm font-extrabold block">💡 Skill Gap Analysis — What this page answers for you:</strong>
          <p className="leading-relaxed">
            This page compares your level against employer requirements so you instantly see <strong>what skills you already meet (Green)</strong>, <strong>what skills you partially have (Amber)</strong>, and <strong>critical missing skills (Red)</strong>. Click <em>"Add to Career Roadmap"</em> on any gap to start learning.
          </p>
        </div>
      </div>

      {/* SKILL GAP SCORE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          title="Overall Skill Match Score"
          value={`${profile?.readinessScore || 72}%`}
          subtitle={`Calculated against ${skills.length} target market standards`}
          icon={Target}
          badgeText="72% Prepared"
          badgeVariant="blue"
        />
        <MetricCard
          title="Critical Missing Skill Gaps"
          value={criticalGaps.length}
          subtitle="Immediate impact on employer shortlisting"
          icon={AlertTriangle}
          badgeText="High Priority"
          badgeVariant="amber"
        />
        <MetricCard
          title="Skills Meeting Employer Requirement"
          value={metSkills.length}
          subtitle="Verified matching competencies"
          icon={CheckCircle2}
          badgeText="8 Met"
          badgeVariant="emerald"
        />
      </div>

      {/* DETAILED SKILL COMPARISON MATRIX */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Your Skill vs Employer Requirement Grid</h3>
            <p className="text-xs text-slate-500 font-medium">Your current level compared side-by-side with required levels</p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Meets Requirement
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Partial Gap
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical Gap
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skills.map((sk) => (
            <SkillComparison key={sk.id} skill={sk} onAddToRoadmap={addSkillToRoadmap} />
          ))}
        </div>
      </div>
    </div>
  );
}
