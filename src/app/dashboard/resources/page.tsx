'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { ResourceRow } from '@/components/resources/ResourceRow';
import { ResourceFilters } from '@/components/resources/ResourceFilters';
import { ShareModal } from '@/components/resources/ShareModal';
import { api, ResourceItem } from '@/services/api';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Compass,
  Sparkles,
  LayoutList,
  LayoutGrid,
  Bookmark,
  BookOpen,
} from 'lucide-react';

const TYPE_TABS = [
  { id: 'ALL', label: 'All Resources' },
  { id: 'INDUSTRY_NEWS', label: 'Industry News' },
  { id: 'RESEARCH_PAPER', label: 'Research Papers' },
  { id: 'LEARNING_RESOURCE', label: 'Learning Resources' },
  { id: 'TECH_UPDATE', label: 'Tech Updates' },
  { id: 'OPPORTUNITY', label: 'Opportunities' },
];

function DashboardResourcesContent() {
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

  // Fetch data
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
      console.warn('Dashboard resources fetch notice:', err);
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

  const gridColsClass = 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-100/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700">
            <Compass className="w-4 h-4" />
            <span>Student Intelligence Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Resource Intelligence Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
            Curated research papers, tutorials, industry breakthroughs, and opportunities verified for tech careers.
          </p>
        </div>

        {/* Quick Link to Saved Resources */}
        <Link
          href="/dashboard/resources/saved"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-sky-200 text-xs font-semibold shadow-2xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Bookmark className="w-4 h-4 text-sky-600" />
          <span>My Saved Resources</span>
        </Link>
      </div>

      {/* Control Bar: Search, View Mode, Sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 p-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-sky-100 shadow-2xs">
        {/* Search Input Bar */}
        <div className="relative flex-1">
          <div className="flex items-center gap-2 bg-slate-50/90 rounded-xl px-3.5 py-2 border border-slate-200 focus-within:border-sky-500 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Python, Transformer research, SQL, tutorials, React 19..."
              className="w-full bg-transparent text-xs sm:text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setPage(1)}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-slate-900 text-white text-xs font-semibold shadow-2xs transition-all shrink-0 cursor-pointer"
            >
              Search
            </button>
          </div>
        </div>

        {/* Right: View Mode Toggle & Sort Selector */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-sky-200 text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
            <span>Filters</span>
          </button>

          {/* View Mode Toggle */}
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

          {/* Sort Selector */}
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

      {/* 2-Column: Left Filter Sidebar + Resources Catalog */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Desktop Left Filter Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-24 self-start max-h-[calc(100vh-7.5rem)] overflow-y-auto pr-1">
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
            onResetFilters={handleResetFilters}
            totalResults={total}
          />
        </aside>

        {/* Right Catalog Section */}
        <section className="flex-1 min-w-0 w-full space-y-6">
          {isLoading ? (
            <div className="min-h-[360px] flex flex-col items-center justify-center gap-3 bg-white/60 backdrop-blur-xs rounded-2xl border border-sky-100 p-8 text-center shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 animate-spin">
                <RefreshCw className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Loading verified intelligence resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="min-h-[360px] flex flex-col items-center justify-center gap-4 bg-white/70 backdrop-blur-xs rounded-2xl border border-sky-100 p-8 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-bold text-slate-900">No resources found</h3>
                <p className="text-xs text-slate-500 font-normal">
                  No materials matched your filter criteria. Try clearing search filters or checking all types.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing || isLoading ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                {(selectedType !== 'ALL' || selectedCategory !== 'All' || selectedSkill || selectedTag || searchQuery) && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer shadow-2xs"
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
                    />
                  ))}
                </div>
              ) : (
                /* Grid format */
                <div className={gridColsClass}>
                  {resources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onShare={(r) => setSharingResource(r)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2.5 rounded-xl bg-white border border-sky-200 text-slate-600 disabled:opacity-40 hover:text-sky-700 hover:border-sky-300 hover:bg-sky-50 transition-all cursor-pointer shadow-2xs"
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
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                            : 'bg-white border-sky-200 text-slate-700 hover:text-sky-700 hover:border-sky-300 hover:bg-sky-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2.5 rounded-xl bg-white border border-sky-200 text-slate-600 disabled:opacity-40 hover:text-sky-700 hover:border-sky-300 hover:bg-sky-50 transition-all cursor-pointer shadow-2xs"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Mobile Slide-Over Drawer for Filters */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-900/50"
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

      {/* Share Modal */}
      <ShareModal
        isOpen={Boolean(sharingResource)}
        onClose={() => setSharingResource(null)}
        resource={sharingResource}
      />
    </div>
  );
}

export default function DashboardResourcesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
        </div>
      }
    >
      <DashboardResourcesContent />
    </Suspense>
  );
}
