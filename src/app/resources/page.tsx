'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { ResourceRow } from '@/components/resources/ResourceRow';
import { ResourceFilters } from '@/components/resources/ResourceFilters';
import { ShareModal } from '@/components/resources/ShareModal';
import { GuestLimitModal } from '@/components/resources/GuestLimitModal';
import { api, ResourceItem } from '@/services/api';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

const TYPE_TABS = [
  { id: 'ALL', label: 'All Resources' },
  { id: 'INDUSTRY_NEWS', label: 'Industry News' },
  { id: 'RESEARCH_PAPER', label: 'Research Papers' },
  { id: 'LEARNING_RESOURCE', label: 'Learning Resources' },
  { id: 'TECH_UPDATE', label: 'Tech Updates' },
  { id: 'OPPORTUNITY', label: 'Opportunities' },
];

function ResourceHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL state initialization
  const initialType = searchParams.get('type') || 'ALL';
  const initialCategory = searchParams.get('category') || 'All';
  const initialSkill = searchParams.get('skill') || '';
  const initialTag = searchParams.get('tag') || '';
  const initialQ = searchParams.get('q') || '';

  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSkill, setSelectedSkill] = useState<string>(initialSkill);
  const [selectedTag, setSelectedTag] = useState<string>(initialTag);
  const [sortBy, setSortBy] = useState<string>('latest');
  const [searchQuery, setSearchQuery] = useState<string>(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQ);

  // Pagination & Results
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(12);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals & Drawers
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);
  const [sharingResource, setSharingResource] = useState<ResourceItem | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'row' | 'grid'>('row');

  // Debounce search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync URL when tab or tag changes externally
  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl && typeFromUrl !== selectedType) {
      setSelectedType(typeFromUrl);
    }
    const tagFromUrl = searchParams.get('tag');
    if (tagFromUrl !== null && tagFromUrl !== selectedTag) {
      setSelectedTag(tagFromUrl);
    }
  }, [searchParams]);

  // Fetch data with robust client fallback
  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.listResources({
        type: selectedType,
        category: selectedCategory,
        skill: selectedSkill,
        tag: selectedTag,
        sort_by: sortBy,
        q: debouncedQuery,
        page,
        page_size: pageSize,
      });
      setResources(data.resources || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.warn('Resources fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, selectedCategory, selectedSkill, selectedTag, sortBy, debouncedQuery, page, pageSize]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchResources();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleResetFilters = () => {
    setSelectedType('ALL');
    setSelectedCategory('All');
    setSelectedSkill('');
    setSelectedTag('');
    setSearchQuery('');
    setDebouncedQuery('');
    setPage(1);
  };

  // Boundary-aligned edge-to-edge layout
  const containerWidthClass = 'w-full px-3 sm:px-5 lg:px-6';
  const gridColsClass = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5';

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/40 via-white to-slate-50/50 flex flex-col font-sans text-slate-900 selection:bg-sky-500 selection:text-white">
      <LandingHeader />

      {/* ========================================================
          MAIN CONTENT: CLEAN, SPACIOUS & DIRECT
          ======================================================== */}
      <main className={`${containerWidthClass} pt-6 pb-10 flex-1 w-full space-y-6`}>
        {/* Controls & Integrated Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-5 border-b border-sky-100">
          {/* Left: Mobile Filters Button & Results Count */}
          <div className="flex items-center gap-3 shrink-0 justify-between md:justify-start">
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-sky-200 text-slate-700 text-xs font-semibold shadow-2xs hover:text-sky-700 hover:border-sky-300 hover:bg-sky-50/50 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-sky-600" />
              <span>Filters</span>
              {selectedCategory !== 'All' || selectedSkill || selectedTag ? (
                <span className="w-2 h-2 rounded-full bg-sky-600" />
              ) : null}
            </button>

            <div className="text-xs font-medium text-slate-600">
              Showing <span className="font-semibold text-slate-900">{resources.length}</span> of{' '}
              <span className="font-semibold text-slate-900">{total}</span> resources
            </div>
          </div>

          {/* Center: Integrated Search Bar */}
          <div className="flex-1 max-w-xl mx-auto md:mx-4 w-full">
            <div className="relative flex items-center rounded-xl bg-white border border-sky-200/90 shadow-2xs p-1 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
              <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Python, Transformer research, SQL, tutorials, React 19..."
                className="w-full px-2.5 py-1.5 text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 text-slate-400 hover:text-slate-900 mr-1 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setPage(1)}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-slate-900 active:bg-slate-950 text-white text-xs font-semibold shadow-2xs transition-all shrink-0 cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

          {/* Right: View Mode Toggle & Sort Selector */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
            {/* View Mode Toggle (Row by default) */}
            <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setViewMode('row')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'row'
                    ? 'bg-white text-sky-600 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Row Format (List)"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-sky-600 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Box Format (Grid)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-sky-600" />
                <span>Sort:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-white border border-sky-200/90 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 hover:border-sky-300 transition-colors cursor-pointer shadow-2xs"
              >
                <option value="latest">Latest Published</option>
                <option value="trending">Most Trending</option>
                <option value="viewed">Most Viewed</option>
                <option value="liked">Most Liked</option>
                <option value="saved">Most Saved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Tag or Skill Filter Pill */}
        {selectedTag && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-sky-50 border border-sky-200 rounded-xl text-xs w-fit shadow-2xs">
            <span className="text-slate-500 font-medium">Filtering by Hashtag:</span>
            <span className="font-extrabold text-sky-800">#{selectedTag.replace(/^#/, '')}</span>
            <button
              onClick={() => {
                setSelectedTag('');
                setPage(1);
              }}
              className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
              title="Clear tag filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Boundary-aligned 2-Column: Left Sidebar + Cards Catalog */}
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {/* Desktop Left Filter Sidebar (Boundary-aligned, sticky docked) */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-32 self-start max-h-[calc(100vh-8.5rem)] overflow-y-auto pr-1">
            <ResourceFilters
              selectedType={selectedType}
              onSelectType={(t) => {
                setSelectedType(t);
                setPage(1);
              }}
              selectedCategory={selectedCategory}
              onSelectCategory={(c) => {
                setSelectedCategory(c);
                setPage(1);
              }}
              selectedSkill={selectedSkill}
              onSelectSkill={(s) => {
                setSelectedSkill(s);
                setPage(1);
              }}
              selectedTag={selectedTag}
              onSelectTag={(t) => {
                setSelectedTag(t);
                setPage(1);
              }}
              onResetFilters={handleResetFilters}
              totalResults={total}
            />
          </aside>

          {/* Right Side: Resources Cards Grid (Edge-to-edge towards right boundary) */}
          <section className="flex-1 min-w-0 space-y-8">
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-4 bg-white/80 rounded-2xl border border-sky-100">
                <RefreshCw className="w-8 h-8 text-sky-600 animate-spin" />
                <p className="text-xs text-slate-500 font-semibold">Updating MatchSkill catalog...</p>
              </div>
            ) : resources.length === 0 ? (
              <div className="py-20 px-6 text-center space-y-5 bg-white/90 rounded-3xl border border-sky-200/80 shadow-xs max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900">No resources found</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    No resources matched your active filters or search query. Try clearing keywords or resetting filters to explore all topics.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold transition-all shadow-sm hover:scale-105 cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing || isLoading ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                  {(selectedType !== 'ALL' || selectedCategory !== 'All' || selectedSkill || selectedTag || searchQuery) && (
                    <button
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all cursor-pointer shadow-2xs"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                      <span>Clear Filters</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {viewMode === 'row' ? (
                  /* Row format */
                  <div className="space-y-3.5 w-full">
                    {resources.map((resource) => (
                       <ResourceRow
                         key={resource.id}
                         resource={resource}
                         onShare={(r) => setSharingResource(r)}
                         onRequireAuth={() => setIsAuthModalOpen(true)}
                       />
                     ))}
                   </div>
                ) : (
                  /* Box format (Grid) */
                  <div className={gridColsClass}>
                    {resources.map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        onShare={(r) => setSharingResource(r)}
                        onRequireAuth={() => setIsAuthModalOpen(true)}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination with Smooth Hover Scale */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="p-2.5 rounded-xl bg-white border border-sky-200 text-slate-600 disabled:opacity-40 hover:text-sky-700 hover:border-sky-300 hover:bg-sky-50 hover:scale-105 transition-all cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            p === page
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm scale-105'
                              : 'bg-white border-sky-200 text-slate-700 hover:text-sky-700 hover:border-sky-300 hover:bg-sky-50 hover:scale-105'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="p-2.5 rounded-xl bg-white border border-sky-200 text-slate-600 disabled:opacity-40 hover:text-sky-700 hover:border-sky-300 hover:bg-sky-50 hover:scale-105 transition-all cursor-pointer shadow-2xs"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* Mobile Slide-Over Drawer for Filters */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <ResourceFilters
              selectedType={selectedType}
              onSelectType={(t) => {
                setSelectedType(t);
                setPage(1);
                setIsMobileFiltersOpen(false);
              }}
              selectedCategory={selectedCategory}
              onSelectCategory={(c) => {
                setSelectedCategory(c);
                setPage(1);
                setIsMobileFiltersOpen(false);
              }}
              selectedSkill={selectedSkill}
              onSelectSkill={(s) => {
                setSelectedSkill(s);
                setPage(1);
                setIsMobileFiltersOpen(false);
              }}
              selectedTag={selectedTag}
              onSelectTag={(t) => {
                setSelectedTag(t);
                setPage(1);
                setIsMobileFiltersOpen(false);
              }}
              onResetFilters={handleResetFilters}
              totalResults={total}
            />

            <button
              onClick={() => setIsMobileFiltersOpen(false)}
              className="w-full mt-6 py-3 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-slate-900 active:bg-slate-950 shadow-sm transition-all cursor-pointer"
            >
              Apply Filters ({total})
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          4. FOOTER: MATCHSKILL (CALM & CONSISTENT WITH HOME PAGE)
          ======================================================== */}
      <footer className="py-10 bg-gradient-to-b from-sky-50/60 via-white to-sky-100/30 mt-auto border-t border-sky-200/90">
        <div className="w-full px-3 sm:px-5 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <span className="h-4 w-px bg-sky-200 hidden sm:block" />
            <p className="text-xs text-slate-500 font-medium hidden sm:block">Real-Time Labor & Skill Intelligence Platform</p>
          </div>

          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <Link href="/" className="hover:text-sky-700 transition-colors">Home</Link>
              <Link href="/resources" className="hover:text-sky-700 transition-colors">Resources</Link>
              <Link href="/#how-it-works" className="hover:text-sky-700 transition-colors">How It Works</Link>
            </nav>
            <span className="h-4 w-px bg-sky-200" />
            <p className="text-xs text-slate-500 font-medium">© 2026 MatchSkill. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ShareModal
        isOpen={Boolean(sharingResource)}
        onClose={() => setSharingResource(null)}
        resource={sharingResource}
      />

      <GuestLimitModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectUrl="/resources"
      />
    </div>
  );
}

export default function ResourceHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sky-50/30 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
            <span>Loading MatchSkill Resources...</span>
          </div>
        </div>
      }
    >
      <ResourceHubContent />
    </Suspense>
  );
}
