'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { JobDetailModal } from '@/components/features/JobDetailModal';
import { CompanyProfileModal } from '@/components/features/CompanyProfileModal';
import { JobMatch } from '@/data/jobs';
import { CompanySkillCriteria } from '@/data/industry';
import { SCRAPED_COMPANIES_DATA, ScrapedCompanyInfo } from '@/data/scrapedCompaniesData';
import { GLOBAL_SCRAPED_JOBS_DB, ScrapedJobRecord } from '@/data/scrapedJobsDatabase';
import { findMatchingCandidateSkill } from '@/utils/skillMatcher';
import {
  Building2,
  Briefcase,
  Search,
  Filter,
  MapPin,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  Database,
  Zap,
  Globe,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building,
  RefreshCw,
} from 'lucide-react';

export default function JobReadinessPage() {
  const { profile, activeRole, activeLocation } = useApp();

  const [activeTab, setActiveTab] = useState<'jobs' | 'companies'>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [expFilter, setExpFilter] = useState('ALL');
  const [matchScoreFilter, setMatchScoreFilter] = useState<'ALL' | 'HIGH' | 'MED' | 'GAP'>('ALL');

  // Pagination states
  const [jobsPage, setJobsPage] = useState(1);
  const [companiesPage, setCompaniesPage] = useState(1);
  const JOBS_PAGE_SIZE = 18;
  const COMPANIES_PAGE_SIZE = 18;

  // Selected modals state
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanySkillCriteria | null>(null);

  // Candidate skills from active profile
  const candidateSkills = profile?.skills || [];

  // Unique categories across companies
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    SCRAPED_COMPANIES_DATA.forEach((c) => set.add(c.category));
    return ['ALL', ...Array.from(set)];
  }, []);

  // Total verified positions count across all 310+ companies
  const totalPositionsCount = useMemo(() => {
    return SCRAPED_COMPANIES_DATA.reduce((acc, curr) => acc + curr.jds, 0);
  }, []);

  // Pre-indexed raw jobs Map for O(1) instantaneous lookups
  const rawJobsMap = useMemo(() => {
    const map = new Map<string, ScrapedJobRecord>();
    GLOBAL_SCRAPED_JOBS_DB.forEach((j) => map.set(j.jobId, j));
    return map;
  }, []);

  // Calculate live candidate match for all scraped jobs with attached raw meta
  const allMatchedJobs = useMemo(() => {
    return GLOBAL_SCRAPED_JOBS_DB.map((scraped, index) => {
      const strong: string[] = [];
      const missing: string[] = [];

      const enrichedJdSkills = scraped.skills.map((skName, skIdx) => {
        const matched = findMatchingCandidateSkill(candidateSkills, skName);
        const isMatched = !!matched;
        if (isMatched) {
          strong.push(matched.name);
        } else {
          missing.push(skName);
        }
        return {
          name: skName,
          category: scraped.category,
          demandProbability: Math.max(50, 98 - skIdx * 4),
          tier: (skIdx < 3 ? 'Core' : skIdx < 7 ? 'Secondary' : 'Specialized') as 'Core' | 'Secondary' | 'Specialized',
          isMatched,
        };
      });

      const totalReq = Math.max(1, scraped.skills.length);
      const matchedCount = strong.length;

      // Candidate with 0 skills has strictly 0% match
      const matchScore = candidateSkills.length === 0
        ? 0
        : Math.min(99, Math.max(15, Math.round((matchedCount / totalReq) * 100)));

      const topStrong = strong.slice(0, 4);
      const topMissing = missing.slice(0, 3);

      const explanation = strong.length > 0
        ? `Direct match for ${topStrong.join(', ')}. Mastering ${topMissing.join(' & ')} completes your profile fit.`
        : candidateSkills.length === 0
        ? `Fresh profile. Add your verified skills to calculate compatibility for ${scraped.company}.`
        : `Foundational role requiring core proficiency in ${scraped.skills.slice(0, 3).join(', ')}.`;

      return {
        id: scraped.jobId,
        companyName: scraped.company,
        companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
        jobTitle: scraped.title,
        location: scraped.location,
        type: 'Full-Time',
        salaryRange: scraped.salaryBand,
        matchScore,
        matchedSkillsCount: matchedCount,
        totalRequiredSkillsCount: totalReq,
        strongSkills: topStrong,
        missingSkills: topMissing,
        matchExplanation: explanation,
        postedDaysAgo: (index % 5) + 1,
        department: scraped.domain || scraped.category,
        applyUrl: scraped.applyUrl,
        jdSkills: enrichedJdSkills,
        rawCategory: scraped.category,
        rawExperienceLevel: scraped.experienceLevel,
        rawSourceApi: scraped.sourceApi,
      };
    });
  }, [candidateSkills]);

  // Reset pagination when search / filter changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setJobsPage(1);
    setCompaniesPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    setJobsPage(1);
    setCompaniesPage(1);
  };

  const handleExpChange = (val: string) => {
    setExpFilter(val);
    setJobsPage(1);
  };

  const handleMatchScoreChange = (val: 'ALL' | 'HIGH' | 'MED' | 'GAP') => {
    setMatchScoreFilter(val);
    setJobsPage(1);
  };

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allMatchedJobs.filter((job) => {
      const matchesCategory = categoryFilter === 'ALL' || job.rawCategory === categoryFilter;
      const matchesExp = expFilter === 'ALL' || job.rawExperienceLevel === expFilter;

      let matchesScore = true;
      if (matchScoreFilter === 'HIGH') matchesScore = job.matchScore >= 70;
      else if (matchScoreFilter === 'MED') matchesScore = job.matchScore >= 40 && job.matchScore < 70;
      else if (matchScoreFilter === 'GAP') matchesScore = job.matchScore < 40;

      if (!q) return matchesCategory && matchesExp && matchesScore;

      const matchesQuery =
        job.jobTitle.toLowerCase().includes(q) ||
        job.companyName.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.department.toLowerCase().includes(q) ||
        (job.jdSkills && job.jdSkills.some((s) => s.name.toLowerCase().includes(q)));

      return matchesCategory && matchesExp && matchesScore && matchesQuery;
    });
  }, [allMatchedJobs, searchQuery, categoryFilter, expFilter, matchScoreFilter]);

  // Paginated Jobs slice (18 items for fast, responsive rendering)
  const totalJobPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PAGE_SIZE));
  const paginatedJobs = useMemo(() => {
    const start = (jobsPage - 1) * JOBS_PAGE_SIZE;
    return filteredJobs.slice(start, start + JOBS_PAGE_SIZE);
  }, [filteredJobs, jobsPage]);

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return SCRAPED_COMPANIES_DATA.filter((comp) => {
      const matchesCat = categoryFilter === 'ALL' || comp.category === categoryFilter;

      if (!q) return matchesCat;

      const matchesQuery =
        comp.name.toLowerCase().includes(q) ||
        comp.location.toLowerCase().includes(q) ||
        comp.domain.toLowerCase().includes(q) ||
        comp.skills.some((sk) => sk.toLowerCase().includes(q));

      return matchesCat && matchesQuery;
    });
  }, [searchQuery, categoryFilter]);

  // Paginated Companies slice
  const totalCompanyPages = Math.max(1, Math.ceil(filteredCompanies.length / COMPANIES_PAGE_SIZE));
  const paginatedCompanies = useMemo(() => {
    const start = (companiesPage - 1) * COMPANIES_PAGE_SIZE;
    return filteredCompanies.slice(start, start + COMPANIES_PAGE_SIZE);
  }, [filteredCompanies, companiesPage]);

  // Handler to open company modal
  const handleOpenCompanyModal = (comp: ScrapedCompanyInfo) => {
    const tier: CompanySkillCriteria['industryTier'] =
      comp.category.includes('FinTech')
        ? 'Fintech'
        : comp.category.includes('SaaS')
        ? 'Enterprise SaaS'
        : comp.category.includes('Labs') || comp.category.includes('AI')
        ? 'Tier 1 Tech'
        : 'Unicorn';

    const adapted: CompanySkillCriteria = {
      id: `comp_${comp.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
      companyName: comp.name,
      companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
      industryTier: tier,
      activeRole: `${comp.domain} Specialist`,
      openPositionsCount: comp.jds,
      entryMandatorySkills: comp.skills.slice(0, 4),
      preferredAdvancedSkills: comp.skills.slice(4),
      hiringStatus: 'Actively Hiring',
      minProficiencyExpected: 'Intermediate',
    };
    setSelectedCompany(adapted);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16">
      {/* 1. HERO & TELEMETRY BANNER (MATCHING ADMIN PIPELINE) */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-50 via-white to-sky-50/80 border-2 border-sky-200/90 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200 shadow-2xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                Live Employer Intelligence Feed
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200">
                24h Sync Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Job Readiness & Employer Matching Hub
            </h1>
            <p className="text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
              Explore verified tech positions indexed across <span className="text-sky-700 font-bold">{SCRAPED_COMPANIES_DATA.length}+ hiring employers</span>. Match your candidate skills against real job descriptions with deterministic compatibility scoring.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard/industry-skills"
              className="px-4 py-2.5 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-xs font-bold text-slate-800 shadow-2xs hover:border-sky-300 transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>Skill Gap Analysis</span>
            </Link>
            <Link
              href="/dashboard/roadmap"
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <span>View Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Real Metrics Grid matching Admin Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2 border-t border-sky-100">
          <div className="p-4 rounded-2xl bg-white/90 border border-sky-200/80 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Positions Indexed
            </span>
            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
              <span>{totalPositionsCount.toLocaleString()}+</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Jobs</span>
            </div>
            <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
              <Database className="w-3 h-3 text-sky-600 shrink-0" />
              <span>Parsed JDs ready</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-sky-200/80 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Verified Employers
            </span>
            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
              <span>{SCRAPED_COMPANIES_DATA.length}+</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Companies</span>
            </div>
            <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
              <Building className="w-3 h-3 text-sky-600 shrink-0" />
              <span>Across tech sectors</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-sky-200/80 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Profile Readiness
            </span>
            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
              <span>{candidateSkills.length === 0 ? '0%' : `${profile?.readinessScore || 0}%`}</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Match</span>
            </div>
            <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-sky-600 shrink-0" />
              <span>{candidateSkills.length} verified skills</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-sky-200/80 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Pipeline Status
            </span>
            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
              <span>100%</span>
              <span className="text-xs font-bold text-emerald-600 uppercase">Verified</span>
            </div>
            <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
              <Globe className="w-3 h-3 text-sky-600 shrink-0" />
              <span>Zero binary bloat</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS & FILTER BAR */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-200/70 pb-3">
          {/* Tabs Switcher */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-sky-100/50 border border-sky-200/80 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'jobs'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-sky-700 hover:bg-white/60'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Matched Positions & JDs ({filteredJobs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('companies')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'companies'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-sky-700 hover:bg-white/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Hiring Employers ({filteredCompanies.length})</span>
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            {activeTab === 'jobs' ? `Showing ${filteredJobs.length} of ${allMatchedJobs.length} active positions` : `Showing ${filteredCompanies.length} of ${SCRAPED_COMPANIES_DATA.length} hiring employers`}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={activeTab === 'jobs' ? "Search jobs by title, company, skill, location..." : "Search companies by name, sector, tech stack..."}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sky-200 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            />
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-sky-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            >
              <option value="ALL">All Tech Sectors</option>
              {categoriesList.filter((c) => c !== 'ALL').map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Job Experience Filter (only visible on jobs tab) */}
          {activeTab === 'jobs' ? (
            <>
              <div className="lg:col-span-2">
                <select
                  value={expFilter}
                  onChange={(e) => handleExpChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-sky-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                >
                  <option value="ALL">All Experience Levels</option>
                  <option value="0-2 yrs (Fresher/Junior)">Fresher (0-2 yrs)</option>
                  <option value="2-5 yrs (Mid-Level)">Mid-Level (2-5 yrs)</option>
                  <option value="5+ yrs (Senior/Lead)">Senior (5+ yrs)</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  value={matchScoreFilter}
                  onChange={(e) => handleMatchScoreChange(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-sky-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                >
                  <option value="ALL">All Match Scores</option>
                  <option value="HIGH">High Fit (70%+)</option>
                  <option value="MED">Moderate Fit (40-69%)</option>
                  <option value="GAP">Foundational (&lt;40%)</option>
                </select>
              </div>
            </>
          ) : (
            <div className="lg:col-span-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  handleSearchChange('');
                  handleCategoryChange('ALL');
                }}
                className="px-3.5 py-2.5 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. TAB 1: MATCHED JOBS & JDS */}
      {activeTab === 'jobs' && (
        <div>
          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border-2 border-sky-100 shadow-soft-sm space-y-3">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No matching positions found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
                Try adjusting your search terms or resetting the sector and experience filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  handleSearchChange('');
                  handleCategoryChange('ALL');
                  handleExpChange('ALL');
                  handleMatchScoreChange('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-slate-900 transition-all cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedJobs.map((job) => {
                  return (
                    <div
                      key={job.id}
                      className="p-6 rounded-3xl bg-white border-2 border-sky-200/80 shadow-soft-sm hover:border-sky-300 hover:shadow-soft-md transition-all flex flex-col justify-between gap-5 group"
                    >
                      <div className="space-y-4">
                        {/* Card Header: Logo, Title, Company & Match Score Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0 font-black text-sm shadow-2xs">
                              {job.companyName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                                {job.jobTitle}
                              </h4>
                              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-0.5 truncate">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{job.companyName}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500 font-normal truncate">{job.department}</span>
                              </p>
                            </div>
                          </div>

                          {/* Match Ring Badge */}
                          <div className="flex flex-col items-end shrink-0">
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-black shadow-2xs border ${
                                candidateSkills.length === 0
                                  ? 'bg-slate-50 text-slate-600 border-slate-200'
                                  : job.matchScore >= 70
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : job.matchScore >= 40
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {candidateSkills.length === 0 ? '0% Fit' : `${job.matchScore}% Fit`}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              {job.matchedSkillsCount}/{job.totalRequiredSkillsCount} matched
                            </span>
                          </div>
                        </div>

                        {/* Location, Salary & Experience */}
                        <div className="p-3 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-1.5 text-xs text-slate-600 font-medium">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-slate-700 truncate">
                              <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span className="truncate">{job.location}</span>
                            </span>
                            <span className="font-bold text-slate-900 shrink-0">{job.salaryRange}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-sky-100/60">
                            <span>{job.rawExperienceLevel || 'All Levels'}</span>
                            <span className="text-sky-700 font-semibold">{job.rawSourceApi || 'Verified Feed'}</span>
                          </div>
                        </div>

                        {/* Matched Strong Skills */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                            Candidate Matched Skills ({job.strongSkills.length})
                          </div>
                          {job.strongSkills.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic">
                              {candidateSkills.length === 0 ? 'Upload resume or add skills to calculate matches.' : 'No direct matches. Add skills to increase fit.'}
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {job.strongSkills.map((sk) => (
                                <span
                                  key={`strong-${job.id}-${sk}`}
                                  className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Missing Skill Gaps */}
                        {job.missingSkills.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                              Required Skill Gaps ({job.missingSkills.length})
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {job.missingSkills.map((sk) => (
                                <span
                                  key={`missing-${job.id}-${sk}`}
                                  className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1"
                                >
                                  <X className="w-3 h-3 text-rose-600" />
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Footer */}
                      <div className="pt-3 border-t border-sky-100 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400">
                          JD ID: <span className="text-slate-700">{job.id}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedJob(job)}
                          className="text-xs font-bold text-sky-700 hover:text-sky-900 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Match Analysis</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Jobs Pagination */}
              {totalJobPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-sky-200/80 shadow-2xs">
                  <p className="text-xs font-semibold text-slate-600">
                    Showing <span className="text-sky-700 font-bold">{((jobsPage - 1) * JOBS_PAGE_SIZE) + 1}</span> to{' '}
                    <span className="text-sky-700 font-bold">{Math.min(jobsPage * JOBS_PAGE_SIZE, filteredJobs.length)}</span> of{' '}
                    <span className="text-slate-900 font-extrabold">{filteredJobs.length.toLocaleString()}</span> positions
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={jobsPage <= 1}
                      onClick={() => {
                        setJobsPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 320, behavior: 'smooth' });
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                    >
                      Previous
                    </button>

                    <span className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 font-extrabold text-xs border border-sky-200">
                      Page {jobsPage} of {totalJobPages}
                    </span>

                    <button
                      type="button"
                      disabled={jobsPage >= totalJobPages}
                      onClick={() => {
                        setJobsPage((p) => Math.min(totalJobPages, p + 1));
                        window.scrollTo({ top: 320, behavior: 'smooth' });
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: HIRING COMPANIES DIRECTORY */}
      {activeTab === 'companies' && (
        <div>
          {filteredCompanies.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border-2 border-sky-100 shadow-soft-sm space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No employers match your filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
                Try searching for another employer or resetting the category filter.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedCompanies.map((comp) => (
                  <div
                    key={comp.name}
                    className="p-6 rounded-3xl bg-white border-2 border-sky-200/80 shadow-soft-sm hover:border-sky-300 hover:shadow-soft-md transition-all flex flex-col justify-between gap-5 group"
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-black text-base shadow-2xs">
                            {comp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                              {comp.name}
                            </h4>
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200 mt-0.5">
                              {comp.category}
                            </span>
                          </div>
                        </div>

                        <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200 shrink-0">
                          {comp.jds} Active JDs
                        </div>
                      </div>

                      {/* Domain & Location */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                        <p className="font-semibold text-slate-800 truncate">
                          Domain: <span className="font-normal text-slate-600">{comp.domain}</span>
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span className="truncate">{comp.location}</span>
                        </p>
                      </div>

                      {/* Required Skills Stack */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                          Core Tech Stack
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {comp.skills.map((sk) => (
                            <span
                              key={`${comp.name}-${sk}`}
                              className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-white text-slate-700 border border-slate-200"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-sky-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Employer
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenCompanyModal(comp)}
                        className="text-xs font-bold text-sky-700 hover:text-sky-900 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Company Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Companies Pagination */}
              {totalCompanyPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-sky-200/80 shadow-2xs">
                  <p className="text-xs font-semibold text-slate-600">
                    Showing <span className="text-sky-700 font-bold">{((companiesPage - 1) * COMPANIES_PAGE_SIZE) + 1}</span> to{' '}
                    <span className="text-sky-700 font-bold">{Math.min(companiesPage * COMPANIES_PAGE_SIZE, filteredCompanies.length)}</span> of{' '}
                    <span className="text-slate-900 font-extrabold">{filteredCompanies.length.toLocaleString()}</span> employers
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={companiesPage <= 1}
                      onClick={() => {
                        setCompaniesPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 320, behavior: 'smooth' });
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                    >
                      Previous
                    </button>

                    <span className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-700 font-extrabold text-xs border border-sky-200">
                      Page {companiesPage} of {totalCompanyPages}
                    </span>

                    <button
                      type="button"
                      disabled={companiesPage >= totalCompanyPages}
                      onClick={() => {
                        setCompaniesPage((p) => Math.min(totalCompanyPages, p + 1));
                        window.scrollTo({ top: 320, behavior: 'smooth' });
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. INTERACTIVE MODALS */}
      <JobDetailModal
        job={selectedJob}
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
      />

      <CompanyProfileModal
        company={selectedCompany}
        isOpen={Boolean(selectedCompany)}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  );
}
