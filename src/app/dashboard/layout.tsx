'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100/50 via-sky-50/30 to-white flex flex-col font-sans text-slate-900 selection:bg-sky-500 selection:text-white relative overflow-x-hidden">
      {/* Dynamic ambient radial gradients for depth like home page */}
      <div className="fixed -top-32 right-1/4 w-[800px] h-[400px] bg-gradient-to-b from-sky-300/30 via-sky-200/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-64 -left-32 w-80 h-80 bg-sky-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Full-width continuous Top Title Bar spanning across the complete screen */}
      <TopNavbar onOpenSidebar={() => setIsSidebarOpen((prev) => !prev)} />

      {/* Sleek, Compact Left Sidebar underneath Title Bar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area - Generous breathing room, no cramped columns */}
      <div className="flex-1 pt-16 lg:pl-64 flex flex-col min-h-screen min-w-0">
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6 sm:space-y-7 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
