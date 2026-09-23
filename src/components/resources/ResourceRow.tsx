'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  Heart,
  Share2,
  Calendar,
  Globe,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { ResourceItem, api, getToken } from '@/services/api';

interface ResourceRowProps {
  resource: ResourceItem;
  onSelect?: (resource: ResourceItem) => void;
  onShare?: (resource: ResourceItem) => void;
  onRequireAuth?: () => void;
}

export const ResourceRow: React.FC<ResourceRowProps> = ({
  resource,
  onSelect,
  onShare,
  onRequireAuth,
}) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState<boolean>(resource.is_liked || false);
  const [likeCount, setLikeCount] = useState<number>(resource.like_count || 0);
  const [isSaved, setIsSaved] = useState<boolean>(resource.is_saved || false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    setIsLiked(Boolean(resource.is_liked));
    setLikeCount(resource.like_count || 0);
    setIsSaved(Boolean(resource.is_saved));
  }, [resource.is_liked, resource.like_count, resource.is_saved]);

  useEffect(() => {
    const handleEngagement = (e: any) => {
      const detail = e.detail;
      if (detail && (detail.resourceId === resource.id || detail.resourceId === resource.slug)) {
        if (typeof detail.liked === 'boolean') setIsLiked(detail.liked);
        if (typeof detail.likeCount === 'number') setLikeCount(detail.likeCount);
        if (typeof detail.saved === 'boolean') setIsSaved(detail.saved);
      }
    };
    window.addEventListener('resource-engagement-updated', handleEngagement);
    return () => window.removeEventListener('resource-engagement-updated', handleEngagement);
  }, [resource.id, resource.slug]);

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

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const handleRowClick = () => {
    if (onSelect) onSelect(resource);
    router.push(`/resources/${resource.slug}`);
  };

  return (
    <div
      onClick={handleRowClick}
      className="group p-4 sm:p-5 rounded-2xl bg-white border border-sky-100/90 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5"
    >
      {/* Main Content Area */}
      <div className="space-y-2 flex-1 min-w-0">
        {/* Source Attribution, Badges & Date */}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
            {getTypeLabel(resource.resource_type)}
          </span>
          <span className="flex items-center gap-1 font-semibold text-slate-700 truncate max-w-[180px]">
            <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            {resource.source_name || resource.source_domain || 'Official Source'}
          </span>
            {formattedDate && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  {formattedDate}
                </span>
              </>
            )}
            {resource.is_verified && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </>
            )}
            {resource.match_score && resource.match_score > 50 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                {Math.round(resource.match_score)}% Match
              </span>
            )}
          </div>

          {/* Resource Title */}
          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1 sm:line-clamp-2">
            {resource.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed font-normal">
            {resource.short_description}
          </p>

          {/* Hashtags & Topic Pills */}
          {((resource.tags && resource.tags.length > 0) || (resource.hashtags && resource.hashtags.length > 0)) && (
            <div className="flex flex-wrap gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
              {(resource.tags || resource.hashtags || []).slice(0, 3).map((tag) => {
                const cleanTag = tag.replace(/^#/, '');
                return (
                  <span
                    key={cleanTag}
                    onClick={() => router.push(`/resources?tag=${encodeURIComponent(cleanTag)}`)}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-800 hover:text-sky-950 text-[10px] font-bold transition-colors border border-sky-200 cursor-pointer"
                  >
                    #{cleanTag}
                  </span>
                );
              })}
              {(resource.tags || resource.hashtags || []).length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md bg-white text-slate-400 text-[10px] font-medium border border-slate-200">
                  +{(resource.tags || resource.hashtags || []).length - 3}
                </span>
              )}
            </div>
          )}

          {/* Skill Pills */}
          {resource.skills && resource.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
              {resource.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  onClick={() => router.push(`/resources?skill=${encodeURIComponent(skill)}`)}
                  className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 text-xs font-medium border border-slate-200 cursor-pointer transition-colors"
                >
                  {skill}
                </span>
              ))}
              {resource.skills.length > 4 && (
                <span className="px-1.5 py-0.5 rounded-md bg-white text-slate-400 text-xs font-medium border border-slate-200">
                  +{resource.skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

      {/* Right: Actions & Explore button */}
      <div
        className="flex items-center gap-2 self-end md:self-center shrink-0 border-t md:border-t-0 pt-2 md:pt-0 w-full md:w-auto justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={isProcessing}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            isLiked
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title="Like"
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>{likeCount}</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            isSaved
              ? 'bg-sky-50 text-sky-600 border-sky-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title="Save Resource"
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-sky-600 text-sky-600' : ''}`} />
        </button>

        {/* Share */}
        <button
          onClick={handleShareClick}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
          title="Share"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {/* View Details / Explore CTA */}
        <button
          onClick={handleRowClick}
          className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ml-1 shadow-2xs"
        >
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
