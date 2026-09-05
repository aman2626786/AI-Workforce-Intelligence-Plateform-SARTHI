'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { RoadmapTimeline } from '@/components/features/RoadmapTimeline';
import { Sparkles, Map, CheckCircle2, Clock, Lightbulb } from 'lucide-react';

export default function CareerRoadmapPage() {
  const { roadmap, toggleRoadmapStatus, activeRole, openAiDrawerWithTopic } = useApp();

  const completedCount = roadmap.filter((i) => i.status === 'Completed').length;
  const progressPercent = Math.round((completedCount / roadmap.length) * 100);
  const totalHours = roadmap.reduce((acc, curr) => acc + curr.estimatedHours, 0);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Personalized Learning Roadmap</h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Your step-by-step learning sequence designed to bridge missing skill gaps for <strong className="text-slate-900">{activeRole}</strong>.
          </p>
        </div>

        <button
          onClick={() => openAiDrawerWithTopic('Roadmap Pacing Strategy')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-brand-600" />
          Ask AI Roadmap Advice
        </button>
      </div>

      {/* INTUITION GUIDANCE BANNER */}
      <div className="p-4 rounded-2xl bg-brand-50/80 border border-brand-200 text-xs text-slate-700 flex items-start gap-3 shadow-soft-sm">
        <Lightbulb className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-brand-900 text-sm font-extrabold block">💡 Personalized Roadmap — What this page does for you:</strong>
          <p className="leading-relaxed">
            Instead of getting overwhelmed, this page organizes your learning into <strong>4 clear stages</strong> (Foundation → Core Skills → Industry Skills → Job Ready). As you complete courses and projects, click <em>"Mark Done"</em> to update your readiness score in real time.
          </p>
        </div>
      </div>

      {/* ROADMAP OVERALL PROGRESS CARD */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200 flex items-center gap-1">
              <Map className="w-3.5 h-3.5 text-brand-600" />
              Learning Progress Tracker
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-900">
            {completedCount} of {roadmap.length} Skill Modules Completed
          </h3>

          {/* Progress bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-xs text-slate-500 font-medium pt-1">
            Overall Roadmap Completion: <strong className="text-brand-600 font-extrabold">{progressPercent}%</strong>
          </p>
        </div>

        <div className="flex items-center gap-6 divide-x divide-slate-100 shrink-0">
          <div className="text-center px-4">
            <span className="text-xs font-bold uppercase text-slate-400">Total Learning Hours</span>
            <div className="text-2xl font-black text-slate-900 flex items-center justify-center gap-1 mt-0.5">
              <Clock className="w-5 h-5 text-brand-600" />
              ~{totalHours} hrs
            </div>
          </div>

          <div className="text-center px-4">
            <span className="text-xs font-bold uppercase text-slate-400">Target Career Role</span>
            <div className="text-base font-extrabold text-slate-800 mt-1">{activeRole}</div>
          </div>
        </div>
      </div>

      {/* VISUAL 4-STAGE ROADMAP TIMELINE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm">
        <RoadmapTimeline items={roadmap} onToggleStatus={toggleRoadmapStatus} />
      </div>
    </div>
  );
}
