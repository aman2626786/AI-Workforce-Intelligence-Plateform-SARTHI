'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { RoadmapTimeline } from '@/components/features/RoadmapTimeline';


export default function CareerRoadmapPage() {
  const { roadmap, toggleRoadmapStatus, activeRole } = useApp();

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Personalized Learning Roadmap</h1>
        <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
          Your step-by-step learning sequence designed to bridge missing skill gaps for {activeRole}.
        </p>
      </div>

      {/* INTUITION GUIDANCE BANNER */}
      <div className="p-5 sm:p-6 rounded-3xl bg-sky-50/70 border border-sky-200 text-sm text-slate-700 shadow-soft-sm">
        <div className="space-y-1.5">
          <h3 className="text-slate-900 text-sm sm:text-base font-semibold">Personalized Roadmap — What this page does for you</h3>
          <p className="text-slate-600 leading-relaxed font-normal">
            Instead of getting overwhelmed, this page organizes your learning into 4 clear stages (Foundation → Core Skills → Industry Skills → Job Ready). As you complete courses and projects, click &ldquo;Mark Done&rdquo; to update your readiness score in real time.
          </p>
        </div>
      </div>

      {/* VISUAL 4-STAGE ROADMAP TIMELINE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-sky-200 shadow-soft-sm">
        <RoadmapTimeline items={roadmap} onToggleStatus={toggleRoadmapStatus} />
      </div>
    </div>
  );
}
