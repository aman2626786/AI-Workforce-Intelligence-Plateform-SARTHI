'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  LogOut,
  RefreshCw,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Terminal,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Single Password Login State
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  useEffect(() => {
    try {
      const auth = sessionStorage.getItem('skillvantage_admin_session');
      if (auth === 'authenticated_super_admin') {
        setIsAuthenticated(true);
      }
    } catch (e) {}
    setIsCheckingAuth(false);
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoggingIn(true);

    setTimeout(() => {
      // Secure master password: *13579*Admin
      if (adminPassword.trim() === '*13579*Admin') {
        sessionStorage.setItem('skillvantage_admin_session', 'authenticated_super_admin');
        setIsAuthenticated(true);
      } else {
        setErrorMsg('Invalid password. Access denied.');
      }
      setIsLoggingIn(false);
    }, 350);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('skillvantage_admin_session');
    setIsAuthenticated(false);
    setAdminPassword('');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100/60 via-sky-50/40 to-white flex items-center justify-center text-slate-900 font-sans">
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 bg-white px-5 py-3 rounded-2xl border-2 border-sky-200 shadow-md">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
          <span>Verifying Admin Gateway...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, render Password-Only Login Gateway in White + Sky Blue theme
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100/70 via-sky-50/40 to-white flex items-center justify-center p-4 font-sans text-slate-900 relative overflow-hidden selection:bg-sky-500 selection:text-white">
        {/* Soft atmospheric sky glow accents matching homepage */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-sky-300/40 via-sky-200/25 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 -left-32 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 -right-32 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl border-2 border-sky-300 shadow-xl shadow-sky-600/10 p-6 sm:p-9 space-y-6 transition-all hover:border-sky-400 hover:shadow-2xl hover:shadow-sky-600/15 relative z-10">
          {/* Top Brand & Passcode Badge */}
          <div className="text-center space-y-2.5">
            <BrandLogo size="lg" showText={false} className="justify-center" />

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-extrabold border border-sky-200 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Admin Command Gateway</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              MatchSkill Admin Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
              Enter the master security passcode to access system telemetry & governance.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
                Master Security Passcode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-white border-2 border-sky-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-400 pr-11 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 p-1 cursor-pointer transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !adminPassword}
              className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold transition-all shadow-md shadow-sky-600/25 hover:shadow-lg hover:shadow-sky-600/35 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Passcode...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-white" />
                  <span>Access Admin Command Center</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-sky-100 text-center">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-slate-600 hover:text-sky-600 transition-colors inline-flex items-center gap-1.5"
            >
              <span>← Back to Student Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Shell (70% White + 30% Sky Blue Theme)
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100/60 via-sky-50/40 to-white text-slate-900 font-sans selection:bg-sky-500 selection:text-white">
      {children}
    </div>
  );
}
