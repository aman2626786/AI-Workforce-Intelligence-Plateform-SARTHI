'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Search, Trash2, ExternalLink, Sparkles, RefreshCw, ArrowLeft, BookOpen, Globe } from 'lucide-react';
import { api, ResourceItem } from '@/services/api';

export default function SavedResourcesPage() {
  const [savedResources, setSavedResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const loadSaved = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUserSavedResources();
      setSavedResources(data.resources || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      await api.toggleSaveResource(id, true);
      setSavedResources((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = savedResources.filter((r) => {
    const matchesType = selectedType === 'ALL' || r.resource_type === selectedType;
    const matchesSearch =
      !searchQuery.trim() ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.short_description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/resources"
              className="text-xs font-bold text-slate-400 hover:text-brand-600 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Browse All Resources</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Bookmark className="w-7 h-7 text-brand-600 fill-brand-600" />
            <span>My Saved Resources</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Curated research papers, tutorials, and opportunities you bookmarked for learning.
          </p>
        </div>

        <Link
          href="/resources"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Explore More Resources</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            placeholder="Search within saved resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Type selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'LEARNING_RESOURCE', 'RESEARCH_PAPER', 'TECH_UPDATE', 'OPPORTUNITY'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedType === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mx-auto" />
          <p className="text-xs text-slate-500 font-bold mt-2">Loading your library...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-soft-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">No saved resources</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? 'No bookmarked resources matched your search.'
              : 'You haven’t saved any resources yet. Explore the Resource Hub and click the bookmark icon to save materials to your personal library.'}
          </p>
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
          >
            <span>Explore Resource Hub</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((res) => (
            <div
              key={res.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-soft-sm hover:border-brand-200 hover:shadow-soft-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                    {res.resource_type.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{res.source_name || 'Public'}</span>
                  </span>
                </div>

                <Link href={`/resources/${res.slug}`} className="block">
                  <h4 className="text-base font-extrabold text-slate-900 hover:text-brand-600 transition-colors line-clamp-2">
                    {res.title}
                  </h4>
                </Link>

                <p className="text-xs text-slate-600 font-medium line-clamp-3 leading-relaxed">
                  {res.short_description}
                </p>

                {res.skills && res.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {res.skills.slice(0, 3).map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => handleRemove(res.id)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove from saved"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/resources/${res.slug}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
                  >
                    View Details
                  </Link>
                  <a
                    href={res.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-sm"
                    title="Read Original Resource"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
