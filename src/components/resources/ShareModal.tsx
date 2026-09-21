'use client';

import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Globe } from 'lucide-react';
import { ResourceItem, api } from '@/services/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: ResourceItem | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, resource }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !resource) return null;

  const url = typeof window !== 'undefined' ? `${window.location.origin}/resources/${resource.slug}` : '';
  const shareText = `Check out "${resource.title}" on MatchSkill Intelligence Hub:`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      api.shareResource(resource.id);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {}
  };

  const handleSocialShare = (platform: 'whatsapp' | 'linkedin' | 'twitter') => {
    api.shareResource(resource.id);
    let shareUrl = '';
    if (platform === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${url}`)}`;
    } else if (platform === 'linkedin') {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    } else if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-xl font-black text-slate-900">Share Resource</h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{resource.title}</p>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Direct Link</label>
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200">
            <Globe className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            <input
              type="text"
              readOnly
              value={url}
              className="w-full bg-transparent text-xs text-slate-700 font-medium focus:outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-600/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Share to Social</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleSocialShare('whatsapp')}
              className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex flex-col items-center gap-1.5 transition-all"
            >
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => handleSocialShare('linkedin')}
              className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs flex flex-col items-center gap-1.5 transition-all"
            >
              <svg className="w-5 h-5 fill-current text-blue-600" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
              <span>LinkedIn</span>
            </button>

            <button
              onClick={() => handleSocialShare('twitter')}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs flex flex-col items-center gap-1.5 transition-all"
            >
              <svg className="w-5 h-5 fill-current text-slate-900" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Twitter / X</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

