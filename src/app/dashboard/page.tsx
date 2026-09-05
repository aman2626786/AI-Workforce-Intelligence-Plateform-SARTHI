'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { CareerReadinessCard } from '@/components/features/CareerReadinessCard';
import { ProgressCard } from '@/components/ui/ProgressCard';
import { TrendChart } from '@/components/features/TrendChart';
import { JobDetailModal } from '@/components/features/JobDetailModal';
import { JobMatch } from '@/data/jobs';
import {
  TrendingUp,
  Target,
  Map,
  Briefcase,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';

export default function DashboardHome() {
  const { profile, skills, industryOverview, jobs, activeRole, activeLocation } = useApp();
  const [selectedJobModal, setSelectedJobModal] = useState<JobMatch | null>(null);

  // Top 3 Skill Gaps
  const topGaps = skills.filter((s) => s.gapSeverity !== 'Met').slice(0, 3);
  const topPriorityGap = topGaps[0];
  const previewJobs = jobs.slice(0, 3);

  const currentRole = profile?.targetRole || activeRole || 'Robotics Engineer';
  const candidateName = profile?.name ? profile.name.split(' ')[0] : 'Candidate';

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight" suppressHydrationWarning>
            Welcome back, {candidateName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1" suppressHydrationWarning>
            Building your personalized {currentRole} career trajectory step by step.
          </p>
        </div>

        <Link
          href="/dashboard/industry-skills"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-soft-sm transition-all"
        >
          <Sparkles className="w-4 h-4 text-brand-600" />
          Explore Industry Intelligence
        </Link>
      </div>

      {/* CAREER GOAL CARD */}
      <CareerReadinessCard
        role={currentRole}
        location={profile?.targetLocation || activeLocation}
        company={profile?.targetCompany || 'Open to Top Employers'}
        readinessScore={profile?.readinessScore || 82}
      />

      {/* NEXT BEST ACTION - STANDOUT CARD */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white shadow-soft-lg border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-extrabold tracking-wide uppercase flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              What Should I Do Next?
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white" suppressHydrationWarning>
            {topPriorityGap
              ? `Complete your ${topPriorityGap.name} learning module to improve your ${currentRole} readiness.`
              : `You have strong alignment for ${currentRole}! Explore live job opportunities.`}
          </h3>
          <p className="text-xs text-slate-300 font-medium" suppressHydrationWarning>
            {topPriorityGap
              ? `${topPriorityGap.name} is demanded in ${topPriorityGap.demandPercentage}% of active ${currentRole} roles. Completing this node boosts your score by +12%.`
              : `Your verified profile satisfies the mandatory technical requirements across industry job postings.`}
          </p>
        </div>

        <Link
          href="/dashboard/roadmap"
          className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs shadow-lg shadow-brand-600/30 transition-all flex items-center gap-2 shrink-0 hover:scale-105 cursor-pointer"
        >
          Start Roadmap
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* MY PROGRESS (4 CARDS) */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">My Progress Overview</h3>
          <span className="text-xs text-slate-500 font-medium">Live Intelligence Sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ProgressCard
            title="Industry Skills"
            percentage={skills.length > 0 ? Math.round((skills.filter((s) => s.gapSeverity === 'Met').length / skills.length) * 100) : 75}
            icon={TrendingUp}
            color="blue"
            subtitle={`${skills.filter((s) => s.gapSeverity === 'Met').length} of ${skills.length} verified`}
          />
          <ProgressCard
            title="Career Readiness"
            percentage={profile?.readinessScore || 82}
            icon={Target}
            color="emerald"
            subtitle="Calculated on live JD weights"
          />
          <ProgressCard
            title="Career Roadmap"
            percentage={65}
            icon={Map}
            color="purple"
            subtitle="4 core milestones active"
          />
          <ProgressCard
            title="Job Readiness"
            percentage={previewJobs.length > 0 ? previewJobs[0].matchScore : 88}
            icon={Briefcase}
            color="amber"
            subtitle={`Top Match: ${previewJobs.length > 0 ? previewJobs[0].matchScore : 88}%`}
          />
        </div>
      </div>

      {/* TWO COLUMN SECTION: TOP SKILL GAPS & TREND PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TOP SKILL GAPS */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Top Skill Gaps</h3>
                <p className="text-xs text-slate-500 font-medium">Highest priority missing requirements for {currentRole}</p>
              </div>
              <Link
                href="/dashboard/skill-gap"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                View All Gaps <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {topGaps.map((gap) => (
                <div
                  key={gap.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{gap.name}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                          gap.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {gap.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Current: <strong className="text-slate-800">{gap.studentLevel}</strong> → Required:{' '}
                      <strong className="text-brand-600">{gap.requiredLevel}</strong>
                    </p>
                  </div>

                  <Link
                    href="/dashboard/skill-gap"
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-brand-600 hover:text-white text-brand-600 border border-brand-200 text-xs font-bold transition-all shrink-0"
                  >
                    View Gap
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* INDUSTRY TREND PREVIEW CHART */}
        {industryOverview && <TrendChart data={industryOverview.trendData} />}
      </div>

      {/* JOB READINESS PREVIEW */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Jobs You Are Closest To</h3>
            <p className="text-xs text-slate-500 font-medium">Based on your verified skills & target {currentRole} signals</p>
          </div>

          <Link
            href="/dashboard/job-readiness"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all self-start sm:self-auto"
          >
            Explore Job Readiness
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {previewJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedJobModal(job)}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-brand-300 hover:bg-white cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{job.companyName}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
                  {job.matchScore}% Match
                </span>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {job.jobTitle}
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{job.location}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{job.matchedSkillsCount}/{job.totalRequiredSkillsCount} Skills matched</span>
                <span className="text-brand-600 font-bold group-hover:underline">View Match</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal View for Job Detail */}
      <JobDetailModal
        job={selectedJobModal}
        isOpen={!!selectedJobModal}
        onClose={() => setSelectedJobModal(null)}
      />
    </div>
  );
}
