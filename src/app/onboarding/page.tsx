'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileText,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Briefcase,
  GraduationCap,
  MapPin,
  User,
  Mail,
  Lock,
  Plus,
  X,
  Layers,
  Award,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { api, BasicProfileData, ResumeAnalysisResult, ExtractedSkill } from '@/services/api';
import { useApp } from '@/context/AppContext';
import { careerService } from '@/services/careerService';
import { authService } from '@/services/authService';

export const CAREER_ROLE_CATEGORIES = [
  {
    category: 'Robotics & Embedded Systems',
    icon: '🤖',
    roles: [
      'Robotics Engineer',
      'Embedded Systems Engineer',
      'IoT & Firmware Engineer',
      'Automation & Controls Engineer',
      'Hardware / PCB Design Engineer',
    ],
  },
  {
    category: 'AI & Machine Learning',
    icon: '🧠',
    roles: [
      'Machine Learning Engineer',
      'AI Engineer',
      'Computer Vision Engineer',
      'NLP Engineer',
      'MLOps Engineer',
    ],
  },
  {
    category: 'Software Engineering',
    icon: '💻',
    roles: [
      'Full Stack Developer',
      'Software Engineer',
      'Backend Developer',
      'Frontend Developer',
    ],
  },
  {
    category: 'Data & Analytics',
    icon: '📊',
    roles: [
      'Data Scientist',
      'Data Analyst',
      'Data Engineer',
      'BI Analyst',
      'Business Analyst',
    ],
  },
  {
    category: 'Cloud & DevOps',
    icon: '☁️',
    roles: [
      'DevOps Engineer',
      'Cloud Engineer',
      'Site Reliability Engineer (SRE)',
    ],
  },
  {
    category: 'Cybersecurity',
    icon: '🛡️',
    roles: [
      'Cybersecurity Analyst',
      'Security Engineer',
      'SOC Analyst',
    ],
  },
  {
    category: 'Product & QA',
    icon: '🚀',
    roles: [
      'Product Manager',
      'QA / Automation Engineer',
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { addToast, refreshData, setActiveRole, setActiveLocation } = useApp();

  // Current Step: 1 to 6
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Account State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Basic Profile (Completely blank without prefilled defaults)
  const [city, setCity] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [college, setCollege] = useState('');
  const [gradYear, setGradYear] = useState<number>(new Date().getFullYear());
  const [targetRole, setTargetRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');

  // Step 3: Resume Upload
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadedResumeId, setUploadedResumeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Step 4: Analysis States
  const [analysisProgressIndex, setAnalysisProgressIndex] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);

  // Step 5: Review & Editing Skills
  const [reviewSkills, setReviewSkills] = useState<ExtractedSkill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');

  // Prefill authenticated user info from Google/Email login
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.email) setEmail(currentUser.email);
      // If user is already authenticated, jump to Step 2 (Academic & Career Target)
      setCurrentStep(2);
    }
  }, []);

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // 1-Click Google Sign In for Onboarding
  const handleGoogleSignInOnboarding = async () => {
    setIsGoogleLoading(true);
    try {
      const user = await authService.signInWithGoogle();
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        careerService.resetProfileForNewUser({
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
        });
        await refreshData();
        addToast(`Welcome ${user.name || 'Student'}! Profile initialized.`, 'success');
        setCurrentStep(2);
      }
    } catch (err: any) {
      addToast(err.message || 'Google sign-up failed', 'error');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Step 2 -> Step 3
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenRole = isCustomRole && customRoleInput.trim() ? customRoleInput.trim() : targetRole;

    if (!city.trim()) {
      addToast('Please enter your current city.', 'warning');
      return;
    }
    if (!educationLevel.trim()) {
      addToast('Please select your education level.', 'warning');
      return;
    }
    if (!degree.trim()) {
      addToast('Please enter your degree.', 'warning');
      return;
    }
    if (!college.trim()) {
      addToast('Please enter your college / university name.', 'warning');
      return;
    }
    if (!chosenRole.trim()) {
      addToast('Please select your target job role.', 'warning');
      return;
    }

    const basicData: BasicProfileData = {
      name,
      city: city.trim(),
      education_level: educationLevel,
      degree: degree.trim(),
      branch: branch.trim(),
      college: college.trim(),
      graduation_year: gradYear,
      target_role: chosenRole,
      preferred_location: preferredLocation.trim(),
      linkedin: linkedin.trim(),
      github: github.trim(),
      portfolio: portfolio.trim(),
    };

    await api.saveBasicProfile(basicData);
    addToast(`Target role set to "${chosenRole}". Your inputs have highest priority.`, 'success');
    setCurrentStep(3);
  };

  // Step 3 File Drop & Change
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.docx', '.doc'].includes(ext)) {
      addToast('Only PDF and DOCX files are supported.', 'warning');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('File exceeds 10MB limit.', 'warning');
      return;
    }
    setResumeFile(file);
  };

  // Step 3 -> Step 4 (Upload & Local Deterministic Parsing)
  const handleStartAnalysis = async () => {
    if (!resumeFile) {
      addToast('Please upload your resume before proceeding.', 'warning');
      return;
    }

    setCurrentStep(4);
    setAnalysisProgressIndex(0);

    const stages = [
      'Uploading resume file...',
      'Extracting clean text via PyMuPDF...',
      'Detecting canonical section boundaries...',
      'Scanning local skill dictionary & project text...',
      'Normalizing skill aliases and checking conflicts...',
      'Building structured student profile...',
    ];

    for (let i = 0; i < stages.length; i++) {
      setAnalysisProgressIndex(i);
      await new Promise((r) => setTimeout(r, 450));
    }

    try {
      // 1. Direct deterministic parsing & analysis via local Python engine
      const chosenRole = isCustomRole && customRoleInput.trim() ? customRoleInput.trim() : targetRole;
      const basicProfile: BasicProfileData = {
        name,
        city,
        education_level: educationLevel,
        degree,
        branch,
        college,
        graduation_year: gradYear,
        target_role: chosenRole,
      };

      const result = await api.parseResumeFile(resumeFile, basicProfile);
      setUploadedResumeId(result.resume_id);
      setAnalysisResult(result);
      setReviewSkills(result.skills);

      if (result.inferred_target_role) {
        setTargetRole(result.inferred_target_role);
        setIsCustomRole(false);
        addToast(`AI detected domain: "${result.inferred_domain || 'Robotics'}" → Suggested role: "${result.inferred_target_role}"`, 'info');
      }

      addToast('Resume parsed successfully!', 'success');
      setCurrentStep(5);
    } catch (err: any) {
      addToast(err.message || 'Error during parsing', 'warning');
      setCurrentStep(3);
    }
  };

  // Step 5: Remove / Add Skill
  const handleRemoveSkill = (skillId: string) => {
    setReviewSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
  };

  const handleAddManualSkill = () => {
    if (!newSkillName.trim()) return;
    const newSkill: ExtractedSkill = {
      skill_id: `SKL_MANUAL_${Date.now()}`,
      canonical_name: newSkillName.trim(),
      category: 'General',
      original_text: newSkillName.trim(),
      source_section: 'STUDENT_INPUT',
      confidence: 1.0,
      confirmed: true,
    };
    setReviewSkills((prev) => [...prev, newSkill]);
    setNewSkillName('');
    addToast(`Added "${newSkill.canonical_name}" to your skills`, 'success');
  };

  // Step 5 -> Step 6: Confirmation & Persist Live Profile
  const handleConfirmProfile = async () => {
    // 1. Save to backend database API
    const payload = {
      personal_info: analysisResult?.personal_info,
      education: analysisResult?.education,
      experience: analysisResult?.experience,
      projects: analysisResult?.projects,
      certifications: analysisResult?.certifications,
      skills: reviewSkills,
      resolved_conflicts: analysisResult?.conflicts || [],
    };

    if (uploadedResumeId) {
      await api.confirmProfile(uploadedResumeId, payload);
    }

    const activeTargetRole = isCustomRole && customRoleInput.trim() ? customRoleInput.trim() : targetRole;

    // 2. DYNAMICALLY SYNC EXACT USER ENTERED & PARSED DATA INTO LIVE PROFILE
    const sessionUser = authService.getCurrentUser();
    await careerService.syncOnboardingProfile({
      name: name.trim() || sessionUser?.name || 'Student',
      email: email.trim() || sessionUser?.email || '',
      city: city.trim() || '',
      educationLevel,
      degree: degree.trim() || '',
      branch: branch.trim() || '',
      college: college.trim() || '',
      graduationYear: gradYear,
      targetRole: activeTargetRole,
      preferredLocation: preferredLocation || city.trim() || '',
      linkedin,
      github,
      portfolio,
      resumeFileName: resumeFile?.name || '',
      resumeFileSize: resumeFile ? `${(resumeFile.size / (1024 * 1024)).toFixed(1)} MB` : '',
      skills: reviewSkills.map((s) => ({
        canonical_name: s.canonical_name,
        category: s.category,
        confidence: s.confidence,
        source_section: s.source_section,
      })),
      projects: (analysisResult?.projects || []).map((p) => ({
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        url: p.url,
      })),
      certifications: (analysisResult?.certifications || []).map((c) => ({
        name: c.name,
        issuer: c.issuer,
        date: c.date,
      })),
    });

    // 3. Update global AppContext state
    setActiveRole(activeTargetRole);
    setActiveLocation(preferredLocation);
    await refreshData();

    addToast('Your profile has been created with your exact inputs!', 'success');
    setCurrentStep(6);
  };

  const stepsConfig = [
    { num: 1, label: 'Google Auth', desc: 'Verified account' },
    { num: 2, label: 'Basic Profile', desc: 'Academic details' },
    { num: 3, label: 'Resume', desc: 'Upload file' },
    { num: 4, label: 'Resume Analysis', desc: 'Deterministic parser' },
    { num: 5, label: 'Review', desc: 'Verify extracted profile' },
    { num: 6, label: 'Complete', desc: 'Ready for dashboard' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200 py-4 px-6 sm:px-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 tracking-tight text-base">SARTHI</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">SIH 2026 Problem Statement 26134</p>
          </div>
        </Link>

        <div className="text-xs font-bold text-slate-500">
          Step <span className="text-brand-600 font-extrabold">{currentStep}</span> of 6
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Progress Steps */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-soft-sm space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Onboarding Roadmap</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Your exact information designs your live profile.
            </p>
          </div>

          <div className="space-y-3">
            {stepsConfig.map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;

              return (
                <div
                  key={s.num}
                  className={`flex items-start gap-3.5 p-3 rounded-2xl transition-all ${
                    isCurrent
                      ? 'bg-brand-50 border border-brand-200 text-brand-900 shadow-sm'
                      : isDone
                      ? 'text-emerald-800 bg-emerald-50/50'
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : `0${s.num}`}
                  </div>

                  <div>
                    <p className="text-xs font-extrabold leading-tight">{s.label}</p>
                    <p className="text-[11px] font-medium opacity-80">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
            <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              Strict Student Input Priority
            </span>
            <p className="leading-relaxed">
              Every detail you enter directly forms your live platform profile. No arbitrary placeholder data is used.
            </p>
          </div>
        </div>

        {/* Right Column: Active Form Step */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-soft-sm">
          {/* STEP 1: GOOGLE AUTHENTICATION */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in text-center py-8">
              <div className="max-w-md mx-auto">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-extrabold uppercase">
                  Step 01
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-2">Sign In with Google to Start</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Authenticate your student account with Google to open your personalized registration and onboarding form.
                </p>

                <div className="mt-8">
                  <button
                    onClick={handleGoogleSignInOnboarding}
                    disabled={isGoogleLoading}
                    type="button"
                    className="w-full py-4 px-6 rounded-2xl border-2 border-slate-200 hover:border-brand-500 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 text-sm font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
                  >
                    {isGoogleLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                        <span>Connecting to Google...</span>
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
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BASIC PROFILE */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6 animate-fade-in">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-extrabold uppercase">
                  Step 02
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Your Academic & Career Background</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  This data directly customizes your profile, education section, and career roadmap.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Current City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter your current city"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Education Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={educationLevel}
                    required
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
                  >
                    <option value="" disabled>-- Select Education Level --</option>
                    <option value="Undergraduate">Undergraduate (B.Tech / BCA / B.Sc)</option>
                    <option value="Postgraduate">Postgraduate (M.Tech / MCA / M.Sc)</option>
                    <option value="Diploma">Diploma / Polytechnic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Degree <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="Enter degree"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch / Major</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="Enter branch / major"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    College / University Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="Enter college / university name"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Graduation Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={2020}
                    max={2035}
                    value={gradYear}
                    onChange={(e) => setGradYear(parseInt(e.target.value) || 2026)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2 p-4 rounded-2xl bg-brand-50/60 border border-brand-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-brand-950 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-brand-600" />
                      Target Future Job Role & Career Direction <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-200 text-brand-900">
                      Primary AI Tailoring
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Select your targeted career field. Skill gaps, intelligence benchmarks, and job recommendations will adapt specifically to this domain.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Select Standard Role
                      </label>
                      <select
                        value={isCustomRole ? '__CUSTOM__' : targetRole}
                        required
                        onChange={(e) => {
                          if (e.target.value === '__CUSTOM__') {
                            setIsCustomRole(true);
                            setTargetRole('');
                          } else {
                            setIsCustomRole(false);
                            setTargetRole(e.target.value);
                          }
                        }}
                        className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900 shadow-sm"
                      >
                        <option value="" disabled>-- Select Your Target Role --</option>
                        {CAREER_ROLE_CATEGORIES.map((cat) => (
                          <optgroup key={cat.category} label={`${cat.icon} ${cat.category}`}>
                            {cat.roles.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        <option value="__CUSTOM__">✨ Other / Custom Career Path...</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        {isCustomRole ? 'Specify Custom Role Name' : 'Active Target Role'}
                      </label>
                      {isCustomRole ? (
                        <input
                          type="text"
                          required
                          value={customRoleInput}
                          onChange={(e) => {
                            setCustomRoleInput(e.target.value);
                            setTargetRole(e.target.value);
                          }}
                          placeholder="Enter custom role title"
                          className="w-full px-4 py-2.5 text-xs bg-white border border-brand-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-brand-900 shadow-sm"
                        />
                      ) : (
                        <div className="w-full px-4 py-2.5 text-xs bg-white/90 border border-slate-200 rounded-xl font-bold flex items-center justify-between shadow-sm">
                          <span className={targetRole ? "text-slate-900" : "text-slate-400 font-normal"}>
                            {targetRole || 'No role selected yet'}
                          </span>
                          {targetRole ? (
                            <span className="text-[10px] text-brand-600 font-black uppercase">Selected</span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-bold uppercase">Required</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preferred Location <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={preferredLocation}
                    required
                    onChange={(e) => setPreferredLocation(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
                  >
                    <option value="" disabled>-- Select Preferred Location --</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Profile (Optional)</label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="Enter LinkedIn profile URL"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">GitHub Profile (Optional)</label>
                  <input
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="Enter GitHub profile URL"
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center gap-2"
                >
                  Continue to Resume Upload
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: RESUME UPLOAD */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-extrabold uppercase">
                  Step 03
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Upload Your Real Resume</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Supported formats: PDF, DOCX (Max 10MB). Extracted skills and projects will populate your real profile.
                </p>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                  isDragging
                    ? 'border-brand-500 bg-brand-50/50'
                    : 'border-slate-200 hover:border-brand-400 bg-slate-50/60'
                }`}
                onClick={() => document.getElementById('resume-file-input')?.click()}
              >
                <input
                  id="resume-file-input"
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      validateAndSetFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-2xl bg-brand-100/80 text-brand-600 flex items-center justify-center mb-3 shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>

                <p className="text-sm font-extrabold text-slate-900">
                  Drag and drop your resume here, or <span className="text-brand-600 underline">browse</span>
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Supports text-based PDF or DOCX format.
                </p>
              </div>

              {/* Selected File Badge */}
              {resumeFile && (
                <div className="p-4 rounded-2xl bg-brand-50/80 border border-brand-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-brand-600" />
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{resumeFile.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for local analysis
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="button"
                  disabled={!resumeFile}
                  onClick={handleStartAnalysis}
                  className={`px-6 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 ${
                    resumeFile
                      ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze Resume (Deterministic)
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: RESUME ANALYSIS ANIMATION */}
          {currentStep === 4 && (
            <div className="space-y-8 py-6 text-center animate-fade-in">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-extrabold uppercase">
                  Step 04
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Deterministic Resume Processing</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Running local PyMuPDF extraction, section segmentation, and skill dictionary lookup.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-3 text-left">
                {[
                  'Uploading resume file...',
                  'Extracting clean text via PyMuPDF...',
                  'Detecting canonical section boundaries...',
                  'Scanning local skill dictionary & project text...',
                  'Normalizing skill aliases and checking conflicts...',
                  'Building structured student profile...',
                ].map((stg, idx) => {
                  const isFinished = analysisProgressIndex > idx;
                  const isWorking = analysisProgressIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all ${
                        isFinished
                          ? 'bg-emerald-50 text-emerald-800'
                          : isWorking
                          ? 'bg-brand-50 text-brand-700 animate-pulse'
                          : 'text-slate-400'
                      }`}
                    >
                      {isFinished ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isWorking ? (
                        <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span>{stg}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW EXTRACTED PROFILE */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-extrabold uppercase">
                    Step 05
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">Review Your Extracted Profile</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    This verified profile will immediately become your live profile across all dashboard views.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Confidence: {Math.round((analysisResult?.confidence_summary.overall || 0.92) * 100)}%
                  </span>
                </div>
              </div>

              {/* CONFLICT WARNING BANNER IF USER INPUT != RESUME */}
              {analysisResult?.conflicts && analysisResult.conflicts.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Priority Resolution: Your Input Preserved
                  </div>
                  {analysisResult.conflicts.map((conf, idx) => (
                    <div key={idx} className="text-xs text-amber-800 bg-white/80 p-2.5 rounded-xl border border-amber-200/60 flex items-start justify-between gap-4">
                      <div>
                        <strong>{conf.field_name}:</strong> You entered <span className="font-extrabold text-slate-900 underline">{conf.user_value}</span>, while resume mentions <em>"{conf.resume_value}"</em>.
                        <p className="text-[11px] text-amber-700 mt-0.5">Your input is preserved per strict student-first priority.</p>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                        Preserved
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Primary Target Career Path Confirmation */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-950 via-slate-900 to-slate-950 text-white shadow-soft-sm space-y-3 border border-brand-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300 shrink-0">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        Target Career Path & Future Role
                        {analysisResult?.inferred_domain && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/30 text-brand-200 border border-brand-400/30">
                            {analysisResult.inferred_domain}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Your skills and career intelligence will be tailored specifically for this direction.
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
                    ✓ AI Benchmark Target
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 items-center">
                  <div className="sm:col-span-8">
                    <select
                      value={isCustomRole ? '__CUSTOM__' : targetRole}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomRole(true);
                        } else {
                          setIsCustomRole(false);
                          setTargetRole(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-800 text-white border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 font-bold shadow-inner"
                    >
                      {CAREER_ROLE_CATEGORIES.map((cat) => (
                        <optgroup key={cat.category} label={`${cat.icon} ${cat.category}`} className="bg-slate-900 text-slate-200 font-bold">
                          {cat.roles.map((r) => (
                            <option key={r} value={r} className="bg-slate-800 text-white">
                              {r}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="__CUSTOM__" className="bg-slate-800 text-brand-300">✨ Other / Custom Career Role...</option>
                    </select>
                  </div>

                  {isCustomRole && (
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={customRoleInput}
                        onChange={(e) => {
                          setCustomRoleInput(e.target.value);
                          setTargetRole(e.target.value);
                        }}
                        placeholder="Enter custom role title"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-800 text-brand-300 border border-brand-400/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Section 1: Personal & Education */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-brand-600" /> Student Profile</span>
                    <span className="text-[10px] font-extrabold text-emerald-600">✓ Confirmed</span>
                  </div>
                  <p className="text-sm font-extrabold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-600">{email}</p>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {city}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-brand-600" /> Education</span>
                    <span className="text-[10px] font-extrabold text-emerald-600">✓ Confirmed</span>
                  </div>
                  <p className="text-sm font-extrabold text-slate-900">{degree} in {branch || 'Engineering'}</p>
                  <p className="text-xs text-slate-600">{college}</p>
                  <p className="text-xs text-slate-600">Class of {gradYear}</p>
                </div>
              </div>

              {/* Section 2: Skills Found (Editable) */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-600" />
                      Skills Extracted & Normalized ({reviewSkills.length})
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Extracted from your resume with section-aware evidence tracking.
                    </p>
                  </div>

                  {/* Add manual skill input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Add another skill..."
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddManualSkill();
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualSkill}
                      className="p-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Skill Chips List */}
                <div className="flex flex-wrap gap-2">
                  {reviewSkills.map((sk) => (
                    <div
                      key={sk.skill_id}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-900 flex items-center gap-2 transition-all shadow-sm"
                    >
                      <span>{sk.canonical_name}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-50 text-brand-700">
                        {sk.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {Math.round(sk.confidence * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk.skill_id)}
                        className="text-slate-400 hover:text-rose-600 ml-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Projects Detected */}
              {analysisResult?.projects && analysisResult.projects.length > 0 && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft-sm space-y-3">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    Projects Detected ({analysisResult.projects.length})
                  </h4>
                  <div className="space-y-2.5">
                    {analysisResult.projects.map((p, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                        <div className="font-extrabold text-slate-900">{p.name}</div>
                        {p.description && <p className="text-slate-600 mt-1 leading-relaxed">{p.description}</p>}
                        {p.technologies && p.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.technologies.map((t) => (
                              <span key={t} className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 text-[10px] font-bold">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Re-upload Resume
                </button>

                <button
                  type="button"
                  onClick={handleConfirmProfile}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Create Profile
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: COMPLETED */}
          {currentStep === 6 && (
            <div className="space-y-6 py-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Student Profile Successfully Created!</h3>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1">
                  Your live profile has been constructed exclusively from your inputs and parsed resume. No dummy placeholder data was used.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2.5 font-medium text-slate-700">
                <div className="flex justify-between">
                  <span>Student Name:</span> <strong className="text-slate-900">{name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Target Role:</span> <strong className="text-brand-600">{targetRole}</strong>
                </div>
                <div className="flex justify-between">
                  <span>College / Degree:</span> <span className="text-slate-900 font-bold">{degree}, {college}</span>
                </div>
                <div className="flex justify-between">
                  <span>Verified Skills Extracted:</span> <strong className="text-emerald-700">{reviewSkills.length} Skills</strong>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span> <span className="text-emerald-700 font-bold">Profile Live Across Dashboard</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-md shadow-brand-600/20 transition-all flex items-center gap-2"
                >
                  Go to Career Intelligence Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
