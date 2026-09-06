'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Settings,
  User,
  Bell,
  Lock,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Briefcase,
  MapPin,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { profile, activeRole, setActiveRole, activeLocation, setActiveLocation, addToast } = useApp();

  // Settings State
  const [name, setName] = useState(profile?.name || 'Yogesh Kumar');
  const [email, setEmail] = useState(profile?.email || 'yogesh.kumar@student.edu');
  const [targetRole, setTargetRole] = useState(activeRole);
  const [location, setLocation] = useState(activeLocation);

  // Notification Toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [skillSignalAlerts, setSkillSignalAlerts] = useState(true);
  const [jobMatchAlerts, setJobMatchAlerts] = useState(true);

  // Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveRole(targetRole);
    setActiveLocation(location);
    addToast('Settings & Account Preferences saved successfully!', 'success');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) {
      addToast('Please fill out all password fields', 'warning');
      return;
    }
    setCurrentPass('');
    setNewPass('');
    addToast('Password updated successfully!', 'success');
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out of SARTHI AI?')) {
      addToast('Logged out successfully', 'info');
      router.push('/login');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Account & Platform Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage your personal details, career preferences, notification alerts, and security.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold border border-rose-200 transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          Log Out / Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Account & Profile Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile & Career Preference Settings */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <User className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Student Profile Information</h3>
                <p className="text-xs text-slate-500 font-medium">Update your display name, contact email, and career targets</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Career Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
                  >
                    <option value="Data Analyst">Data Analyst</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="ML Engineer">ML Engineer</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="BI Analyst">BI Analyst</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Work Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password Settings */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <Lock className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Security & Password</h3>
                <p className="text-xs text-slate-500 font-medium">Update your account authentication credentials</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Notifications & Danger Zone */}
        <div className="space-y-6 lg:col-span-1">
          {/* Notification Preferences */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <Bell className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Notifications</h3>
                <p className="text-xs text-slate-500 font-medium">Alert preferences</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-800">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                <span>Weekly Skill Signal Summary</span>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                <span>Emerging Skill Trajectory Alerts</span>
                <input
                  type="checkbox"
                  checked={skillSignalAlerts}
                  onChange={(e) => setSkillSignalAlerts(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                <span>Job Readiness Match Updates</span>
                <input
                  type="checkbox"
                  checked={jobMatchAlerts}
                  onChange={(e) => setJobMatchAlerts(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Account Danger Zone / Logout Card */}
          <div className="p-6 rounded-3xl bg-rose-50/60 border border-rose-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
              <LogOut className="w-4 h-4 text-rose-600" />
              Session & Logout
            </div>

            <p className="text-xs text-rose-700 font-medium leading-relaxed">
              Logging out will clear your active student session. Your progress and resume data will remain safely stored.
            </p>

            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Log Out of Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
