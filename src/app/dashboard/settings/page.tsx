'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  User,
  Bell,
  ShieldCheck,
  Briefcase,
  MapPin,
  Save,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  FileText,
} from 'lucide-react';

const ROLE_GROUPS = [
  {
    group: 'Artificial Intelligence & Machine Learning',
    roles: [
      'Data Scientist',
      'AI / ML Engineer',
      'Machine Learning Engineer',
      'Computer Vision Engineer',
      'NLP Engineer',
      'MLOps Engineer',
    ],
  },
  {
    group: 'Data & Analytics',
    roles: [
      'Data Analyst',
      'BI Analyst',
      'Data Engineer',
      'Analytics Engineer',
    ],
  },
  {
    group: 'Software & Full-Stack Development',
    roles: [
      'Full-Stack Developer',
      'Software Engineer',
      'Frontend Developer',
      'Backend Developer',
    ],
  },
  {
    group: 'Cloud, Infrastructure & Security',
    roles: [
      'Cloud & DevOps Architect',
      'Cybersecurity Analyst',
      'Site Reliability Engineer (SRE)',
      'Security Engineer',
    ],
  },
  {
    group: 'Robotics & Hardware Systems',
    roles: [
      'Robotics Engineer',
      'Embedded Systems Engineer',
      'IoT & Firmware Engineer',
    ],
  },
];

const LOCATION_OPTIONS = [
  'Jaipur',
  'Bengaluru',
  'Delhi NCR (Noida / Gurgaon)',
  'Mumbai',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Remote (Work from Anywhere)',
  'Open to All India',
];

export default function SettingsPage() {
  const { profile, activeRole, activeLocation, updateProfileInfo, addToast } = useApp();

  // Profile Form State
  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [targetRole, setTargetRole] = useState(profile?.targetRole || activeRole || 'Data Scientist');
  const [location, setLocation] = useState(profile?.targetLocation || profile?.location || activeLocation || 'Jaipur');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Notification Toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [skillSignalAlerts, setSkillSignalAlerts] = useState(true);
  const [jobMatchAlerts, setJobMatchAlerts] = useState(true);

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      if (profile.email) setEmail(profile.email);

      const currentRole = profile.targetRole || activeRole || 'Data Scientist';
      const allPredefinedRoles = ROLE_GROUPS.flatMap((g) => g.roles);
      if (allPredefinedRoles.includes(currentRole)) {
        setTargetRole(currentRole);
        setIsCustomRole(false);
      } else if (currentRole) {
        setTargetRole('__CUSTOM__');
        setIsCustomRole(true);
        setCustomRoleInput(currentRole);
      }

      const currentLoc = profile.targetLocation || profile.location || activeLocation || 'Jaipur';
      if (LOCATION_OPTIONS.includes(currentLoc)) {
        setLocation(currentLoc);
        setIsCustomLocation(false);
      } else if (currentLoc) {
        setLocation('__CUSTOM__');
        setIsCustomLocation(true);
        setCustomLocationInput(currentLoc);
      }
    }
  }, [profile, activeRole, activeLocation]);

  const handleRoleSelect = (value: string) => {
    if (value === '__CUSTOM__') {
      setIsCustomRole(true);
      setCustomRoleInput(targetRole !== '__CUSTOM__' ? targetRole : '');
      setTargetRole('__CUSTOM__');
    } else {
      setIsCustomRole(false);
      setTargetRole(value);
    }
  };

  const handleLocationSelect = (value: string) => {
    if (value === '__CUSTOM__') {
      setIsCustomLocation(true);
      setCustomLocationInput(location !== '__CUSTOM__' ? location : '');
      setLocation('__CUSTOM__');
    } else {
      setIsCustomLocation(false);
      setLocation(value);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalRole = isCustomRole ? customRoleInput.trim() || 'Data Scientist' : targetRole;
      const finalLocation = isCustomLocation ? customLocationInput.trim() || 'Jaipur' : location;

      await updateProfileInfo({
        name: name.trim() || profile?.name || 'Student',
        email: email.trim() || profile?.email || '',
        targetRole: finalRole,
        targetLocation: finalLocation,
      });
    } catch (err) {
      console.warn('Error saving profile settings:', err);
      addToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // User initials for avatar
  const initials = (name || profile?.name || 'Student')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'ST';

  return (
    <div className="space-y-8 animate-fade-in font-sans max-w-6xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Manage your engineering specialization, location preferences, and telemetry alerts.
        </p>
      </div>

      {/* Profile Overview Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-sky-600/20 shrink-0">
            {initials}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {name || profile?.name || 'Student'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Google Verified Account
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {email || profile?.email || 'Logged in via Google OAuth'}
            </p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                Role: {isCustomRole ? customRoleInput || 'Custom' : targetRole}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                Location: {isCustomLocation ? customLocationInput || 'Custom' : location}
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/profile"
          className="group inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white shadow-md shadow-sky-600/20 hover:shadow-lg hover:shadow-sky-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all self-start md:self-auto cursor-pointer shrink-0"
        >
          <FileText className="w-4 h-4 text-sky-200 group-hover:text-white transition-colors shrink-0" />
          <span className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap">
            View Verified Resume & Profile
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-sky-200 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Career Targets & Personal Information */}
        <div className="lg:col-span-8 space-y-6">
          {/* Career Targets & Preferences Form */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
                <Briefcase className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Career Targets & Role Specialization</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Skill gaps, employer standards, and learning roadmaps calibrate to this target role.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Target Role Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Target Career Specialization
                  </label>
                  <span className="text-[11px] font-medium text-sky-700">
                    Calibrates Industry Telemetry
                  </span>
                </div>

                <select
                  value={isCustomRole ? '__CUSTOM__' : targetRole}
                  onChange={(e) => handleRoleSelect(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900 transition-colors"
                >
                  <option value="" disabled>-- Select an Engineering Specialization --</option>
                  {ROLE_GROUPS.map((group) => (
                    <optgroup key={group.group} label={group.group}>
                      {group.roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="__CUSTOM__">✨ Other / Enter Custom Role...</option>
                </select>

                {/* Custom Role Input */}
                {isCustomRole && (
                  <div className="pt-2 animate-fade-in">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Custom Career Role Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customRoleInput}
                      onChange={(e) => setCustomRoleInput(e.target.value)}
                      placeholder="e.g. Quantitative Analyst, Blockchain Developer"
                      className="w-full px-4 py-2.5 text-xs bg-white border border-sky-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* Preferred Location */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Preferred Work Location
                </label>
                <select
                  value={isCustomLocation ? '__CUSTOM__' : location}
                  onChange={(e) => handleLocationSelect(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900 transition-colors"
                >
                  {LOCATION_OPTIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                  <option value="__CUSTOM__">📍 Enter Other Location...</option>
                </select>

                {/* Custom Location Input */}
                {isCustomLocation && (
                  <div className="pt-2 animate-fade-in">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Custom Location / City
                    </label>
                    <input
                      type="text"
                      required
                      value={customLocationInput}
                      onChange={(e) => setCustomLocationInput(e.target.value)}
                      placeholder="e.g. Chandigarh, Indore, Kochi, Global Remote"
                      className="w-full px-4 py-2.5 text-xs bg-white border border-sky-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* Student Identity Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Student Email Address</label>
                    <span className="text-[10px] font-semibold text-emerald-600">Google Managed</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    disabled
                    readOnly
                    className="w-full px-4 py-2.5 text-xs bg-slate-100/70 border border-slate-200 rounded-xl text-slate-600 font-medium cursor-not-allowed select-none"
                    title="Email is verified through Google authentication"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Updates apply across your entire dashboard in real time.
                </span>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaving ? 'Saving Changes...' : 'Save Career Preferences'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Notifications & Session Management */}
        <div className="lg:col-span-4 space-y-6">
          {/* Notification Preferences */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <Bell className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Telemetry Notifications</h3>
                <p className="text-xs text-slate-500 font-medium">Job market alert preferences</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-800">
              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-colors cursor-pointer gap-3">
                <div className="space-y-0.5">
                  <span className="block font-bold text-slate-900">Weekly Skill Signal Telemetry</span>
                  <span className="block text-[11px] text-slate-500 font-normal leading-relaxed">
                    Digest of in-demand tech shifts and employer hiring requirements.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => {
                    setEmailAlerts(e.target.checked);
                    addToast(`Weekly signal summary ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
                  }}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer mt-0.5"
                />
              </label>

              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-colors cursor-pointer gap-3">
                <div className="space-y-0.5">
                  <span className="block font-bold text-slate-900">Emerging Framework Alerts</span>
                  <span className="block text-[11px] text-slate-500 font-normal leading-relaxed">
                    Spikes when newly emerging frameworks gain traction in your role.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={skillSignalAlerts}
                  onChange={(e) => {
                    setSkillSignalAlerts(e.target.checked);
                    addToast(`Emerging framework alerts ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
                  }}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer mt-0.5"
                />
              </label>

              <label className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-colors cursor-pointer gap-3">
                <div className="space-y-0.5">
                  <span className="block font-bold text-slate-900">Readiness Score Updates</span>
                  <span className="block text-[11px] text-slate-500 font-normal leading-relaxed">
                    Notifications when completed roadmap modules boost your match level.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={jobMatchAlerts}
                  onChange={(e) => {
                    setJobMatchAlerts(e.target.checked);
                    addToast(`Readiness notifications ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
                  }}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 cursor-pointer mt-0.5"
                />
              </label>
            </div>
          </div>

          {/* Google Account Security & Authentication Status */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Google Account Security</h3>
                <p className="text-xs text-slate-500 font-medium">OAuth 2.0 Single Sign-On</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-normal leading-relaxed">
              Your profile, extracted resume data, and roadmap progress are securely synced to your verified Google account.
            </p>

            <div className="pt-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Authentication</span>
                <span className="font-semibold text-slate-800">Google OAuth 2.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Cloud Telemetry Sync</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Password Management</span>
                <span className="font-semibold text-slate-600">Google Managed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
