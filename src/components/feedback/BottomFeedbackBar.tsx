'use client';

import React from 'react';
import { MessageSquareHeart } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export function BottomFeedbackBar() {
  const { openFeedbackModal } = useApp();

  return (
    <aside
      aria-label="Platform Feedback"
      className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 print:hidden"
    >
      <button
        type="button"
        onClick={openFeedbackModal}
        className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white text-[11px] font-medium shadow-md shadow-slate-950/20 backdrop-blur-md border border-slate-700/60 hover:border-slate-500 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Give Feedback"
      >
        <MessageSquareHeart className="w-3.5 h-3.5 text-sky-400 group-hover:text-sky-300 transition-colors shrink-0" />
        <span className="tracking-tight">Feedback</span>
      </button>
    </aside>
  );
}
