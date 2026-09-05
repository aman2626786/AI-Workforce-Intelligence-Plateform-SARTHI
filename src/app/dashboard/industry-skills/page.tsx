'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FilterBar } from '@/components/ui/FilterBar';
import { SkillBadge } from '@/components/ui/SkillBadge';
import { TrendChart } from '@/components/features/TrendChart';
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

  const [activeTab, setActiveTab] = useState<'trends' | 'companyCriteria' | 'skillMapping'>('trends');
  const [selectedTimeframe, setSelectedTimeframe] = useState('Last 6 Months');
  const [companySearch, setCompanySearch] = useState('');
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

  // Filtered company criteria
  const filteredCompanies = (industryOverview?.companyCriteria || []).filter((c) =>
    c.companyName.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.activeRole.toLowerCase().includes(companySearch.toLowerCase())
  );

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Industry Skill Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Understand what employers are looking for in your target career ({activeRole}).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsResumeModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload / Update Resume
          </button>

          <button
            onClick={() => openAiDrawerWithTopic('Company Hiring Skill Requirements')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-brand-600" />
            AI Market Interpretation
          </button>
        </div>
      </div>

      {/* TOP FILTERS BAR */}
      <FilterBar
        selectedRole={activeRole}
        onRoleChange={setActiveRole}
        selectedLocation={activeLocation}
        onLocationChange={setActiveLocation}
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={setSelectedTimeframe}
      />

      {/* RESUME SKILL MATCHING & LIVE ALIGNMENT STATUS CARD */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-soft-md border border-slate-700/60 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5" />
                Live Resume Intelligence Active
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                {profile?.resume?.fileName || 'Extracted Resume File'}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white">
              Resume Skills Matched Against {activeRole} Standards
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              We cross-referenced your <strong>{totalResumeSkillsCount} verified resume skills</strong> against all <strong>{skills.length} industry competencies</strong>. Skills are categorized into fully matched, partial proficiencies, and missing employer gaps.
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center">
              <p className="text-2xl font-black text-emerald-400">{metSkillsCount}</p>
              <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider mt-0.5">✓ Matched</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-center">
              <p className="text-2xl font-black text-amber-400">{partialSkillsCount}</p>
              <p className="text-[10px] font-bold text-amber-200 uppercase tracking-wider mt-0.5">⚡ Partial</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-center">
              <p className="text-2xl font-black text-rose-400">{gapSkillsCount}</p>
              <p className="text-[10px] font-bold text-rose-200 uppercase tracking-wider mt-0.5">✗ Missing Gaps</p>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-soft-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('trends')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'trends'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Skill Demand & Trends ({skills.length})
        </button>

        <button
          onClick={() => setActiveTab('companyCriteria')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'companyCriteria'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Company-Wise Skill Criteria ({industryOverview?.companyCriteria.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('skillMapping')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'skillMapping'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
              : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          Skill-to-Company Mapping List
        </button>
      </div>

      {/* TAB 1: SKILL DEMAND & TRENDS */}
      {activeTab === 'trends' && (
        <div className="space-y-8 animate-fade-in">
          {/* SKILL DEMAND TREND CHART */}
          {industryOverview && (
            <TrendChart
              data={industryOverview.trendData}
              title={`Skill Demand Trajectory for ${activeRole}`}
              subtitle={`Market Trend over ${selectedTimeframe} across 10,000+ job listings`}
            />
          )}

          {/* SKILL DEMAND TABLE */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Skill Demand Index (Ranked Spectrum)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Ranked by actual probability across active employer job postings & matched to your resume
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {skills.length} Total Competencies
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {metSkillsCount} Matched ({Math.round((metSkillsCount / Math.max(1, skills.length)) * 100)}%)
                </span>
              </div>
            </div>

            {/* RESUME MATCH STATUS FILTER TABS */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl overflow-x-auto text-xs font-bold">
              <span className="text-slate-400 font-semibold text-[11px] px-2 shrink-0">Resume Alignment:</span>
              <button
                onClick={() => setSkillMatchFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  skillMatchFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Skills ({skills.length})
              </button>
              <button
                onClick={() => setSkillMatchFilter('MATCHED')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  skillMatchFilter === 'MATCHED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-800 hover:bg-emerald-100/60'
                }`}
              >
                ✓ Matched in Resume ({metSkillsCount})
              </button>
              <button
                onClick={() => setSkillMatchFilter('PARTIAL')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  skillMatchFilter === 'PARTIAL'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-900 hover:bg-amber-100/60'
                }`}
              >
                ⚡ Partial Matches ({partialSkillsCount})
              </button>
              <button
                onClick={() => setSkillMatchFilter('GAP')}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  skillMatchFilter === 'GAP'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-800 hover:bg-rose-100/60'
                }`}
              >
                ✗ Missing Employer Gaps ({gapSkillsCount})
              </button>
            </div>

            {/* TIER TABS & SEARCH */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto text-xs font-bold">
                  <button
                    onClick={() => setSkillTierFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      skillTierFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Tiers ({skills.length})
                  </button>
                  <button
                    onClick={() => setSkillTierFilter('TIER_1')}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      skillTierFilter === 'TIER_1'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-amber-800 hover:bg-amber-100/50'
                    }`}
                  >
                    ★ Top 10 Core Mandates ({tier1Count})
                  </button>
                  <button
                    onClick={() => setSkillTierFilter('TIER_2')}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      skillTierFilter === 'TIER_2'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-blue-800 hover:bg-blue-100/50'
                    }`}
                  >
                    ● Secondary Stack (11-25) ({tier2Count})
                  </button>
                  <button
                    onClick={() => setSkillTierFilter('TIER_3')}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      skillTierFilter === 'TIER_3'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-purple-800 hover:bg-purple-100/50'
                    }`}
                  >
                    ✦ Specialized Tools (26-38) ({tier3Count})
                  </button>
                  <button
                    onClick={() => setSkillTierFilter('TIER_4')}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      skillTierFilter === 'TIER_4'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🛡️ Best Practices & Professional ({tier4Count})
                  </button>
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search any skill across 40+ index..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              {/* CATEGORY FILTER CHIPS */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
                <span className="text-slate-400 font-semibold text-[11px] mr-1 shrink-0">Filter by Category:</span>
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-4">Skill Name & Industry Scope</th>
                    <th className="py-3 px-4">Market Category</th>
                    <th className="py-3 px-4">Demand %</th>
                    <th className="py-3 px-4">Trajectory</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Your Resume Status</th>
                    <th className="py-3 px-4 text-right">Market Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredSkills.map((sk) => (
                    <tr
                      key={sk.id}
                      className={`transition-colors ${
                        sk.gapSeverity === 'Met'
                          ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                          : sk.gapSeverity === 'Partial'
                          ? 'bg-amber-50/30 hover:bg-amber-50/60'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-4 px-3 font-extrabold text-slate-400">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-extrabold ${
                            (sk.tierRank || 0) <= 10
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : (sk.tierRank || 0) <= 25
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : (sk.tierRank || 0) <= 38
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : 'bg-slate-200 text-slate-800 border border-slate-300'
                          }`}
                        >
                          #{(sk.tierRank || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{sk.name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{sk.description}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-500">{sk.category}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-600 rounded-full"
                              style={{ width: `${sk.demandPercentage}%` }}
                            />
                          </div>
                          <span className="font-extrabold text-brand-700">{sk.demandPercentage}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                          {sk.trend === 'up' && <span className="text-emerald-600">↑ Growing</span>}
                          {sk.trend === 'rapid' && <span className="text-purple-600">↑↑ Rapid</span>}
                          {sk.trend === 'stable' && <span className="text-blue-600">→ Stable</span>}
                          {sk.trend === 'down' && <span className="text-rose-600">↓ Declining</span>}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold ${
                            sk.priority === 'Critical'
                              ? 'bg-rose-100 text-rose-700'
                              : sk.priority === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {sk.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {sk.gapSeverity === 'Met' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-xs">
                            <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                            Matched in Resume ({sk.studentLevel})
                          </span>
                        ) : sk.gapSeverity === 'Partial' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300">
                            <Zap className="w-3.5 h-3.5 text-amber-700" />
                            Partial Match ({sk.studentLevel})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Missing Gap (Not in Resume)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
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
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Emerging Skill Intelligence</h3>
                <p className="text-xs text-slate-500 font-medium">Fast-growing capabilities shifting employer expectations</p>
              </div>
              <AiInsightBadge label="Industry Signal" variant="purple" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {industryOverview?.emergingSkills.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-3 hover:shadow-soft-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {item.status}
                      </span>
                      <span className="text-xs font-black text-emerald-600 flex items-center gap-0.5">
                        <Zap className="w-3 h-3" />
                        {item.growthRate}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 leading-snug">{item.name}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {item.whyItMatters}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPANY-WISE SKILL CRITERIA */}
      {activeTab === 'companyCriteria' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-soft-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
                Employer Hiring Criteria
              </span>
              <h3 className="text-xl font-extrabold">Which Companies Are Hiring for {activeRole}?</h3>
              <p className="text-xs text-brand-100 font-medium">
                See exact skill requirements (entry-level mandatory vs preferred skills) company-by-company.
              </p>
            </div>

            {/* Search Company Filter */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Search company or role..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCompanies.map((comp) => (
              <div
                key={comp.id}
                onClick={() => setSelectedCompany(comp)}
                className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm hover:shadow-soft-md hover:border-brand-300 transition-all flex flex-col justify-between gap-5 cursor-pointer group"
              >
                <div>
                  {/* Company Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={comp.companyLogo}
                        alt={comp.companyName}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-sm group-hover:scale-105 transition-transform"
                      />
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {comp.companyName}
                        </h4>
                        <p className="text-xs font-semibold text-brand-600 flex items-center gap-1.5 mt-0.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          {comp.activeRole}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
                        {comp.hiringStatus}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 mt-1">
                        {comp.openPositionsCount} Open Roles
                      </span>
                    </div>
                  </div>

                  {/* Tier & Expected Level */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                      {comp.industryTier}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Min Level: <strong className="text-slate-900">{comp.minProficiencyExpected}</strong>
                    </span>
                  </div>

                  {/* Entry Mandatory Skills List */}
                  <div className="space-y-2 mb-4">
                    <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Mandatory Skills for Entry
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {comp.entryMandatorySkills.map((sk) => (
                        <span
                          key={sk}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Advanced Skills */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                      Preferred Advanced Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {comp.preferredAdvancedSkills.map((sk) => (
                        <span
                          key={sk}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold"
                        >
                          + {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span suppressHydrationWarning>Candidate Profile: {activeRole}</span>
                  <span className="text-brand-600 font-bold hover:underline flex items-center gap-0.5">
                    View Company Profile <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SKILL-TO-COMPANY MAPPING LIST */}
      {activeTab === 'skillMapping' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Banner Header */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 text-white shadow-soft-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold uppercase tracking-wider">
                Full Spectrum Hiring Intelligence
              </span>
              <h3 className="text-xl font-extrabold">
                Which Companies Ask for Each {activeRole} Skill?
              </h3>
              <p className="text-xs text-slate-300 font-medium max-w-2xl">
                Explore all {industryOverview?.skillCompanyMappings.length || 0} industry competencies mapped to real hiring companies (FAANG, Top Tech, High-Growth Unicorns, GCCs, and Startups).
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
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 font-semibold shadow-inner"
              />
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-6">
            {/* Filter Bar Controls */}
            <div className="flex flex-col gap-3 pb-2 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto text-xs font-bold">
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
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-indigo-800 hover:bg-indigo-100/60'
                    }`}
                  >
                    + Preferred / Advanced
                  </button>
                </div>

                <span className="text-xs font-bold text-slate-500 self-center">
                  Showing <strong className="text-slate-900">{filteredSkillMappings.length}</strong> of{' '}
                  <strong className="text-slate-900">{industryOverview?.skillCompanyMappings.length || 0}</strong> Mappings
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 text-[11px] font-bold">
                <span className="text-slate-400 font-semibold text-[11px] mr-1 shrink-0">Filter Category:</span>
                {mappingCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMappingCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      mappingCategoryFilter === cat
                        ? 'bg-brand-600 text-white shadow-sm'
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
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                            {mapItem.category}
                          </span>
                          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                            {mapItem.percentageOfMarket}% Employer Demand Coverage
                          </span>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mt-1 group-hover:text-brand-600 transition-colors">
                          {mapItem.skillName}
                        </h4>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs font-extrabold text-slate-800 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs inline-flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-brand-600" />
                          Demanded across <strong className="text-brand-600">{mapItem.companiesCount}+</strong> Active Company JDs
                        </span>
                      </div>
                    </div>

                    {/* Companies Requiring This Skill */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Key Hiring Companies & Role Level
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {mapItem.sampleCompanies.map((c, cIdx) => (
                          <div
                            key={`${c.name}-${cIdx}`}
                            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2.5 shadow-xs transition-all ${
                              c.isMandatory
                                ? 'bg-emerald-50/90 text-emerald-950 border-emerald-300 hover:border-emerald-400 hover:bg-emerald-100/80'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-brand-300 hover:shadow-sm'
                            }`}
                          >
                            <img
                              src={c.logo}
                              alt={c.name}
                              className="w-5 h-5 rounded-full object-cover border border-slate-200/80 shrink-0"
                            />
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 leading-tight">{c.name}</span>
                              <span className="text-[10px] text-slate-500 font-medium">{c.roleLevel}</span>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ml-1 ${
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
                      <BookOpen className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong className="text-slate-900 font-extrabold">Interview Focus at these Companies:</strong>{' '}
                        <span className="font-medium text-slate-600">{mapItem.keyInterviewFocus}</span>
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
