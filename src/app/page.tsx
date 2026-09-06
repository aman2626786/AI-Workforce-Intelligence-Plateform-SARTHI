'use client';

import React from 'react';
import Link from 'next/link';
import { LandingHeader } from '@/components/layout/LandingHeader';
import {
  Compass,
  ArrowRight,
  TrendingUp,
  Target,
  Map,
  Briefcase,
  Sparkles,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* SIH Banner Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold mb-8 shadow-soft-sm">
            <Sparkles className="w-4 h-4 text-brand-600 animate-pulse" />
            <span>SIH 2026 Problem Statement 26134 • AI Career Intelligence</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.1]">
            From Skills to <span className="text-brand-600">Careers</span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Understand what the industry demands, discover your skill gaps, and build a career roadmap based on real job-market signals.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-base shadow-lg shadow-brand-600/25 transition-all hover:scale-[1.02]"
            >
              Start Your Career Journey
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-base border border-slate-200 shadow-soft-sm transition-all"
            >
              Explore Industry Skills
            </Link>
          </div>

          {/* Hero Visual Dashboard Product Preview */}
          <div className="mt-16 max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-4 sm:p-8 text-left relative">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-slate-400 ml-2">SARTHI AI Engine • Live Market Preview</span>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● 10,000+ Active Job Signals
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Card 1: Career Readiness */}
              <div className="p-5 rounded-2xl bg-brand-50/80 border border-brand-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Career Readiness</span>
                  <div className="text-3xl font-black text-brand-900 mt-1">72%</div>
                  <p className="text-[11px] font-semibold text-brand-600 mt-0.5">Target: Data Analyst</p>
                </div>
                <div className="w-14 h-14 rounded-full border-4 border-brand-600 border-t-transparent flex items-center justify-center text-xs font-bold text-brand-700 bg-white">
                  72%
                </div>
              </div>

              {/* Card 2: Top Skill Gaps */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Top Skill Gaps</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-700">3 Critical</span>
                </div>
                <div className="space-y-1.5 text-xs font-semibold">
                  <div className="flex justify-between text-slate-800">
                    <span>Advanced SQL</span>
                    <span className="text-rose-600 font-bold">Gap: Intermediate → Advanced</span>
                  </div>
                  <div className="flex justify-between text-slate-800">
                    <span>Business Statistics</span>
                    <span className="text-rose-600 font-bold">Gap: Basic → Intermediate</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Next Best Skill */}
              <div className="p-5 rounded-2xl bg-purple-50/80 border border-purple-200">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Next Best Skill</span>
                <h4 className="text-base font-extrabold text-purple-950 mt-1">Power BI DAX Measures</h4>
                <p className="text-xs text-purple-700 mt-1">Boosts job match score by +14%</p>
              </div>
            </div>
          </div>

          {/* Credibility Statistics Bar */}
          <div className="mt-16 pt-10 border-t border-slate-200 max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
              Industry Skill Signals & Platform Benchmarks (Demo Dataset)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
                <div className="text-3xl font-black text-slate-900 tracking-tight">50+</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Career Roles</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
                <div className="text-3xl font-black text-brand-600 tracking-tight">10,000+</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Job Market Signals</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
                <div className="text-3xl font-black text-slate-900 tracking-tight">100+</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Skills Tracked</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-soft-sm">
                <div className="text-3xl font-black text-emerald-600 tracking-tight">Real-Time</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Skill Intelligence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Core Capabilities Section */}
      <section id="features" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">The Complete Journey</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Five Questions Answered For Every Student
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {
                step: '01',
                title: 'Student Profile',
                desc: 'Extract skills from resume and self-reported inputs verified against standard benchmarks.',
                icon: ShieldCheck,
              },
              {
                step: '02',
                title: 'Industry Intelligence',
                desc: 'Track exact skill demand % and rising trends across 10,000+ live job market postings.',
                icon: TrendingUp,
              },
              {
                step: '03',
                title: 'Personalized Skill Gap',
                desc: 'Compare your current level vs industry requirements to identify critical missing gaps.',
                icon: Target,
              },
              {
                step: '04',
                title: 'Career Roadmap',
                desc: 'Follow a sequenced 4-stage learning path designed to bridge gaps efficiently.',
                icon: Map,
              },
              {
                step: '05',
                title: 'Job Readiness',
                desc: 'Discover exact companies and roles where your current skills give highest match rates.',
                icon: Briefcase,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-brand-300 hover:shadow-soft-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                        {item.step}
                      </span>
                      <Icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <h4 className="text-lg font-extrabold text-slate-900 mb-2">{item.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white">SARTHI AI</span>
              <p className="text-[11px] text-slate-400">SIH 2026 Problem Statement 26134 Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              Admin Portal
            </Link>
            <p className="text-xs text-slate-400">© 2026 SARTHI AI. Real-Time Labor Market Intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
