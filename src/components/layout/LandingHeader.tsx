'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, LayoutDashboard, Menu, X } from 'lucide-react';
import { getToken } from '@/services/api';
import { BrandLogo } from '@/components/brand/BrandLogo';

export const LandingHeader: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sky-200/50 bg-sky-100/40 backdrop-blur-md transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo - MatchSkill */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer transition-transform hover:scale-105 duration-200 shrink-0">
          <BrandLogo size="sm" textClassName="group-hover:[&>span:first-child]:text-slate-800 group-hover:[&>span:last-child]:text-sky-700 transition-colors" />
        </Link>

        {/* Navigation Links - Desktop */}
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

        {/* CTA Buttons - Mobile & Desktop Adaptive */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-sky-600 text-white text-xs sm:text-sm font-semibold hover:bg-slate-900 active:bg-slate-950 shadow-md shadow-sky-600/20 hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Dashboard</span>
              <span className="xs:hidden">App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-700 hover:bg-sky-200/50 rounded-xl transition-all cursor-pointer"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-sky-600 text-white text-xs sm:text-sm font-bold hover:bg-slate-900 active:bg-slate-950 shadow-md shadow-sky-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </Link>
            </>
          )}

          {/* Mobile hamburger menu button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-sky-200/60 md:hidden cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 border-t border-b border-sky-200/60 bg-white space-y-2 animate-fade-in shadow-xl">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-sky-50 hover:text-sky-700"
          >
            Home
          </Link>
          <Link
            href="/resources"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-sky-50 hover:text-sky-700"
          >
            Resources
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-sky-50 hover:text-sky-700"
          >
            How It Works
          </Link>
        </div>
      )}
    </header>
  );
};
