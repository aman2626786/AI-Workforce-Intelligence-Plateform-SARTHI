'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { FilterBar } from '@/components/ui/FilterBar';
import { SkillBadge } from '@/components/ui/SkillBadge';
import { TrendChart } from '@/components/features/TrendChart';
import { AiInsightBadge } from '@/components/ui/AiInsightBadge';
import { CompanyProfileModal } from '@/components/features/CompanyProfileModal';
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
} from 'lucide-react';

export default function IndustrySkillsPage() {
  const {
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

  // Filtered company criteria
  const filteredCompanies = (industryOverview?.companyCriteria || []).filter((c) =>
    c.companyName.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.activeRole.toLowerCase().includes(companySearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Industry Skill Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Understand what employers are looking for in your target career.
          </p>
        </div>

        <button
          onClick={() => openAiDrawerWithTopic('Company Hiring Skill Requirements')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-brand-600" />
          AI Market Interpretation
        </button>
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
          Skill Demand & Trends
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
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Skill Demand Index</h3>
                <p className="text-xs text-slate-500 font-medium">Ranked by frequency in active job postings</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {skills.length} Core Skills Analyzed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Skill Name</th>
                    <th className="py-3 px-4">Market Category</th>
                    <th className="py-3 px-4">Demand %</th>
                    <th className="py-3 px-4">Trajectory</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4 text-right">Market Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {skills.map((sk) => (
                    <tr key={sk.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 font-extrabold text-slate-900 text-sm">{sk.name}</td>
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
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm">
            <div className="mb-6">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Skill-to-Companies Demand Breakdown
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Detailed list showing how many companies mandate each skill in their active Job Descriptions (JDs).
              </p>
            </div>

            <div className="space-y-6">
              {industryOverview?.skillCompanyMappings.map((mapItem) => (
                <div
                  key={mapItem.skillName}
                  className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 hover:bg-white hover:shadow-soft-sm transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {mapItem.category}
                        </span>
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                          {mapItem.percentageOfMarket}% Market Coverage
                        </span>
                      </div>
                      <h4 className="text-xl font-extrabold text-slate-900 mt-1">{mapItem.skillName}</h4>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-sm font-extrabold text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm inline-block">
                        Mentioned in <strong className="text-brand-600">{mapItem.companiesCount}+</strong> Company JDs
                      </span>
                    </div>
                  </div>

                  {/* Sample Companies Chips */}
                  <div>
                    <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      Companies Requiring This Skill
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {mapItem.sampleCompanies.map((c) => (
                        <div
                          key={c.name}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-sm ${
                            c.isMandatory
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-white text-slate-800 border-slate-200'
                          }`}
                        >
                          <img src={c.logo} alt={c.name} className="w-4 h-4 rounded-full object-cover" />
                          <span>{c.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                              c.isMandatory ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {c.isMandatory ? 'Mandatory' : 'Preferred'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interview Focus Rationale */}
                  <div className="p-3 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Key Technical Focus in Interviews:</strong>{' '}
                      <span className="font-medium">{mapItem.keyInterviewFocus}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rich Interactive Company Profile Modal */}
      <CompanyProfileModal
        company={selectedCompany}
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  );
}
