'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, CheckCircle2, ShieldCheck, Loader2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { authService } from '@/services/authService';
import { useApp } from '@/context/AppContext';

export default function LoginPage() {
  const router = useRouter();
  const { addToast, refreshData } = useApp();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1-Click Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      const user = await authService.signInWithGoogle();
      addToast(`Welcome back, ${user.name || 'Student'}! Signed in successfully.`, 'success');
      await refreshData();
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Google Auth Failed:', err);
      setErrorMessage(err.message || 'Google sign-in was cancelled or failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans bg-white">
      {/* Left Pane - Brand Blue Hero Panel */}
      <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900 p-8 sm:p-12 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-20 top-20 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <Link href="/" className="flex items-center gap-3 w-fit group">
          <div className="w-10 h-10 rounded-xl bg-white text-brand-600 flex items-center justify-center shadow-md font-bold group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-white">SARTHI</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/20 text-white">AI</span>
            </div>
            <p className="text-xs text-brand-100 font-medium">From Skills to Careers</p>
          </div>
        </Link>

        {/* Main Value Proposition */}
        <div className="my-12 space-y-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-brand-100 border border-white/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Instant Google Authentication</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Welcome back to your personalized career intelligence dashboard.
          </h1>

          <div className="space-y-4">
            {[
              'Direct access to your verified Student Profile',
              'Real-time skill gaps aligned with 10,000+ job postings',
              'Sequenced 4-stage Career Learning Roadmap',
              'Dynamic Job Readiness Score calculated live',
            ].map((bullet, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm font-semibold text-brand-100">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-brand-200 font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-300" />
          <span>© {new Date().getFullYear()} SARTHI AI • Secure Google OAuth 2.0 Access</span>
        </div>
      </div>

      {/* Right Pane - Google 1-Click Sign-In */}
      <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="mb-8">
          <span className="text-xs font-extrabold text-brand-600 uppercase tracking-wider bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Student Access
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Sign In to Dashboard
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
            One-click sign in with your Google account to access your personalized career roadmap and skill gap analytics.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-3 animate-fade-in shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google OAuth Live Button */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            type="button"
            className="w-full py-4 px-6 rounded-2xl border-2 border-slate-200 hover:border-brand-500 bg-white hover:bg-slate-50/80 active:scale-[0.98] text-slate-800 text-sm font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                <span>Authenticating with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
              </>
            )}
          </button>

          {/* Secure Note Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Passwordless & Encrypted</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              No manual email or passwords needed. Your identity and student profile are protected and verified directly through Google.
            </p>
          </div>
        </div>

        {/* Link to Signup for new students */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs font-semibold text-slate-600">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/signup"
            className="text-brand-600 hover:text-brand-700 font-extrabold hover:underline inline-flex items-center gap-1 ml-1"
          >
            Create an Account
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
