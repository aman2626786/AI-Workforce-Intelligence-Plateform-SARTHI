'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Lock, ArrowRight, X } from 'lucide-react';

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose?: () => void;
  redirectUrl?: string;
  title?: string;
  description?: string;
  badge?: string;
}

export const GuestLimitModal: React.FC<GuestLimitModalProps> = ({
  isOpen,
  onClose,
  redirectUrl = '/resources',
  title = 'Sign In to Unlock Full Information',
  description = 'Sign in or create a free student account to read complete articles, save resources to your library, like content, and participate in community discussions.',
  badge = 'Member Access Required',
}) => {
  if (!isOpen) return null;

  const loginTarget = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
  const signupTarget = `/signup?redirect=${encodeURIComponent(redirectUrl)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-7 sm:p-9 shadow-2xl border border-sky-100 text-center space-y-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Glow Accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-sky-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-sky-600/25">
          <Lock className="w-8 h-8" />
        </div>

        {/* Message */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>{badge}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* CTAs */}
        <div className="space-y-3 pt-2">
          <Link
            href={loginTarget}
            className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Sign In to Continue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href={signupTarget}
            className="w-full py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Create Free Student Account</span>
          </Link>
        </div>

        {/* Subtle note */}
        <p className="text-[11px] text-slate-400 font-normal">
          MatchSkill • AI Workforce & Skill Intelligence Platform
        </p>
      </div>
    </div>
  );
};

