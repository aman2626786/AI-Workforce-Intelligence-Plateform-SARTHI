'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CompanyMatchCard } from '@/components/features/CompanyMatchCard';
import { JobDetailModal } from '@/components/features/JobDetailModal';
import { ResumeUploadModal } from '@/components/features/ResumeUploadModal';
import { FilterBar } from '@/components/ui/FilterBar';
import { JobMatch } from '@/data/jobs';
import { Briefcase, Sparkles, Building2, Search, Lightbulb, Upload } from 'lucide-react';

export default function JobReadinessPage() {
  const { jobs, activeRole, setActiveRole, activeLocation, setActiveLocation, openAiDrawerWithTopic } = useApp();

  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Jobs & Companies You Are Ready For</h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Discover active hiring companies where your verified skills give you the highest compatibility match.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsResumeModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload / Update Resume
          </button>

          <button
            onClick={() => openAiDrawerWithTopic('Job Application Targeting Strategy')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-brand-600" />
            Ask AI Job Match Strategy
          </button>
        </div>
      </div>

      {/* INTUITION GUIDANCE BANNER */}
      <div className="p-4 rounded-2xl bg-brand-50/80 border border-brand-200 text-xs text-slate-700 flex items-start gap-3 shadow-soft-sm">
        <Lightbulb className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-brand-900 text-sm font-extrabold block">💡 Jobs & Company Readiness — What this page answers for you:</strong>
          <p className="leading-relaxed">
            Instead of applying blindly, this page compares your verified skills against live job descriptions to calculate <strong>your exact match score (e.g. 88% Match)</strong> for each company. Click <em>"View Match Analysis"</em> to see why you match and what 1 or 2 missing skills will get you to 100%.
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="space-y-4">
        <FilterBar
          selectedRole={activeRole}
          onRoleChange={setActiveRole}
          selectedLocation={activeLocation}
          onLocationChange={setActiveLocation}
        />

        {/* Company Search Filter Input */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company name or specific role..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-soft-sm text-slate-800"
          />
        </div>
      </div>

      {/* JOBS GRID */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Matching Hiring Opportunities ({filteredJobs.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">Ranked by overall skill compatibility match</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <CompanyMatchCard key={job.id} job={job} onViewMatch={(j) => setSelectedJob(j)} />
          ))}
        </div>
      </div>

      {/* Reusable Resume Upload Modal */}
      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
      />

      {/* Detail Slideover Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
