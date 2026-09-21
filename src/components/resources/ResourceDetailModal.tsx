'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  ExternalLink,
  Calendar,
  Globe,
  Heart,
  Bookmark,
  Share2,
  ShieldCheck,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { ResourceItem, api, getToken } from '@/services/api';
import { FormattedDocumentRenderer } from './FormattedDocumentRenderer';

interface ResourceDetailModalProps {
  resource: ResourceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (resource: ResourceItem) => void;
  onRequireAuth?: () => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  onShare,
  onRequireAuth,
}) => {
  if (!isOpen || !resource) return null;

  const [isLiked, setIsLiked] = useState<boolean>(resource.is_liked || false);
  const [likeCount, setLikeCount] = useState<number>(resource.like_count || 0);
  const [isSaved, setIsSaved] = useState<boolean>(resource.is_saved || false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'RESEARCH_PAPER':
        return 'Research Paper';
      case 'LEARNING_RESOURCE':
        return 'Learning Resource';
      case 'TECH_UPDATE':
        return 'Tech Update';
      case 'OPPORTUNITY':
        return 'Opportunity';
      case 'INDUSTRY_NEWS':
      default:
        return 'Industry News';
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getToken();
    if (!token) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.toggleLikeResource(resource.id, prevLiked);
      setIsLiked(res.liked);
      setLikeCount(res.like_count);
    } catch {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getToken();
    if (!token) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    const prevSaved = isSaved;
    setIsSaved(!prevSaved);

    try {
      const res = await api.toggleSaveResource(resource.id, prevSaved);
      setIsSaved(res.saved);
    } catch {
      setIsSaved(prevSaved);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareClick = () => {
    if (onShare) {
      onShare(resource);
    } else if (navigator.share) {
      navigator
        .share({
          title: resource.title,
          text: resource.short_description,
          url: `${window.location.origin}/resources/${resource.slug}`,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/resources/${resource.slug}`);
      alert('Resource link copied to clipboard!');
    }
  };

  const formattedDate = resource.published_at
    ? new Date(resource.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-sky-100 flex flex-col max-h-[90vh] overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200">
              {getTypeLabel(resource.resource_type)}
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              {resource.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Main Image (If available) */}
          <div className="w-full h-28 rounded-2xl bg-gradient-to-br from-sky-600 to-slate-900 flex items-center justify-center text-white p-4">
            <span className="font-mono text-sm uppercase tracking-wider text-sky-200">
              {getTypeLabel(resource.resource_type)} • {resource.category}
            </span>
          </div>

          {/* Source Attribution & Date Meta */}
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <Globe className="w-4 h-4 text-sky-600" />
              {resource.source_name || resource.source_domain || 'Official Source'}
            </span>
            {formattedDate && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formattedDate}
                </span>
              </>
            )}
            {resource.is_verified && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Intelligence
                </span>
              </>
            )}
            {resource.match_score && resource.match_score > 50 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {Math.round(resource.match_score)}% Role Match
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {resource.title}
          </h2>

          {/* Skill Gap Covered Highlight Banner */}
          {resource.skill_gap_covered && (
            <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 text-xs sm:text-sm text-slate-700 flex items-center gap-2">
              <span className="font-semibold text-sky-800">Bridges Target Gap:</span>
              <span className="px-2 py-0.5 rounded bg-white text-sky-700 font-bold border border-sky-200">
                {resource.skill_gap_covered}
              </span>
            </div>
          )}

          {/* Detailed Content / Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Overview & Key Takeaways
            </h4>
            <div className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
              <FormattedDocumentRenderer
                content={(resource as any).content_markdown || resource.content_summary || resource.short_description || ''}
                skipTitleAndSubtitle={true}
              />
            </div>
          </div>

          {/* Covered Skills */}
          {resource.skills && resource.skills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Target Skills & Technologies
              </h4>
              <div className="flex flex-wrap gap-2">
                {resource.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Left Social Engagement */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleLike}
              disabled={isProcessing}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isLiked
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{likeCount} Likes</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isProcessing}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isSaved
                  ? 'bg-sky-50 text-sky-600 border-sky-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-sky-600 text-sky-600' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleShareClick}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              title="Share Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action: Visit Official Source */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Link
              href={`/resources/${resource.slug}`}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition-colors"
            >
              Deep View
            </Link>

            {resource.original_url && (
              <a
                href={resource.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-slate-900 active:bg-slate-950 text-white text-xs sm:text-sm font-bold shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
              >
                <span>Read Full Article</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
