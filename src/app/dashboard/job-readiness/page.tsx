'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';

export default function JobReadinessPage() {
  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200">
            Upcoming in Future
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Job Readiness Intelligence</h1>
        <p className="text-sm sm:text-base text-slate-600 font-normal mt-1">
          Direct employer matching and active job telemetry are currently being developed.
        </p>
      </div>

      {/* Clean Upcoming Card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-sky-200 shadow-soft-sm text-center max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
          <Clock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Feature Launching Soon</h2>
          <p className="text-sm text-slate-600 font-normal leading-relaxed max-w-md mx-auto">
            Job Readiness matching and real-time application compatibility scoring will be available in an upcoming update. You can currently track industry requirements, evaluate your skill gaps, and follow your personalized career roadmap.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard/industry-skills"
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-slate-900 text-white text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            Explore Industry Skills
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard/roadmap"
            className="px-5 py-2.5 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-slate-700 text-sm font-semibold transition-all"
          >
            View Career Roadmap
          </Link>
        </div>
      </div>
    </div>
  );
}
