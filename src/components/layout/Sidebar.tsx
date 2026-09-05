'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Compass,
  LayoutDashboard,
  UserCircle,
  TrendingUp,
  Target,
  Map,
  Briefcase,
  Settings,
  Sparkles,
  X,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, activeRole, openAiDrawerWithTopic, addToast } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Career Profile', href: '/dashboard/profile', icon: UserCircle },
    { label: 'Industry Skills', href: '/dashboard/industry-skills', icon: TrendingUp },
    { label: 'Skill Gap', href: '/dashboard/skill-gap', icon: Target },
    { label: 'Career Roadmap', href: '/dashboard/roadmap', icon: Map },
    { label: 'Job Readiness', href: '/dashboard/job-readiness', icon: Briefcase },
  ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of SkillVantage AI?')) {
      addToast('Logged out successfully', 'info');
      router.push('/login');
    }
  };

  const displayName = mounted && profile?.name ? profile.name : 'Student Profile';
  const displayRole = mounted && (profile?.targetRole || activeRole) ? (profile?.targetRole || activeRole) : 'Robotics Engineer';

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">SKILLVANTAGE</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 border border-brand-200">AI</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">From Skills to Careers</p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Student Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Student Intelligence
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* AI Intelligence Assistant Trigger Card */}
          <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100/80">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-brand-600 animate-pulse" />
              <span className="text-xs font-bold text-brand-900">AI Assistant</span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Get contextual industry insights and personalized recommendations.
            </p>
            <button
              onClick={() => openAiDrawerWithTopic('Career Intelligence Strategy')}
              className="w-full py-2 px-3 bg-white hover:bg-brand-600 hover:text-white text-brand-600 text-xs font-bold rounded-xl border border-brand-200 shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI Assistant
            </button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-100 space-y-1">
          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              pathname === '/dashboard/settings'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className={`w-4 h-4 ${pathname === '/dashboard/settings' ? 'text-white' : 'text-slate-400'}`} />
            Settings
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            Log Out
          </button>

          {/* User Profile Footer */}
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between px-2">
            <Link href="/dashboard/profile" className="flex items-center gap-3 overflow-hidden group">
              <img
                src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt="User"
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors" suppressHydrationWarning>
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 truncate" suppressHydrationWarning>{displayRole} Candidate</p>
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};
