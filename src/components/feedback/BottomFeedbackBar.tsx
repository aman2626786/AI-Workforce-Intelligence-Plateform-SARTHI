'use client';

import React, { useState } from 'react';
import { MessageSquareHeart, Mail, Check, Copy } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function BottomFeedbackBar() {
  const { openFeedbackModal, addToast } = useApp();
  const [copied, setCopied] = useState(false);

  const SUPPORT_EMAIL = 'aiworkforceintelligence@gmail.com';

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      addToast('Support email copied: ' + SUPPORT_EMAIL, 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <aside
      aria-label="Platform Feedback & Support"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 print:hidden"
    >
      {/* Support / Connect Pill */}
      <div className="hidden sm:inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-700 text-[11px] font-bold shadow-lg shadow-slate-200/60 border border-sky-200/90 backdrop-blur-md transition-all">
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=Support%20%26%20Inquiry%20-%20MatchSkill`}
          className="inline-flex items-center gap-1.5 hover:text-sky-700 transition-colors"
          title="Send email to support"
        >
          <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span className="text-slate-500 font-semibold">Connect:</span>
          <span className="text-sky-700 font-bold truncate max-w-[190px]">{SUPPORT_EMAIL}</span>
        </a>
        <button
          type="button"
          onClick={handleCopyEmail}
          className="p-1 rounded-full hover:bg-sky-50 text-slate-400 hover:text-sky-700 transition-colors cursor-pointer"
          title="Copy email address"
          aria-label="Copy support email address"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      {/* Feedback Button */}
      <button
        onClick={openFeedbackModal}
        className="group inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-slate-900/95 hover:bg-sky-600 text-white text-xs font-extrabold shadow-xl shadow-slate-900/25 backdrop-blur-md border border-slate-700/60 hover:border-sky-400 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Share your feedback or suggestions"
      >
        <MessageSquareHeart className="w-4 h-4 text-sky-400 group-hover:text-white transition-colors" />
        <span className="tracking-wide">Feedback</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </button>
    </aside>
  );
}
