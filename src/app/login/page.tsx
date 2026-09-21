'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { authService } from '@/services/authService';
import { useApp } from '@/context/AppContext';
import { careerService } from '@/services/careerService';

export default function LoginPage() {
  const router = useRouter();
  const { addToast, refreshData } = useApp();

  // Mode: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  // Notice / feedback: { type: 'info' | 'blocked' | 'error', message: string }
  const [authNotice, setAuthNotice] = useState<{
    type: 'info' | 'blocked' | 'error';
    message: string;
  } | null>(null);

  // 1-Click Google OAuth Authentication
  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setAuthNotice(null);

    // Safety timeout to prevent getting stuck if popup is closed or blocked
    const safetyTimeout = setTimeout(() => {
      setIsGoogleLoading(false);
    }, 12000);

    try {
      const user = await authService.signInWithGoogle();
      clearTimeout(safetyTimeout);

      if (authMode === 'signup') {
        addToast(`Welcome ${user.name || 'Student'}! Let's complete your profile.`, 'success');
        careerService.resetProfileForNewUser({
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
        });
        await refreshData();
        window.location.assign('/onboarding');
      } else {
        addToast(`Welcome back, ${user.name || 'Student'}! Signed in successfully.`, 'success');
        await refreshData();
        window.location.assign('/dashboard');
      }
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      
      if (err?.isCancelled || err?.code === 'auth/popup-closed-by-user') {
        setAuthNotice({
          type: 'info',
          message: 'Google sign-in popup was closed. Click below whenever you are ready to sign in.',
        });
      } else if (err?.code === 'auth/popup-blocked') {
        setAuthNotice({
          type: 'blocked',
          message: 'Google popup was blocked by your browser. Please allow popups for localhost:3000, or explore with Demo Student access below.',
        });
      } else {
        console.warn('Google Auth notice:', err?.message || err);
        setAuthNotice({
          type: 'error',
          message: err?.message || 'Google authentication could not be completed. Please try again or explore with Demo Access.',
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // 1-Click Demo Explorer
  const handleDemoSignIn = async () => {
    setIsDemoLoading(true);
    setAuthNotice(null);
    try {
      const demoUser = await authService.demoLogin();
      addToast(`Signed in as Demo Student (${demoUser.name})!`, 'info');
      await refreshData();
      window.location.assign('/dashboard');
    } catch (err: any) {
      console.warn('Demo login notice:', err);
      setAuthNotice({
        type: 'error',
        message: 'Could not launch demo session. Please try Google authentication.',
      });
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/80 via-white to-sky-50/50 text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar with Highlighted Hover States */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 z-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 group cursor-pointer transition-transform hover:scale-105"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20 group-hover:bg-slate-900 group-hover:shadow-lg transition-all duration-200">
            <Compass className="w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
            MatchSkill
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white/80 border border-sky-200/80 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-700 hover:scale-105 active:scale-95 shadow-2xs transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <Link
            href="/resources"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white/80 border border-sky-200/80 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-700 hover:scale-105 active:scale-95 shadow-2xs transition-all duration-200 cursor-pointer"
          >
            <span>Explore Resources</span>
          </Link>
        </div>
      </header>

      {/* Main Single Centered Card: Pure Authentication */}
      <main className="w-full max-w-md sm:max-w-lg mx-auto my-auto z-10 py-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border-2 border-sky-300 shadow-xl shadow-sky-600/10 p-6 sm:p-9 space-y-6 transition-all hover:border-sky-400 hover:shadow-2xl hover:shadow-sky-600/15">
          {/* Top Brand Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-extrabold border border-sky-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Career Intelligence Access</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {authMode === 'signin' ? 'Sign In to MatchSkill' : 'Create Your Account'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-sm mx-auto leading-relaxed">
              {authMode === 'signin'
                ? 'Welcome back! Sign in with your Google account to access your personalized career telemetry.'
                : 'Authenticate with Google to calculate your skill gaps against 10,000+ verified tech jobs.'}
            </p>
          </div>

          {/* Highlighted Mode Selector Tabs (Sign In vs Create Account) */}
          <div className="p-1.5 bg-sky-50/90 rounded-2xl border border-sky-200 flex gap-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setAuthNotice(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border ${
                authMode === 'signin'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/25 scale-[1.02]'
                  : 'bg-white/70 text-slate-600 border-transparent hover:bg-white hover:text-sky-700 hover:border-sky-300 hover:scale-[1.01]'
              }`}
            >
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setAuthNotice(null);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border ${
                authMode === 'signup'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/25 scale-[1.02]'
                  : 'bg-white/70 text-slate-600 border-transparent hover:bg-white hover:text-sky-700 hover:border-sky-300 hover:scale-[1.01]'
              }`}
            >
              <span>Create Account</span>
            </button>
          </div>

          {/* Status Notice / Feedback Box */}
          {authNotice && (
            <div
              className={`p-3.5 rounded-2xl border-2 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-sm ${
                authNotice.type === 'info'
                  ? 'bg-sky-50 border-sky-200 text-sky-800'
                  : authNotice.type === 'blocked'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {authNotice.type === 'info' ? (
                <Sparkles className="w-4 h-4 shrink-0 text-sky-600" />
              ) : authNotice.type === 'blocked' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              )}
              <span className="flex-1 leading-relaxed">{authNotice.message}</span>
              <button
                type="button"
                onClick={() => setAuthNotice(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer hover:scale-110 transition-transform p-1"
                aria-label="Dismiss notice"
              >
                ✕
              </button>
            </div>
          )}

          {/* Primary Action: Highlighted Google 1-Click Button */}
          <div className="space-y-3.5">
            <button
              onClick={handleGoogleAuth}
              disabled={isGoogleLoading}
              type="button"
              className="w-full py-4 px-6 rounded-2xl border-2 border-sky-300 hover:border-sky-600 bg-white hover:bg-sky-50/70 text-slate-800 text-sm font-extrabold shadow-md hover:shadow-xl hover:shadow-sky-500/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:scale-115 transition-transform duration-200 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.01 10.04.01 12s.45 3.8 1.26 5.42l4.01-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.23 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span className="text-slate-900 group-hover:text-sky-900">
                    {authMode === 'signin' ? 'Sign In with Google' : 'Create Account with Google'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1.5 transition-all duration-200" />
                </>
              )}
            </button>

            {/* Google Authentication Assurance */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct Google OAuth 2.0 • No password needed</span>
            </div>
          </div>

          {/* Highlighted Cross-Switch Box: "Account nahi bana hua to create account show ho" */}
          <div className="p-4 rounded-2xl bg-sky-50/70 border-2 border-sky-200 hover:border-sky-400 hover:bg-sky-100/60 hover:shadow-md transition-all duration-200 cursor-pointer space-y-2">
            {authMode === 'signin' ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-slate-900">Don&apos;t have an account yet?</h4>
                  <p className="text-[11px] text-slate-600">Register in seconds with your student profile.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthNotice(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-sky-300 hover:bg-sky-600 hover:text-white hover:border-sky-600 text-sky-700 text-xs font-extrabold shadow-2xs hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-slate-900">Already registered with MatchSkill?</h4>
                  <p className="text-[11px] text-slate-600">Sign in to resume your active dashboard.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthNotice(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-sky-300 hover:bg-sky-600 hover:text-white hover:border-sky-600 text-sky-700 text-xs font-extrabold shadow-2xs hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Demo Student Access (Highlighted on hover) */}
          <div className="space-y-3 pt-1">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-sky-200 w-full" />
              <span className="bg-white px-3 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold shrink-0">
                1-Click Instant Preview
              </span>
            </div>

            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={isDemoLoading}
              className="w-full py-2.5 px-4 rounded-xl border-2 border-sky-200/90 hover:border-sky-400 bg-sky-50/60 hover:bg-sky-100/80 text-sky-900 text-xs font-extrabold shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <UserCheck className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
              <span>{isDemoLoading ? 'Launching demo dashboard...' : 'Explore as Demo Student (Instant)'}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Subtle Footer */}
      <footer className="w-full max-w-5xl mx-auto py-3 text-center text-xs text-slate-400 font-medium z-10">
        © {new Date().getFullYear()} MatchSkill AI • Google OAuth 2.0 Encrypted Access
      </footer>
    </div>
  );
}
