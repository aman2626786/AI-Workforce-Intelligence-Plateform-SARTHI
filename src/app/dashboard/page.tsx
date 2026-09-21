'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { CareerReadinessCard } from '@/components/features/CareerReadinessCard';
import { ProgressCard } from '@/components/ui/ProgressCard';
import { ArrowRight } from 'lucide-react';

export default function DashboardHome() {
  const { profile, skills, roadmap, activeRole, activeLocation } = useApp();

  // Top 3 Skill Gaps
  const topGaps = skills.filter((s) => s.gapSeverity !== 'Met').slice(0, 3);
  const topPriorityGap = topGaps[0];
  const upcomingMilestones = roadmap.filter((r) => r.status !== 'Completed').slice(0, 3);

  const currentRole = profile?.targetRole || activeRole || 'Data Scientist';
  const candidateName = profile?.name ? profile.name.split(' ')[0] : 'Candidate';

  // Live weighted readiness score aligned with Skill Gap Intelligence
  const liveReadinessScore = React.useMemo(() => {
    if (skills && skills.length > 0) {
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
    }
    return profile?.readinessScore ?? 0;
  }, [skills, profile?.readinessScore]);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight" suppressHydrationWarning>
            Welcome back, {candidateName}
          </h1>
          <p className="text-sm text-slate-600 mt-1" suppressHydrationWarning>
            Building your personalized {currentRole} career trajectory step by step.
          </p>
        </div>

        <Link
          href="/dashboard/industry-skills"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-sm font-semibold text-slate-800 shadow-2xs hover:border-sky-300 transition-all cursor-pointer"
        >
          Explore Industry Intelligence
        </Link>
      </div>

      {/* CAREER GOAL CARD */}
      <CareerReadinessCard
        role={currentRole}
        location={profile?.targetLocation || activeLocation}
        company={profile?.targetCompany || 'Open to Top Employers'}
        readinessScore={liveReadinessScore}
      />

      {/* RECOMMENDED NEXT STEP - FRESH, AIRY RIBBON BANNER */}
      <div className="p-5 sm:p-6 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white text-sky-700 text-xs font-semibold uppercase tracking-wider border border-sky-200 shadow-2xs">
              Recommended Next Step
            </span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900" suppressHydrationWarning>
            {topPriorityGap
              ? `Complete your ${topPriorityGap.name} learning module to improve your ${currentRole} readiness.`
              : `You have strong alignment for ${currentRole}! Continue with your active roadmap.`}
          </h3>
          <p className="text-sm text-slate-600" suppressHydrationWarning>
            {topPriorityGap
              ? `${topPriorityGap.name} is demanded in ${topPriorityGap.demandPercentage}% of active ${currentRole} roles. Completing this module accelerates readiness.`
              : `Your verified profile satisfies the mandatory technical requirements across industry job postings.`}
          </p>
        </div>

        <Link
          href="/dashboard/roadmap"
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-slate-900 text-white font-semibold text-sm shadow-sm shadow-sky-600/20 transition-all flex items-center gap-2 shrink-0 self-start md:self-center cursor-pointer"
        >
          Start Roadmap
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* MY PROGRESS (3 BALANCED CARDS) */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">My Progress Overview</h3>
          <span className="text-xs text-slate-500 font-medium">Live Intelligence Sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <ProgressCard
            title="Industry Skills"
            percentage={skills.length > 0 ? Math.round((skills.filter((s) => s.gapSeverity === 'Met').length / skills.length) * 100) : 0}
            color="blue"
            subtitle={`${skills.filter((s) => s.gapSeverity === 'Met').length} of ${skills.length} verified`}
          />
          <ProgressCard
            title="Career Readiness"
            percentage={liveReadinessScore}
            color="emerald"
            subtitle="Calculated on live JD weights"
          />
          <ProgressCard
            title="Career Roadmap"
            percentage={roadmap.length > 0 ? Math.round((roadmap.filter((r) => r.status === 'Completed').length / roadmap.length) * 100) : 0}
            color="blue"
            subtitle={`${roadmap.filter((r) => r.status === 'Completed').length} of ${roadmap.length} milestones complete`}
          />
        </div>
      </div>

      {/* TWO COLUMN BALANCED SECTION: TOP SKILL GAPS & UPCOMING MILESTONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* TOP SKILL GAPS */}
        <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Top Skill Gaps</h3>
                <p className="text-sm text-slate-500">Missing requirements for {currentRole}</p>
              </div>
              <Link
                href="/dashboard/skill-gap"
                className="text-sm font-semibold text-sky-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {topGaps.map((gap) => (
                <div
                  key={gap.id}
                  className="p-4 rounded-xl bg-white border border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm sm:text-base text-slate-900">{gap.name}</span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          gap.priority === 'Critical'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}
                      >
                        {gap.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Current: <span className="text-slate-800 font-semibold">{gap.studentLevel}</span> → Required:{' '}
                      <span className="text-sky-600 font-semibold">{gap.requiredLevel}</span>
                    </p>
                  </div>

                  <Link
                    href="/dashboard/skill-gap"
                    className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-sky-600 hover:text-white text-sky-600 border border-sky-200 text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* UPCOMING ROADMAP MILESTONES */}
        <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Active Roadmap Milestones</h3>
                <p className="text-sm text-slate-500">Target milestones for {currentRole}</p>
              </div>
              <Link
                href="/dashboard/roadmap"
                className="text-sm font-semibold text-sky-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                View Roadmap <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingMilestones.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white border border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 transition-all flex items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.stage}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{item.estimatedHours} hrs est.</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                      {item.skillName}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      Target Level: <span className="font-medium text-slate-700">{item.targetLevel}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      item.status === 'In Progress'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {item.status}
                    </span>
                    <Link href="/dashboard/roadmap" className="text-xs text-sky-600 font-semibold group-hover:underline">
                      Learn
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
