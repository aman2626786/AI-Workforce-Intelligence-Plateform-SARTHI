'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Compass, X, MessageSquareHeart } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { logout, openFeedbackModal } = useApp();

  type NavItem = {
    label: string;
    href: string;
    isNew?: boolean;
    isUpcoming?: boolean;
  };

  const navItems: NavItem[] = [
    { label: 'Home', href: '/dashboard' },
    { label: 'Industry Skills', href: '/dashboard/industry-skills' },
    { label: 'Skill Gap', href: '/dashboard/skill-gap' },
    { label: 'Career Roadmap', href: '/dashboard/roadmap' },
    { label: 'Job Readiness', href: '/dashboard/job-readiness' },
    { label: 'Resource Hub', href: '/dashboard/resources', isNew: true },
    { label: 'Saved Resources', href: '/dashboard/resources/saved' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const isItemActive = (itemHref: string) => {
    if (!pathname) return false;
    const current = pathname.replace(/\/+$/, '') || '/';
    const target = itemHref.replace(/\/+$/, '') || '/';
    if (target === '/dashboard') {
      return current === '/dashboard';
    }
    return current === target || current.startsWith(target + '/');
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sleek, Compact Sidebar underneath transparent title bar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white/80 backdrop-blur-md border-r border-sky-200/50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Main Student Navigation - Clean text structure, medium readable font */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          <div className="space-y-2">
            <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Student Intelligence
            </div>
            {navItems.map((item) => {
              const isActive = isItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-[15px] font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700'
                      : 'text-slate-700 hover:text-sky-700 hover:bg-sky-50'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {item.isNew && (
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-white text-sky-700'
                          : 'bg-sky-100 text-sky-700 border border-sky-200 shadow-2xs'
                      }`}
                    >
                      NEW
                    </span>
                  )}
                  {item.isUpcoming && (
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${
                        isActive
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      Upcoming
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Section - Feedback, Settings & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              openFeedbackModal();
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[15px] font-bold text-sky-700 bg-sky-50/70 hover:bg-sky-100/70 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <MessageSquareHeart className="w-4 h-4 text-sky-600" />
              <span>Feedback</span>
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-200/80 text-sky-800">
              Share
            </span>
          </button>

          <Link
            href="/dashboard/settings"
            onClick={onClose}
            className={`w-full flex items-center px-4 py-2.5 rounded-xl text-[15px] font-bold transition-all duration-200 cursor-pointer ${
              isItemActive('/dashboard/settings')
                ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                : 'text-slate-700 hover:text-sky-700 hover:bg-sky-50 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            Settings
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2.5 rounded-xl text-[15px] font-bold text-rose-600 hover:bg-rose-50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer text-left"
          >
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

