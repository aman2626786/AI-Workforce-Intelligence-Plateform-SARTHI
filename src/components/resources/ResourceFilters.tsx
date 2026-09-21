'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface ResourceFiltersProps {
  selectedType: string;
  onSelectType: (type: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedSkill: string;
  onSelectSkill: (skill: string) => void;
  selectedTag?: string;
  onSelectTag?: (tag: string) => void;
  onResetFilters: () => void;
  totalResults?: number;
  className?: string;
}

const RESOURCE_TYPES = [
  { id: 'ALL', label: 'All Resources' },
  { id: 'INDUSTRY_NEWS', label: 'Industry News' },
  { id: 'RESEARCH_PAPER', label: 'Research Papers' },
  { id: 'LEARNING_RESOURCE', label: 'Learning Resources' },
  { id: 'TECH_UPDATE', label: 'Tech Updates' },
  { id: 'OPPORTUNITY', label: 'Opportunities' },
];

const CATEGORIES = [
  'All',
  'Technology',
  'Research',
  'Career',
  'Learning',
];

const POPULAR_SKILLS = [
  'Python',
  'Machine Learning',
  'SQL',
  'React',
  'Data Analysis',
  'Deep Learning',
  'Docker',
  'FastAPI',
  'Power BI',
  'PostgreSQL',
  'C++',
  'Git',
];

const POPULAR_TAGS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Python',
  'PyTorch',
  'System Design',
  'LLM',
  'Tech News',
  'Transformers',
  'Data Science',
];

export const ResourceFilters: React.FC<ResourceFiltersProps> = ({
  selectedType,
  onSelectType,
  selectedCategory,
  onSelectCategory,
  selectedSkill,
  onSelectSkill,
  selectedTag = '',
  onSelectTag,
  onResetFilters,
  totalResults,
  className = '',
}) => {
  const hasActiveFilters =
    selectedType !== 'ALL' ||
    selectedCategory !== 'All' ||
    Boolean(selectedSkill) ||
    Boolean(selectedTag);

  const activeFilterCount = [
    selectedType !== 'ALL',
    selectedCategory !== 'All',
    Boolean(selectedSkill),
    Boolean(selectedTag),
  ].filter(Boolean).length;

  return (
    <div className={`bg-white rounded-2xl border border-sky-100/90 shadow-sm p-5 space-y-5 ${className}`}>
      {/* Header & Reset Button */}
      <div className="flex items-center justify-between pb-3.5 border-b border-sky-100">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Refine Catalog</h4>
          {typeof totalResults === 'number' && (
            <span className="text-xs text-slate-500 font-normal">
              {totalResults} items available
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs font-semibold text-sky-600 hover:text-sky-800 hover:bg-sky-50 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset ({activeFilterCount})</span>
          </button>
        )}
      </div>

      {/* 1. Resource Types */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Resource Type
        </div>
        <div className="space-y-1.5">
          {RESOURCE_TYPES.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => onSelectType(type.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs font-semibold'
                    : 'bg-white text-slate-700 font-medium border-transparent hover:border-sky-200 hover:bg-sky-50/70 hover:text-sky-700'
                }`}
              >
                <span>{type.label}</span>
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Category Domain */}
      <div className="space-y-3 pt-3 border-t border-sky-100/80">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Category
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-sm transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs font-semibold'
                    : 'bg-white text-slate-700 font-medium border-sky-100 hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50/70'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Filter by Skill */}
      <div className="space-y-3 pt-3 border-t border-sky-100/80">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Popular Skills
          </div>
          {selectedSkill && (
            <button
              onClick={() => onSelectSkill('')}
              className="text-xs text-sky-600 hover:underline font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SKILLS.map((skill) => {
            const isSelected = selectedSkill.toLowerCase() === skill.toLowerCase();
            return (
              <button
                key={skill}
                onClick={() => onSelectSkill(isSelected ? '' : skill)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs scale-105'
                    : 'bg-sky-50/60 text-slate-700 border-sky-100 hover:border-sky-300 hover:text-sky-700 hover:bg-sky-100/70 hover:scale-105'
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Filter by Tag / Hashtag */}
      <div className="space-y-3 pt-3 border-t border-sky-100/80">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <span>Tags & Hashtags</span>
          </div>
          {selectedTag && onSelectTag && (
            <button
              onClick={() => onSelectTag('')}
              className="text-xs text-sky-600 hover:underline font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        {onSelectTag && (
          <input
            value={selectedTag}
            onChange={(e) => onSelectTag(e.target.value.replace(/^#/, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSelectTag(e.currentTarget.value.replace(/^#/, '').trim());
            }}
            placeholder="Filter by any hashtag..."
            className="w-full rounded-xl border border-sky-200 bg-sky-50/40 px-3 py-2 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        )}
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TAGS.map((tag) => {
            const clean = tag.replace(/^#/, '');
            const isSelected = selectedTag.toLowerCase().replace(/^#/, '') === clean.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => onSelectTag && onSelectTag(isSelected ? '' : clean)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs scale-105'
                    : 'bg-white text-slate-700 border-sky-200/80 hover:border-sky-300 hover:text-sky-800 hover:bg-sky-50 shadow-2xs hover:scale-105'
                }`}
              >
                #{clean.replace(/\s+/g, '')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
