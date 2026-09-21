import React from 'react';
import { IndustrySkill } from '@/data/skills';
import { CheckCircle2, AlertTriangle, XCircle, Plus, ArrowRight, Check } from 'lucide-react';

interface SkillComparisonProps {
  skill: IndustrySkill;
  onAddToRoadmap?: (skill: IndustrySkill) => void;
  isInRoadmap?: boolean;
}

export const SkillComparison: React.FC<SkillComparisonProps> = ({
  skill,
  onAddToRoadmap,
  isInRoadmap = false,
}) => {
  const getLevelNumeric = (level: string) => {
    switch (level) {
      case 'Advanced': return 3;
      case 'Intermediate': return 2;
      case 'Basic': return 1;
      default: return 0;
    }
  };

  const studentNum = getLevelNumeric(skill.studentLevel);
  const requiredNum = getLevelNumeric(skill.requiredLevel);

  let statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let badgeIcon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  let gapLabel = 'Meets Requirement';
  let barColor = 'bg-emerald-500';

  if (skill.gapSeverity === 'Critical') {
    statusColor = 'bg-rose-50 text-rose-700 border-rose-200';
    badgeIcon = <XCircle className="w-4 h-4 text-rose-600" />;
    gapLabel = 'Critical Gap';
    barColor = 'bg-rose-500';
  } else if (skill.gapSeverity === 'Partial') {
    statusColor = 'bg-sky-50 text-sky-700 border-sky-200';
    badgeIcon = <AlertTriangle className="w-4 h-4 text-sky-600" />;
    gapLabel = 'Partial Gap';
    barColor = 'bg-sky-500';
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-sky-200 shadow-soft-sm hover:border-sky-300 hover:shadow-soft-md transition-all flex flex-col justify-between gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {skill.tierRank && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                skill.tierRank <= 7
                  ? 'bg-sky-100 text-sky-800 border border-sky-200'
                  : 'bg-sky-50 text-sky-700 border border-sky-200'
              }`}>
                {skill.tierRank <= 7 ? `★ Core Mandate #${skill.tierRank}` : skill.tierRank <= 20 ? `● Secondary #${skill.tierRank}` : `✦ Specialized #${skill.tierRank}`}
              </span>
            )}
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{skill.category}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${statusColor} flex items-center gap-1.5`}>
              {badgeIcon}
              {gapLabel}
            </span>
          </div>
          <h4 className="text-base sm:text-lg font-bold text-slate-900">{skill.name}</h4>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs sm:text-sm font-semibold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
            {skill.demandPercentage}% Demand
          </span>
          <p className="text-xs text-slate-500 mt-1 font-medium">Priority: {skill.priority}</p>
        </div>
      </div>

      {/* Levels Comparison Bar */}
      <div className="space-y-2 py-1">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Your Level: <span className="text-slate-900 font-semibold">{skill.studentLevel}</span></span>
          <span className="flex items-center gap-1 text-slate-400 text-xs font-medium">
            Target <ArrowRight className="w-3.5 h-3.5" />
          </span>
          <span>Required: <span className="text-sky-600 font-semibold">{skill.requiredLevel}</span></span>
        </div>

        <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${(studentNum / 3) * 100}%` }}
          />
          {/* Target marker line */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-slate-900 rounded-full z-10"
            style={{ left: `${(requiredNum / 3) * 100}%` }}
            title={`Required: ${skill.requiredLevel}`}
          />
        </div>
      </div>

      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
        {skill.description}
      </p>

      {/* Action CTA */}
      {onAddToRoadmap && skill.gapSeverity !== 'Met' && (
        isInRoadmap ? (
          <div className="w-full py-2.5 px-3 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-sm font-semibold flex items-center justify-center gap-2 cursor-default select-none transition-all">
            <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>Added to Career Roadmap</span>
          </div>
        ) : (
          <button
            onClick={() => onAddToRoadmap(skill)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-sky-600 active:bg-slate-950 text-white text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add to Career Roadmap
          </button>
        )
      )}
    </div>
  );
};
