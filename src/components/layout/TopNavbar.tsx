'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Menu, Search, Bell, Sparkles, MapPin, Briefcase, Settings, LogOut, User } from 'lucide-react';

interface TopNavbarProps {
  onOpenSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenSidebar }) => {
  const router = useRouter();
  const { profile, activeRole, activeLocation, openAiDrawerWithTopic, addToast, logout } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    if (confirm('Are you sure you want to log out of SkillVantage AI?')) {
      await logout();
    }
  };


  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenSidebar}
          className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search skills, roles, companies, or roadmap modules..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Target Context Pill */}
        <div
          suppressHydrationWarning
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-semibold text-slate-700"
        >
          <span className="flex items-center gap-1" suppressHydrationWarning>
            <Briefcase className="w-3.5 h-3.5 text-brand-600" />
            {mounted ? activeRole : 'Robotics Engineer'}
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1" suppressHydrationWarning>
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            {mounted ? activeLocation : 'Bengaluru'}
          </span>
        </div>

        {/* AI Drawer Quick Button */}
        <button
          onClick={() => openAiDrawerWithTopic('Market Demand Analysis')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span className="hidden md:inline">AI Insights</span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white"></span>
        </button>

        {/* User Avatar with Dropdown */}
        <div className="relative pl-2 border-l border-slate-200">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 focus:outline-none"
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-slate-200 ring-2 ring-transparent hover:ring-brand-500 transition-all"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <span className="hidden sm:inline text-xs font-bold text-slate-800" suppressHydrationWarning>
              {mounted && profile?.name ? profile.name.split(' ')[0] : 'Student'}
            </span>
          </button>


          {/* User Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1 z-50 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-extrabold text-slate-900 truncate" suppressHydrationWarning>
                  {profile?.name || 'Student Profile'}
                </p>
                <p className="text-[11px] text-slate-500 truncate" suppressHydrationWarning>
                  {profile?.email || 'student@example.com'}
                </p>
              </div>

              <Link
                href="/dashboard/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                My Profile
              </Link>

              <Link
                href="/dashboard/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Settings
              </Link>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
