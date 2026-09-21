'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { getToken } from '@/services/api';
import { BrandLogo } from '@/components/brand/BrandLogo';

export const LandingHeader: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sky-200/50 bg-sky-100/40 backdrop-blur-md transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo - MatchSkill (No AI badge) */}
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer transition-transform hover:scale-105 duration-200">
          <BrandLogo size="sm" textClassName="group-hover:[&>span:first-child]:text-slate-800 group-hover:[&>span:last-child]:text-sky-700 transition-colors" />
        </Link>

        {/* Navigation Links - Cursor Friendly with Zoom & Highlight on Hover */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-xl hover:text-sky-700 hover:bg-sky-200/60 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Home
          </Link>
          <Link
            href="/resources"
            className="px-3.5 py-1.5 rounded-xl hover:text-sky-700 hover:bg-sky-200/60 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Resources
          </Link>
          <Link
            href="/#how-it-works"
            className="px-3.5 py-1.5 rounded-xl hover:text-sky-700 hover:bg-sky-200/60 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            How It Works
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-slate-900 active:bg-slate-950 shadow-md shadow-sky-600/20 hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-sky-700 hover:bg-sky-200/50 hover:scale-105 active:scale-95 rounded-xl transition-all duration-200 cursor-pointer"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-slate-900 active:bg-slate-950 shadow-md shadow-sky-600/20 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
