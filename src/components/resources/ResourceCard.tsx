'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  Heart,
  Share2,
  Calendar,
  Globe,
} from 'lucide-react';
import { ResourceItem, api, getToken } from '@/services/api';

interface ResourceCardProps {
  resource: ResourceItem;
  onShare?: (resource: ResourceItem) => void;
  onRequireAuth?: () => void;
  featured?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onShare,
  onRequireAuth,
  featured = false,
}) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState<boolean>(resource.is_liked || false);
  const [likeCount, setLikeCount] = useState<number>(resource.like_count || 0);
  const [isSaved, setIsSaved] = useState<boolean>(resource.is_saved || false);
  const [saveCount, setSaveCount] = useState<number>(resource.save_count || 0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    setIsLiked(Boolean(resource.is_liked));
    setLikeCount(resource.like_count || 0);
    setIsSaved(Boolean(resource.is_saved));
    setSaveCount(resource.save_count || 0);
  }, [resource.is_liked, resource.like_count, resource.is_saved, resource.save_count]);

  useEffect(() => {
    const handleEngagement = (e: any) => {
      const detail = e.detail;
      if (detail && (detail.resourceId === resource.id || detail.resourceId === resource.slug)) {
        if (typeof detail.liked === 'boolean') setIsLiked(detail.liked);
        if (typeof detail.likeCount === 'number') setLikeCount(detail.likeCount);
        if (typeof detail.saved === 'boolean') setIsSaved(detail.saved);
        if (typeof detail.saveCount === 'number') setSaveCount(detail.saveCount);
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
    e.preventDefault();
    e.stopPropagation();
    const token = getToken();
    if (!token) {
      if (onRequireAuth) onRequireAuth();
      else router.push('/login?redirect=/resources/' + resource.slug);
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
    e.preventDefault();
    e.stopPropagation();
    const token = getToken();
    if (!token) {
      if (onRequireAuth) onRequireAuth();
      else router.push('/login?redirect=/resources/' + resource.slug);
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    const prevSaved = isSaved;
    const prevCount = saveCount;

    setIsSaved(!prevSaved);
    setSaveCount(prevSaved ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.toggleSaveResource(resource.id, prevSaved);
      setIsSaved(res.saved);
      setSaveCount(res.save_count);
    } catch {
      setIsSaved(prevSaved);
      setSaveCount(prevCount);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
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

  const handleCardClick = () => {
    router.push(`/resources/${resource.slug}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white border rounded-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/15 hover:-translate-y-1 ${
        featured ? 'border-sky-400 shadow-md ring-1 ring-sky-300' : 'border-sky-100/90 shadow-sm'
      }`}
    >
      <div>
        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-3">
          {/* Header Badges & Source Attribution */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                {getTypeLabel(resource.resource_type)}
              </span>
              <div className="flex items-center gap-1.5 font-medium text-slate-700 truncate max-w-[160px]">
                <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">{resource.source_name || resource.source_domain || 'Official Source'}</span>
              </div>
            </div>

            {resource.match_score && resource.match_score > 50 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                {Math.round(resource.match_score)}% Match
              </span>
            )}
          </div>

          {resource.skill_gap_covered && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-900 border border-sky-200">
              <span className="text-slate-500">Bridges skill gap:</span>
              <span className="text-sky-700 font-bold underline">{resource.skill_gap_covered}</span>
            </div>
          )}

          {/* Resource Title - Hover turns fresh sky blue */}
          <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-sky-600 transition-colors line-clamp-2">
            {resource.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
            {resource.short_description}
          </p>

          {/* Hashtags & Topic Pills */}
          {((resource.tags && resource.tags.length > 0) || (resource.hashtags && resource.hashtags.length > 0)) && (
            <div className="flex flex-wrap gap-1 pt-0.5" onClick={(e) => e.stopPropagation()}>
              {(resource.tags || resource.hashtags || []).slice(0, 3).map((tag) => {
                const cleanTag = tag.replace(/^#/, '');
                return (
                  <Link
                    key={cleanTag}
                    href={`/resources?tag=${encodeURIComponent(cleanTag)}`}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-800 hover:text-sky-950 text-[10px] font-bold transition-colors border border-sky-200"
                  >
                    #{cleanTag}
                  </Link>
                );
              })}
              {(resource.tags || resource.hashtags || []).length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md bg-white text-slate-400 text-[10px] font-medium border border-slate-200">
                  +{(resource.tags || resource.hashtags || []).length - 3}
                </span>
              )}
            </div>
          )}

          {/* Skills Tags */}
          {resource.skills && resource.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
              {resource.skills.slice(0, 3).map((skill) => (
                <Link
                  key={skill}
                  href={`/resources?skill=${encodeURIComponent(skill)}`}
                  className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-[10px] font-medium transition-colors border border-slate-200"
                >
                  {skill}
                </Link>
              ))}
              {resource.skills.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md bg-white text-slate-400 text-[10px] font-medium border border-sky-100">
                  +{resource.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions & Metadata */}
      <div
        className="px-5 pb-4 pt-3 border-t border-sky-100/70 mt-2 flex items-center justify-between gap-3 bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          {formattedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Action Button Row */}
        <div className="flex items-center gap-1.5">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`p-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer border ${
              isLiked
                ? 'bg-sky-50 text-sky-600 border-sky-300'
                : 'bg-white text-slate-600 border-sky-100 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50/60'
            }`}
            title="Like Resource"
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-sky-600 text-sky-600' : ''}`} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {/* Save / Bookmark Button */}
          <button
            onClick={handleSave}
            className={`p-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer border ${
              isSaved
                ? 'bg-sky-50 text-sky-600 border-sky-300'
                : 'bg-white text-slate-600 border-sky-100 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50/60'
            }`}
            title={isSaved ? 'Saved to Library' : 'Save'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-sky-600 text-sky-600' : ''}`} />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-white border border-sky-100 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50/60 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
            title="Share Resource"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Detail Explore CTA */}
          <button
            onClick={handleCardClick}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-sky-600 active:bg-sky-700 transition-colors shadow-sm cursor-pointer"
          >
            Explore
          </button>
        </div>
      </div>
    </div>
  );
};
