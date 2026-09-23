'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { RoadmapTimeline } from '@/components/features/RoadmapTimeline';
import { RotateCcw, Sparkles } from 'lucide-react';

export default function CareerRoadmapPage() {
  const { roadmap, toggleRoadmapStatus, activeRole, deleteRoadmapItem, resetRoadmapForRole } = useApp();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = () => {
    if (confirm(`Do you want to regenerate the tailored roadmap for ${activeRole}? Any manual progress on this roadmap will be reset.`)) {
      setIsRegenerating(true);
      resetRoadmapForRole(activeRole);
      setTimeout(() => setIsRegenerating(false), 500);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Personalized Learning Roadmap</h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
            Your step-by-step learning sequence designed to bridge missing skill gaps for <span className="font-semibold text-slate-900">{activeRole}</span>.
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-sky-700 hover:border-sky-300 hover:bg-sky-50/50 shadow-soft-sm text-sm font-semibold transition-all cursor-pointer shrink-0 disabled:opacity-50"
          title={`Regenerate dynamic roadmap for ${activeRole}`}
        >
          <RotateCcw className={`w-4 h-4 text-sky-600 ${isRegenerating ? 'animate-spin' : ''}`} />
          <span>Regenerate for {activeRole}</span>
        </button>
      </div>

      {/* INTUITION GUIDANCE BANNER */}
      <div className="p-5 sm:p-6 rounded-3xl bg-sky-50/70 border border-sky-200 text-sm text-slate-700 shadow-soft-sm">
        <div className="space-y-1.5">
          <h3 className="text-slate-900 text-sm sm:text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            Personalized Roadmap — What this page does for you
          </h3>
          <p className="text-slate-600 leading-relaxed font-normal">
            Instead of getting overwhelmed, this page organizes your learning into 4 clear stages (Foundation → Core Skills → Industry Skills → Job Ready). As you complete courses and projects, click &ldquo;Mark Done&rdquo; to update your readiness score in real time. You can remove any milestone with the trash icon or regenerate the roadmap if your target role changes.
          </p>
        </div>
      </div>

      {/* VISUAL 4-STAGE ROADMAP TIMELINE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-sky-200 shadow-soft-sm">
        <RoadmapTimeline
          items={roadmap}
          onToggleStatus={toggleRoadmapStatus}
          onDeleteItem={deleteRoadmapItem}
        />
      </div>
    </div>
  );
}
