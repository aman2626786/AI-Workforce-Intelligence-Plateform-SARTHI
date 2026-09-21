'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FilterBar } from '@/components/ui/FilterBar';
import { SkillBadge } from '@/components/ui/SkillBadge';
import { AiInsightBadge } from '@/components/ui/AiInsightBadge';
import { CompanyProfileModal } from '@/components/features/CompanyProfileModal';
import { ResumeUploadModal } from '@/components/features/ResumeUploadModal';
import { CompanySkillCriteria } from '@/data/industry';
import {
  TrendingUp,
  Building2,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Zap,
  Layers,
  Search,
  Check,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  Upload,
  FileText,
  AlertCircle,
  Clock,
  Target,
  FileCheck,
} from 'lucide-react';

export default function IndustrySkillsPage() {
  const {
    profile,
    skills,
    industryOverview,
    activeRole,
    setActiveRole,
    activeLocation,
    setActiveLocation,
    openAiDrawerWithTopic,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'trends' | 'skillMapping'>('trends');
  const [selectedTimeframe, setSelectedTimeframe] = useState('Last 6 Months');
  const [selectedCompany, setSelectedCompany] = useState<CompanySkillCriteria | null>(null);

  const [skillSearch, setSkillSearch] = useState('');
  const [skillTierFilter, setSkillTierFilter] = useState<'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4'>('ALL');
  const [skillMatchFilter, setSkillMatchFilter] = useState<'ALL' | 'MATCHED' | 'PARTIAL' | 'GAP'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  // Skill-to-Company Mapping Filters
  const [mappingSearch, setMappingSearch] = useState('');
  const [mappingCategoryFilter, setMappingCategoryFilter] = useState('ALL');
  const [mappingReqFilter, setMappingReqFilter] = useState<'ALL' | 'MANDATORY' | 'PREFERRED'>('ALL');

  // Available unique categories
  const categoriesList = ['ALL', ...Array.from(new Set(skills.map((s) => s.category)))];

  // Mapping categories list
  const mappingCategories = ['ALL', ...Array.from(new Set((industryOverview?.skillCompanyMappings || []).map((m) => m.category)))];

  // Filtered Skill-to-Company Mappings
  const filteredSkillMappings = (industryOverview?.skillCompanyMappings || []).filter((item) => {
    const matchesSearch =
      item.skillName.toLowerCase().includes(mappingSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(mappingSearch.toLowerCase()) ||
      item.sampleCompanies.some((c) => c.name.toLowerCase().includes(mappingSearch.toLowerCase()));

    const matchesCategory = mappingCategoryFilter === 'ALL' || item.category === mappingCategoryFilter;

    let matchesReq = true;
    if (mappingReqFilter === 'MANDATORY') {
      matchesReq = item.sampleCompanies.some((c) => c.isMandatory);
    } else if (mappingReqFilter === 'PREFERRED') {
      matchesReq = item.sampleCompanies.some((c) => !c.isMandatory);
    }

    return matchesSearch && matchesCategory && matchesReq;
  });

  // Matched stats
  const metSkillsCount = skills.filter((s) => s.gapSeverity === 'Met').length;
  const partialSkillsCount = skills.filter((s) => s.gapSeverity === 'Partial').length;
  const gapSkillsCount = skills.filter((s) => s.gapSeverity === 'Critical').length;
  const totalResumeSkillsCount = profile?.skills?.length || 0;

  // Filtered skills index
  const filteredSkills = skills.filter((sk) => {
    const matchesSearch =
      sk.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
      sk.category.toLowerCase().includes(skillSearch.toLowerCase()) ||
      sk.description.toLowerCase().includes(skillSearch.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || sk.category === selectedCategory;

    let matchesTier = true;
    if (skillTierFilter === 'TIER_1') matchesTier = (sk.tierRank || 0) <= 10;
    else if (skillTierFilter === 'TIER_2') matchesTier = (sk.tierRank || 0) > 10 && (sk.tierRank || 0) <= 25;
    else if (skillTierFilter === 'TIER_3') matchesTier = (sk.tierRank || 0) > 25 && (sk.tierRank || 0) <= 38;
    else if (skillTierFilter === 'TIER_4') matchesTier = (sk.tierRank || 0) > 38;

    let matchesMatchStatus = true;
    if (skillMatchFilter === 'MATCHED') matchesMatchStatus = sk.gapSeverity === 'Met';
    else if (skillMatchFilter === 'PARTIAL') matchesMatchStatus = sk.gapSeverity === 'Partial';
    else if (skillMatchFilter === 'GAP') matchesMatchStatus = sk.gapSeverity === 'Critical';

    return matchesSearch && matchesCategory && matchesTier && matchesMatchStatus;
  });

  const tier1Count = skills.filter((s) => (s.tierRank || 0) <= 10).length;
  const tier2Count = skills.filter((s) => (s.tierRank || 0) > 10 && (s.tierRank || 0) <= 25).length;
  const tier3Count = skills.filter((s) => (s.tierRank || 0) > 25 && (s.tierRank || 0) <= 38).length;
  const tier4Count = skills.filter((s) => (s.tierRank || 0) > 38).length;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Industry Skill Intelligence
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
          Understand what employers are looking for in your target career ({activeRole}).
        </p>
      </div>

      {/* TOP FILTERS BAR - LOCATION REMOVED AS REQUESTED */}
      <FilterBar
        selectedRole={activeRole}
        onRoleChange={setActiveRole}
        hideLocation={true}
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={setSelectedTimeframe}
      />

      {/* RESUME SKILL MATCHING & LIVE ALIGNMENT STATUS CARD */}
      <div className="p-6 rounded-3xl bg-white border border-sky-200 shadow-soft-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs sm:text-sm font-semibold">
                Live Resume Intelligence Active
              </span>
              <span className="text-slate-300 text-sm">•</span>
              <span className="text-sm font-medium text-slate-600">
                {profile?.resume?.fileName || 'Extracted Resume File'}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Resume Skills Matched Against {activeRole} Standards
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              We cross-referenced your {totalResumeSkillsCount} verified resume skills against all {skills.length} industry competencies. Skills are categorized into fully matched, partial proficiencies, and missing employer gaps.
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
              <p className="text-2xl font-bold text-emerald-700">{metSkillsCount}</p>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mt-0.5">Matched</p>
            </div>
            <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 text-center">
              <p className="text-2xl font-bold text-sky-700">{partialSkillsCount}</p>
              <p className="text-xs font-semibold text-sky-800 uppercase tracking-wider mt-0.5">Partial</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-center">
              <p className="text-2xl font-bold text-rose-700">{gapSkillsCount}</p>
              <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider mt-0.5">Missing Gaps</p>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-sky-200/90 shadow-soft-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'trends'
              ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
              : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
          }`}
        >
          Skill Demand & Trends ({skills.length})
        </button>

        <button
          onClick={() => setActiveTab('skillMapping')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'skillMapping'
              ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
              : 'text-slate-600 hover:bg-slate-50 hover:text-sky-700'
          }`}
        >
          Skill-to-Company Mapping List
        </button>
      </div>

      {/* TAB 1: SKILL DEMAND & TRENDS */}
      {activeTab === 'trends' && (
        <div className="space-y-6 animate-fade-in">

          {/* SKILL DEMAND TABLE */}
          <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-soft-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Skill Demand Index (Ranked Spectrum)
                </h3>
                <p className="text-sm text-slate-500 font-normal mt-0.5">
                  Ranked by actual probability across active employer job postings & matched to your resume
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {skills.length} Total Competencies
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {metSkillsCount} Matched ({Math.round((metSkillsCount / Math.max(1, skills.length)) * 100)}%)
                </span>
              </div>
            </div>

            {/* SEARCH & FILTER CONTROLS PANEL */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              {/* ROW 1: PROMINENT SEARCH BAR + CATEGORY DROPDOWN */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search any skill across 40+ index (e.g. Python, SQL, Machine Learning)..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-2xs"
                  />
                  {skillSearch && (
                    <button
                      onClick={() => setSkillSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'ALL' ? `All Categories (${skills.length})` : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ROW 2: RESUME STATUS & TIER FILTERS (HIGH VISIBILITY & CONTRAST) */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                {/* RESUME ALIGNMENT */}
                <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 mr-1">Resume Status:</span>
                  <button
                    onClick={() => setSkillMatchFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      skillMatchFilter === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All ({skills.length})
                  </button>
                  <button
                    onClick={() => setSkillMatchFilter('MATCHED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      skillMatchFilter === 'MATCHED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Matched ({metSkillsCount})
                  </button>
                  <button
                    onClick={() => setSkillMatchFilter('PARTIAL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      skillMatchFilter === 'PARTIAL'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Partial Match ({partialSkillsCount})
                  </button>
                  <button
                    onClick={() => setSkillMatchFilter('GAP')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      skillMatchFilter === 'GAP'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Missing Gaps ({gapSkillsCount})
                  </button>
                </div>

                {/* TIER FILTER PILLS */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 mr-1">Tier:</span>
                  <button
                    onClick={() => setSkillTierFilter('ALL')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                      skillTierFilter === 'ALL'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Tiers
                  </button>
                  <button
                    onClick={() => setSkillTierFilter('TIER_1')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                      skillTierFilter === 'TIER_1'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Core (Top 10)
                  </button>
                  <button
                    onClick={() => setSkillTierFilter('TIER_2')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                      skillTierFilter === 'TIER_2'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Secondary (11-25)
                  </button>
                  <button
                    onClick={() => setSkillTierFilter('TIER_3')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                      skillTierFilter === 'TIER_3'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Emerging (26-38)
                  </button>
                  <button
                    onClick={() => setSkillTierFilter('TIER_4')}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                      skillTierFilter === 'TIER_4'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Specialized (39+)
                  </button>
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-xs border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5">Rank</th>
                    <th className="py-3 px-4">Skill & Focus</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Market Demand</th>
                    <th className="py-3 px-4">Trend</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Resume Status</th>
                    <th className="py-3 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {filteredSkills.map((sk) => (
                    <tr
                      key={sk.id}
                      className={`transition-colors ${
                        sk.gapSeverity === 'Met'
                          ? 'bg-emerald-50/30 hover:bg-emerald-50/60'
                          : sk.gapSeverity === 'Partial'
                          ? 'bg-sky-50/20 hover:bg-sky-50/50'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3.5 px-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                          #{(sk.tierRank || 0)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{sk.name}</div>
                        <div className="text-xs text-slate-500 line-clamp-1 max-w-xs mt-0.5 font-normal">{sk.description}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-sm font-normal">{sk.category}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-sky-600 rounded-full"
                              style={{ width: `${sk.demandPercentage}%` }}
                            />
                          </div>
                          <span className="font-semibold text-slate-900 text-sm">{sk.demandPercentage}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 text-sm">
                          {sk.trend === 'up' && <span className="text-emerald-600">↑ Growing</span>}
                          {sk.trend === 'rapid' && <span className="text-sky-600">↑↑ Rapid</span>}
                          {sk.trend === 'stable' && <span className="text-slate-600">→ Stable</span>}
                          {sk.trend === 'down' && <span className="text-rose-600">↓ Declining</span>}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            sk.priority === 'Critical'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {sk.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {sk.gapSeverity === 'Met' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                            Matched in Resume ({sk.studentLevel})
                          </span>
                        ) : sk.gapSeverity === 'Partial' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                            <Zap className="w-3.5 h-3.5 text-sky-600" />
                            Partial Match ({sk.studentLevel})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Missing Gap (Not in Resume)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <SkillBadge type={sk.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* EMERGING SKILLS CARDS GRID */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Emerging Skill Intelligence</h3>
                <p className="text-sm text-slate-500 font-normal mt-0.5">Fast-growing capabilities shifting employer expectations</p>
              </div>
              <AiInsightBadge label="Industry Signal" variant="blue" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {industryOverview?.emergingSkills.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-white border border-sky-100 shadow-soft-sm space-y-3 hover:shadow-soft-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        {item.status}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                        <Zap className="w-3 h-3" />
                        {item.growthRate}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">{item.name}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-normal">
                      {item.whyItMatters}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SKILL-TO-COMPANY MAPPING LIST */}
      {activeTab === 'skillMapping' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Banner Header */}
          <div className="p-6 rounded-3xl bg-sky-50/70 border border-sky-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-white text-xs font-semibold uppercase tracking-wider text-sky-800 border border-sky-200">
                Full Spectrum Hiring Intelligence
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                Which Companies Ask for Each {activeRole} Skill?
              </h3>
              <p className="text-sm text-slate-600 font-normal max-w-2xl">
                Explore all {industryOverview?.skillCompanyMappings.length || 0} industry competencies mapped to real hiring companies.
              </p>
            </div>

            {/* Search Input for Skills or Companies */}
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={mappingSearch}
                onChange={(e) => setMappingSearch(e.target.value)}
                placeholder="Search by skill or company name..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium border border-sky-200"
              />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-sky-100 shadow-soft-sm space-y-6">
            {/* Filter Bar Controls */}
            <div className="flex flex-col gap-3 pb-2 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto text-xs font-semibold">
                  <button
                    onClick={() => setMappingReqFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      mappingReqFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Skills ({industryOverview?.skillCompanyMappings.length || 0})
                  </button>
                  <button
                    onClick={() => setMappingReqFilter('MANDATORY')}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      mappingReqFilter === 'MANDATORY'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-emerald-800 hover:bg-emerald-100/60'
                    }`}
                  >
                    ★ Mandatory in JDs
                  </button>
                  <button
                    onClick={() => setMappingReqFilter('PREFERRED')}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      mappingReqFilter === 'PREFERRED'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-sky-800 hover:bg-sky-100/60'
                    }`}
                  >
                    + Preferred / Advanced
                  </button>
                </div>

                <span className="text-xs font-medium text-slate-500 self-center">
                  Showing <strong className="text-slate-900 font-semibold">{filteredSkillMappings.length}</strong> of{' '}
                  <strong className="text-slate-900 font-semibold">{industryOverview?.skillCompanyMappings.length || 0}</strong> Mappings
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 text-xs font-medium">
                <span className="text-slate-400 font-medium text-xs mr-1 shrink-0">Filter Category:</span>
                {mappingCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMappingCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      mappingCategoryFilter === cat
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Mappings Grid */}
            {filteredSkillMappings.length === 0 ? (
              <div className="p-10 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                No skill or company found matching &quot;{mappingSearch}&quot;. Try searching another keyword like &quot;Google&quot;, &quot;SQL&quot;, or &quot;Python&quot;.
              </div>
            ) : (
              <div className="space-y-6">
                {filteredSkillMappings.map((mapItem, idx) => (
                  <div
                    key={mapItem.skillName}
                    className="p-6 rounded-3xl bg-slate-50/80 border border-slate-200/90 space-y-4 hover:bg-white hover:shadow-soft-md transition-all group"
                  >
                    {/* Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {mapItem.category}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            {mapItem.percentageOfMarket}% Employer Demand Coverage
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mt-1 group-hover:text-sky-600 transition-colors">
                          {mapItem.skillName}
                        </h4>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs font-semibold text-slate-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs inline-flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-sky-600" />
                          Demanded across <strong className="text-slate-900 font-bold">{mapItem.companiesCount}+</strong> Active Company JDs
                        </span>
                      </div>
                    </div>

                    {/* Companies Requiring This Skill */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Key Hiring Companies & Role Level
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {mapItem.sampleCompanies.map((c, cIdx) => (
                          <div
                            key={`${c.name}-${cIdx}`}
                            className={`px-3.5 py-2 rounded-xl border text-xs font-medium flex items-center gap-2.5 shadow-xs transition-all ${
                              c.isMandatory
                                ? 'bg-emerald-50/90 text-emerald-950 border-emerald-300 hover:border-emerald-400 hover:bg-emerald-100/80'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-sky-300 hover:shadow-sm'
                            }`}
                          >
                            <img
                              src={c.logo}
                              alt={c.name}
                              className="w-5 h-5 rounded-full object-cover border border-slate-200/80 shrink-0"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 leading-tight">{c.name}</span>
                              <span className="text-[10px] text-slate-500 font-medium">{c.roleLevel}</span>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ml-1 ${
                                c.isMandatory
                                  ? 'bg-emerald-200/80 text-emerald-900 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {c.isMandatory ? 'Mandatory' : 'Preferred'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interview Focus Rationale */}
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5 shadow-xs">
                      <BookOpen className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="text-slate-900 font-semibold">Interview Focus at these Companies:</span>{' '}
                        <span className="font-normal text-slate-600">{mapItem.keyInterviewFocus}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reusable Resume Upload Modal */}
      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
      />

      {/* Rich Interactive Company Profile Modal */}
      <CompanyProfileModal
        company={selectedCompany}
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  );
}
