'use client';

import React from 'react';
import { RoadmapItem } from '@/data/roadmap';
import { CheckCircle2, Clock, Sparkles, ArrowRight, BookOpen } from 'lucide-react';

interface RoadmapTimelineProps {
  items: RoadmapItem[];
  onToggleStatus: (id: string) => void;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ items, onToggleStatus }) => {
  const stages: ('FOUNDATION' | 'CORE SKILLS' | 'INDUSTRY SKILLS' | 'JOB READY')[] = [
    'FOUNDATION',
    'CORE SKILLS',
    'INDUSTRY SKILLS',
    'JOB READY',
  ];

  const stageDescriptions = {
    'FOUNDATION': 'Core Database Queries, Math & Data Wrangling Foundations',
    'CORE SKILLS': 'Business Intelligence, Advanced Analytics & Visual Reporting',
    'INDUSTRY SKILLS': 'Cloud Architecture, Generative AI & Enterprise Tools',
    'JOB READY': 'Capstone Portfolio Projects & Mock Industry Technical Assessments',
  };

  return (
    <div className="space-y-8">
      {stages.map((stageName, stageIdx) => {
        const stageItems = items.filter((item) => item.stage === stageName);
        const completedInStage = stageItems.filter((item) => item.status === 'Completed').length;
        const totalInStage = stageItems.length;

        return (
          <div key={stageName} className="relative pl-6 md:pl-8 border-l-2 border-brand-200 last:border-l-0 pb-6">
            {/* Stage Indicator Node */}
            <div className="absolute -left-3.5 top-0 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-md">
              {stageIdx + 1}
            </div>

            {/* Stage Header */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{stageName}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {completedInStage}/{totalInStage} Completed
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{stageDescriptions[stageName]}</p>
              </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stageItems.map((item) => {
                const isCompleted = item.status === 'Completed';
                const isInProgress = item.status === 'In Progress';

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCompleted
                        ? 'bg-emerald-50/50 border-emerald-200 shadow-soft-sm'
                        : isInProgress
                        ? 'bg-white border-brand-300 shadow-soft-md ring-2 ring-brand-500/10'
                        : 'bg-white border-slate-200 shadow-soft-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                          item.priority === 'Critical' ? 'bg-rose-100 text-rose-700' : 'bg-brand-100 text-brand-700'
                        }`}>
                          {item.priority} Priority
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 mt-1">{item.skillName}</h4>
                      </div>

                      <button
                        onClick={() => onToggleStatus(item.id)}
                        className={`p-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-600 hover:text-emerald-600'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isCompleted ? 'Done' : 'Mark Done'}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 font-medium">
                      <span className="flex items-center gap-1">
                        Level: <strong className="text-slate-800">{item.currentLevel}</strong>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <strong className="text-brand-600">{item.targetLevel}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        ~{item.estimatedHours} hrs
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {item.learningObjective}
                    </p>

                    {/* Resources */}
                    {item.recommendedResources.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-brand-600" /> Recommended Resource
                        </div>
                        {item.recommendedResources.map((res, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-slate-700 font-medium">
                            <span className="truncate hover:text-brand-600 cursor-pointer">{res.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">{res.estTime}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
