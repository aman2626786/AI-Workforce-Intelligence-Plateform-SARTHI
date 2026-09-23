'use client';

import React from 'react';
import { RoadmapItem } from '@/data/roadmap';
import { CheckCircle2, Clock, Sparkles, ArrowRight, BookOpen, Trash2 } from 'lucide-react';

interface RoadmapTimelineProps {
  items: RoadmapItem[];
  onToggleStatus: (id: string) => void;
  onDeleteItem?: (id: string) => void;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ items, onToggleStatus, onDeleteItem }) => {
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
          <div key={stageName} className="relative pl-6 md:pl-8 border-l-2 border-sky-200 last:border-l-0 pb-8">
            {/* Stage Indicator Node */}
            <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center text-sm font-bold ring-4 ring-white shadow-xs">
              {stageIdx + 1}
            </div>

            {/* Stage Header */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{stageName}</h3>
                  <span className="text-xs sm:text-sm font-medium px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {completedInStage}/{totalInStage} Completed
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-normal mt-0.5">{stageDescriptions[stageName]}</p>
              </div>
            </div>

            {/* Items Grid */}
            {stageItems.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-medium italic">
                No active milestones in this stage. Add gaps from Skill Gap Analysis or regenerate roadmap.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stageItems.map((item) => {
                const isCompleted = item.status === 'Completed';
                const isInProgress = item.status === 'In Progress';

                return (
                  <div
                    key={item.id}
                    className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                      isCompleted
                        ? 'bg-emerald-50/40 border-emerald-200 shadow-soft-sm'
                        : isInProgress
                        ? 'bg-white border-sky-300 shadow-soft-sm ring-1 ring-sky-400/20'
                        : 'bg-white border-sky-200 shadow-soft-sm hover:border-sky-300 hover:shadow-soft-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                          item.priority === 'Critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {item.priority} Priority
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">{item.skillName}</h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onDeleteItem && (
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Remove from Roadmap"
                            aria-label={`Remove ${item.skillName} from roadmap`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onToggleStatus(item.id)}
                          className={`py-1.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50/50'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {isCompleted ? 'Done' : 'Mark Done'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-600 mb-3 font-medium">
                      <span className="flex items-center gap-1.5">
                        Level: <span className="text-slate-900 font-semibold">{item.currentLevel}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sky-600 font-semibold">{item.targetLevel}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-4 h-4 text-slate-400" />
                        ~{item.estimatedHours} hrs
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed mb-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 font-normal">
                      {item.learningObjective}
                    </p>

                    {/* Resources */}
                    {item.recommendedResources.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-sky-600" /> Recommended Resource
                        </div>
                        {item.recommendedResources.map((res, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs sm:text-sm text-slate-700 font-medium">
                            <span className="truncate hover:text-sky-600 transition-colors cursor-pointer">{res.title}</span>
                            <span className="text-xs text-slate-500 shrink-0 bg-slate-100 px-2 py-0.5 rounded-md font-medium border border-slate-200/60">{res.estTime}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
