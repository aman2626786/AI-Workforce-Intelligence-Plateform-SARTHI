import React from 'react';
import { IndustrySkill } from '@/data/skills';
import { CheckCircle2, AlertTriangle, XCircle, Plus, ArrowRight } from 'lucide-react';

interface SkillComparisonProps {
  skill: IndustrySkill;
  onAddToRoadmap?: (skill: IndustrySkill) => void;
}

export const SkillComparison: React.FC<SkillComparisonProps> = ({ skill, onAddToRoadmap }) => {
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
    statusColor = 'bg-amber-50 text-amber-700 border-amber-200';
    badgeIcon = <AlertTriangle className="w-4 h-4 text-amber-600" />;
    gapLabel = 'Partial Gap';
    barColor = 'bg-amber-500';
  }

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {skill.tierRank && (
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                skill.tierRank <= 7
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : skill.tierRank <= 20
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-purple-100 text-purple-800 border border-purple-200'
              }`}>
                {skill.tierRank <= 7 ? `★ Core Mandate #${skill.tierRank}` : skill.tierRank <= 20 ? `● Secondary #${skill.tierRank}` : `✦ Specialized #${skill.tierRank}`}
              </span>
            )}
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{skill.category}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${statusColor} flex items-center gap-1`}>
              {badgeIcon}
              {gapLabel}
            </span>
          </div>
          <h4 className="text-base font-extrabold text-slate-900">{skill.name}</h4>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">
            {skill.demandPercentage}% Demand
          </span>
          <p className="text-[10px] text-slate-400 mt-1 font-semibold">Priority: {skill.priority}</p>
        </div>
      </div>

      {/* Levels Comparison Bar */}
      <div className="space-y-2 py-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Your Level: <strong className="text-slate-900">{skill.studentLevel}</strong></span>
          <span className="flex items-center gap-1 text-slate-400">
            Target <ArrowRight className="w-3 h-3" />
          </span>
          <span>Required: <strong className="text-brand-600">{skill.requiredLevel}</strong></span>
        </div>

        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
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

      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        {skill.description}
      </p>

      {/* Action CTA */}
      {onAddToRoadmap && skill.gapSeverity !== 'Met' && (
        <button
          onClick={() => onAddToRoadmap(skill)}
          className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add to Career Roadmap
        </button>
      )}
    </div>
  );
};
