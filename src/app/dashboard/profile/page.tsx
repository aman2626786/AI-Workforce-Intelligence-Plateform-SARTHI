'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { SkillBadge } from '@/components/ui/SkillBadge';
import { Modal } from '@/components/ui/Modal';
import {
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  FileText,
  Plus,
  CheckCircle2,
  FolderGit2,
  Award,
  Sparkles,
  Upload,
  RefreshCw,
  Trash2,
  ArrowRight,
  AlertCircle,
  FileCheck,
  Compass,
  Edit3,
  Search,
  Layers,
  Calendar,
  Building,
  ExternalLink,
  Code2,
  Filter,
  Check,
  TrendingUp,
  LayoutGrid,
} from 'lucide-react';
import { api, ResumeAnalysisResult } from '@/services/api';
import { careerService } from '@/services/careerService';
import { CAREER_ROLE_CATEGORIES } from '@/app/onboarding/page';

type TabType = 'overview' | 'skills' | 'experience' | 'projects' | 'education';

export default function StudentProfilePage() {
  const { profile, addSelfReportedSkill, addToast, refreshData, setActiveRole, updateProfileInfo, activeRole } = useApp();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Skill Search & Category Filter State
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string>('ALL');
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>('');

  // Self-Reported Skill Modal State
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Data Visualization');
  const [newSkillLevel, setNewSkillLevel] = useState<'Basic' | 'Intermediate' | 'Advanced'>('Intermediate');

  // Edit Profile & Academic Info Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editDegree, setEditDegree] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editGradYear, setEditGradYear] = useState('');
  const [editTargetRole, setEditTargetRole] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const openEditProfileModal = () => {
    setEditName(profile?.name || '');
    setEditLocation(profile?.location || profile?.targetLocation || '');
    setEditCollege(profile?.education?.institution || '');
    setEditDegree(profile?.education?.degree || '');
    setEditBranch(profile?.education?.fieldOfStudy || '');
    setEditGradYear(profile?.education?.graduationYear || '');
    setEditTargetRole(profile?.targetRole || activeRole || '');
    setIsEditProfileOpen(true);
  };

  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfileInfo({
        name: editName.trim(),
        location: editLocation.trim(),
        targetRole: editTargetRole.trim(),
        education: {
          institution: editCollege.trim(),
          degree: editDegree.trim(),
          fieldOfStudy: editBranch.trim(),
          graduationYear: editGradYear.trim(),
        },
      });
      setIsEditProfileOpen(false);
      addToast('Profile and academic details updated successfully!', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Target Career Switcher Modal State
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(profile?.targetRole || '');
  const [isCustomSelectedRole, setIsCustomSelectedRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Resume Update Modal State
  const [isUpdateResumeOpen, setIsUpdateResumeOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgressIndex, setAnalysisProgressIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Skill category grouping
  const skillCategories = useMemo(() => {
    if (!profile?.skills) return [];
    const map: Record<string, number> = {};
    profile.skills.forEach((s) => {
      const cat = s.category?.toUpperCase() || 'GENERAL';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [profile?.skills]);

  // Filtered skills based on search & category
  const filteredSkills = useMemo(() => {
    if (!profile?.skills) return [];
    return profile.skills.filter((skill) => {
      const matchesCategory =
        selectedSkillCategory === 'ALL' ||
        skill.category?.toUpperCase() === selectedSkillCategory.toUpperCase();
      const matchesSearch =
        !skillSearchQuery.trim() ||
        skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) ||
        skill.category.toLowerCase().includes(skillSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [profile?.skills, selectedSkillCategory, skillSearchQuery]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    await addSelfReportedSkill(newSkillName, newSkillCategory, newSkillLevel);
    setNewSkillName('');
    setIsAddSkillOpen(false);
  };

  const handleSaveTargetRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextRole = isCustomSelectedRole && customRoleInput.trim() ? customRoleInput.trim() : selectedRole;
    if (!nextRole) return;
    setIsUpdatingRole(true);
    try {
      await careerService.updateTargetCareer(nextRole);
      setActiveRole(nextRole);
      await refreshData();
      addToast(`Target career path updated to "${nextRole}". Intelligence recalculated!`, 'success');
      setIsEditRoleOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to update target role', 'error');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage('');
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.docx', '.doc'].includes(ext)) {
      setErrorMessage('Only PDF and DOCX files are supported.');
      addToast('Only PDF and DOCX files are supported.', 'warning');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File exceeds 10MB limit.');
      addToast('File exceeds 10MB limit.', 'warning');
      return;
    }
    setResumeFile(file);
    setAnalysisResult(null);
    setAnalysisSuccess(false);
  };

  const handleStartResumeUpdate = async () => {
    if (!resumeFile) {
      addToast('Please select a resume file first.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgressIndex(0);
    setErrorMessage('');

    const stages = [
      'Uploading updated resume file...',
      'Extracting clean text & structure via PyMuPDF...',
      'Segmenting multi-projects, skills & education...',
      'Aligning local skill ontology & resolving conflicts...',
      'Updating your live career profile...',
    ];

    const stageInterval = setInterval(() => {
      setAnalysisProgressIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      const result = await api.parseResumeFile(resumeFile, {
        name: profile?.name,
        city: profile?.location || 'Jaipur',
        education_level: 'Undergraduate',
        degree: profile?.education?.degree || 'B.Tech',
        branch: profile?.education?.fieldOfStudy,
        college: profile?.education?.institution || 'Arya College of Engineering & IT',
        graduation_year: Number(profile?.education?.graduationYear) || 2026,
      });

      clearInterval(stageInterval);
      setAnalysisProgressIndex(stages.length - 1);
      setAnalysisResult(result);

      const parsedSkills = (result.skills || []).map((s) => ({
        canonical_name: s.canonical_name,
        category: s.category,
        confidence: s.confidence,
        source_section: s.source_section,
      }));

      const firstEdu = result.education && result.education.length > 0 ? result.education[0] : null;

      await careerService.syncOnboardingProfile({
        name: result.personal_info?.name || profile?.name || 'Student',
        email: result.personal_info?.email || profile?.email || 'student@university.edu',
        city: result.personal_info?.city || profile?.location || 'Jaipur',
        educationLevel: firstEdu?.education_level || 'Undergraduate',
        degree: firstEdu?.degree || profile?.education?.degree || 'B.Tech',
        branch: firstEdu?.field || profile?.education?.fieldOfStudy || 'Technical',
        college: firstEdu?.institution || profile?.education?.institution || 'Arya College of Engineering & IT',
        graduationYear: firstEdu?.graduation_year || Number(profile?.education?.graduationYear) || 2026,
        cgpa: firstEdu?.cgpa ? String(firstEdu.cgpa) : (firstEdu?.percentage ? `${firstEdu.percentage}%` : (profile?.education?.cgpa || '')),
        targetRole: profile?.targetRole,
        preferredLocation: profile?.targetLocation,
        linkedin: result.personal_info?.linkedin || profile?.linkedin,
        github: result.personal_info?.github || profile?.github,
        portfolio: result.personal_info?.portfolio || profile?.portfolio,
        resumeFileName: resumeFile.name,
        resumeFileSize: `${(resumeFile.size / (1024 * 1024)).toFixed(1)} MB`,
        skills: parsedSkills,
        projects: result.projects || [],
        experience: result.experience || [],
        certifications: result.certifications || [],
      });

      await refreshData();
      setIsAnalyzing(false);
      setAnalysisSuccess(true);
      addToast('Resume updated! Profile, skills, and projects successfully refreshed.', 'success');
    } catch (err: any) {
      clearInterval(stageInterval);
      setIsAnalyzing(false);
      const rawMsg = err.message || 'Error occurred while updating resume.';
      const isTokenErr = rawMsg.toLowerCase().includes('token') || rawMsg.includes('401') || rawMsg.toLowerCase().includes('authentication');
      const friendlyMsg = isTokenErr
        ? 'Aapka login session expire ho gaya hai. Kripya ek baar logout karke dubara login karein.'
        : rawMsg;
      setErrorMessage(friendlyMsg);
      addToast(friendlyMsg, isTokenErr ? 'warning' : 'error');
    }
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateResumeOpen(false);
    setResumeFile(null);
    setAnalysisResult(null);
    setAnalysisSuccess(false);
    setIsAnalyzing(false);
    setErrorMessage('');
  };

  // User initials
  const initials = (profile?.name || 'Student')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || 'AS';

  const totalSkillsCount = profile?.skills?.length || 0;
  const totalExpCount = profile?.experience?.length || 0;
  const totalProjCount = profile?.projects?.length || 0;
  const totalCertCount = profile?.certifications?.length || 0;

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12 max-w-7xl">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100">
              Verified Student Dossier
            </span>
            <span className="text-[11px] font-semibold text-slate-400">•</span>
            <span className="text-[11px] font-semibold text-slate-500">
              AI-Parsed Resume Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Student Career Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Verified skills, professional experience, project portfolio, and target career calibration.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={openEditProfileModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-sky-300 hover:bg-sky-50 text-sky-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-sky-600" />
            <span>Edit Profile Details</span>
          </button>

          <button
            onClick={() => setIsUpdateResumeOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-slate-900 text-white font-bold text-xs shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Updated Resume</span>
          </button>

          <button
            onClick={() => setIsAddSkillOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Skill</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column (Identity & Credentials) + Right Column (Classified Portfolio) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Unified Identity & Command Card (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Student Profile Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-start gap-4">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-sky-600/20 shrink-0">
                  {initials}
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 truncate">
                    {profile?.name || 'Student Candidate'}
                  </h2>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                  </span>
                </div>
                <p className="text-xs font-semibold text-sky-700">
                  {profile?.targetRole ? `${profile.targetRole} Candidate` : 'Career Track Selected'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {profile?.email || 'Verified Student'}
                </p>
              </div>
            </div>

            {/* Target Career Calibration Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/80 to-indigo-50/50 border border-sky-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-sky-600" /> Target Career Role
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-emerald-700 border border-emerald-200 shadow-2xs">
                  Active Target
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900 truncate">
                  {profile?.targetRole || activeRole || 'Target Role Pending'}
                </span>
                <button
                  onClick={() => {
                    setSelectedRole(profile?.targetRole || activeRole || '');
                    setIsCustomSelectedRole(false);
                    setIsEditRoleOpen(true);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-sky-600 hover:text-white text-sky-700 border border-sky-200 rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  Switch Role
                </button>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Learning roadmaps, skill gaps, and readiness telemetry calibrate to this role.
              </p>
            </div>

            {/* Location & Metadata Rows */}
            <div className="space-y-2 text-xs font-medium text-slate-600 pt-1">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Current City
                </span>
                <strong className="text-slate-900 font-semibold">{profile?.location || 'Not Specified'}</strong>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Target Location
                </span>
                <strong className="text-slate-900 font-semibold">{profile?.targetLocation || profile?.location || 'Pan India'}</strong>
              </div>
            </div>
          </div>

          {/* Academic Credentials Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Academic Education</h3>
                  <p className="text-[11px] text-slate-500">Degree & Institution</p>
                </div>
              </div>
              <button
                type="button"
                onClick={openEditProfileModal}
                className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                title="Edit Academic Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 text-xs">
                {profile?.education?.institution || 'Institution Pending'}
              </h4>
              <p className="text-slate-600 font-medium">
                {profile?.education?.degree ? `${profile.education.degree}${profile.education.fieldOfStudy ? ` in ${profile.education.fieldOfStudy}` : ''}` : 'Degree Details Pending'}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-semibold text-slate-700">
                <span className="text-slate-500">{profile?.education?.graduationYear ? `Class of ${profile.education.graduationYear}` : 'Year Pending'}</span>
                {profile?.education?.cgpa ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                    CGPA: {profile.education.cgpa}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Uploaded Resume Metadata Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-200">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Resume Dossier</h3>
                  <p className="text-[11px] text-slate-500">Deterministic Parsing</p>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                profile?.resume?.fileName
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {profile?.resume?.fileName ? 'Parsed' : 'Pending'}
              </span>
            </div>

            {profile?.resume?.fileName ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <p className="font-bold text-slate-900 truncate">{profile.resume.fileName}</p>
                <p className="text-[11px] text-slate-500">
                  Uploaded: {profile.resume.uploadDate || 'Sep 19, 2026'} • {profile.resume.fileSize || '0.1 MB'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No resume uploaded yet.</p>
            )}

            <button
              onClick={() => setIsUpdateResumeOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-semibold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3 h-3 text-slate-500" />
              <span>{profile?.resume?.fileName ? 'Upload Replacement Resume' : 'Upload Resume Now'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Classified Portfolio with Tabbed Architecture (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Modern Tab Bar */}
          <div className="p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200 flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-sky-600" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'skills'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Skills Matrix</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'skills' ? 'bg-sky-100 text-sky-700' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {totalSkillsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('experience')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'experience'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-sky-600" />
              <span>Experience</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'experience' ? 'bg-sky-100 text-sky-700' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {totalExpCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Projects</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'projects' ? 'bg-sky-100 text-sky-700' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {totalProjCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('education')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'education'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-sky-600" />
              <span>Certs & Academics</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'education' ? 'bg-sky-100 text-sky-700' : 'bg-slate-200/80 text-slate-600'
              }`}>
                {totalCertCount}
              </span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW SUMMARY */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Executive Summary Metrics Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Portfolio Executive Summary</h3>
                    <p className="text-xs text-slate-500 font-medium">Classified telemetry overview across your profile</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('skills')}
                    className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-center">
                    <p className="text-2xl font-black text-sky-800">{totalSkillsCount}</p>
                    <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider mt-0.5">Verified Skills</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                    <p className="text-2xl font-black text-emerald-800">{totalExpCount}</p>
                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5">Work Positions</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
                    <p className="text-2xl font-black text-indigo-800">{totalProjCount}</p>
                    <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mt-0.5">Major Projects</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-2xl font-black text-slate-800">
                      {profile?.education?.cgpa ? `${profile.education.cgpa}` : '7.8'}
                    </p>
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">B.Tech CGPA</p>
                  </div>
                </div>
              </div>

              {/* Skills Highlights Preview */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Featured Core Competencies</h4>
                      <p className="text-[11px] text-slate-500">Top technical skills extracted from your resume</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('skills')}
                    className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                  >
                    View All {totalSkillsCount} Skills
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(profile?.skills || []).slice(0, 6).map((skill) => (
                    <div
                      key={skill.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 hover:bg-white hover:border-sky-300 transition-colors"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {skill.category}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900">{skill.name}</h5>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-sky-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {skill.proficiencyScore}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Work Experience Preview */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      💼
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Latest Experience</h4>
                      <p className="text-[11px] text-slate-500">Recent internships and professional roles</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('experience')}
                    className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                  >
                    View All ({totalExpCount})
                  </button>
                </div>

                <div className="space-y-3">
                  {(profile?.experience || []).slice(0, 2).map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{exp.role}</h5>
                          <span className="text-[11px] font-bold text-sky-700">{exp.company}</span>
                        </div>
                        {(exp.startDate || exp.endDate) && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 self-start sm:self-auto">
                            {exp.startDate} {exp.endDate ? `– ${exp.endDate}` : ''}
                          </span>
                        )}
                      </div>
                      {exp.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured Projects Preview */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      🚀
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Flagship Projects</h4>
                      <p className="text-[11px] text-slate-500">Technical builds verified on resume</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                  >
                    View All ({totalProjCount})
                  </button>
                </div>

                <div className="space-y-3">
                  {(profile?.projects || []).slice(0, 2).map((proj) => (
                    <div
                      key={proj.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-900">{proj.title}</h5>
                        <span className="text-[11px] text-slate-400 font-medium">{proj.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {proj.description}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.skillsUsed.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 text-[10px] font-semibold"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SKILLS MATRIX & CLASSIFICATION */}
          {activeTab === 'skills' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Skills Matrix & Classification</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Filter by technical domain or search specific competencies
                  </p>
                </div>

                {/* Legend Chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <SkillBadge type="Verified" />
                  <SkillBadge type="Resume Extracted" />
                  <SkillBadge type="Self Reported" />
                </div>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={skillSearchQuery}
                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                    placeholder="Search skills by name or keyword (e.g. Python, Machine Learning, SQL)..."
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                  />
                  {skillSearchQuery && (
                    <button
                      onClick={() => setSkillSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <button
                    onClick={() => setSelectedSkillCategory('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      selectedSkillCategory === 'ALL'
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    All Domains ({totalSkillsCount})
                  </button>

                  {skillCategories.map(([catName, count]) => (
                    <button
                      key={catName}
                      onClick={() => setSelectedSkillCategory(catName)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        selectedSkillCategory === catName
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {catName} ({count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Classified Skills Cards Grid */}
              {filteredSkills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {filteredSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 hover:bg-white hover:border-sky-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {skill.category}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-0.5">{skill.name}</h4>
                        </div>
                        <SkillBadge type={skill.type} />
                      </div>

                      {/* Proficiency Progress & Level */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                          <span className="text-[11px] text-slate-500">
                            Level: <strong className="text-slate-900">{skill.level}</strong>
                          </span>
                          <span className="text-sky-700 font-bold text-xs">
                            {skill.proficiencyScore}% Score
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full"
                            style={{ width: `${skill.proficiencyScore}%` }}
                          />
                        </div>
                      </div>

                      {skill.verifiedBy && (
                        <p className="text-[10px] text-slate-400 italic pt-0.5">
                          Validated by: {skill.verifiedBy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-700">No skills found matching your filter.</p>
                  <p className="text-[11px] text-slate-500">Try searching for a different keyword or category.</p>
                  <button
                    onClick={() => {
                      setSelectedSkillCategory('ALL');
                      setSkillSearchQuery('');
                    }}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 font-bold text-xs border border-sky-200"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WORK EXPERIENCE & INTERNSHIPS */}
          {activeTab === 'experience' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Work Experience & Internships</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Industry engagements extracted and formatted from your resume
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                  {totalExpCount} Positions
                </span>
              </div>

              <div className="space-y-4 pt-1">
                {profile?.experience && profile.experience.length > 0 ? (
                  profile.experience.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:bg-white hover:border-sky-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-slate-900">{exp.role}</h4>
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-100">
                            <Building className="w-3 h-3" />
                            {exp.company}
                          </span>
                        </div>
                        {(exp.startDate || exp.endDate) && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 self-start sm:self-auto shadow-2xs">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {exp.startDate} {exp.endDate ? `– ${exp.endDate}` : ''}
                          </span>
                        )}
                      </div>

                      {exp.description && (
                        <p className="text-xs text-slate-600 leading-relaxed font-normal pt-1 whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No work experience or internships extracted yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PROJECTS PORTFOLIO */}
          {activeTab === 'projects' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Projects Portfolio</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Technical projects and systems built with validated skills
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {totalProjCount} Projects
                </span>
              </div>

              <div className="space-y-4 pt-1">
                {profile?.projects && profile.projects.length > 0 ? (
                  profile.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <FolderGit2 className="w-4 h-4" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                          {proj.date || 'Recent'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {proj.description}
                      </p>

                      <div className="pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Technologies & Skills Applied
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {proj.skillsUsed.map((sk) => (
                            <span
                              key={sk}
                              className="px-2.5 py-1 rounded-lg bg-white text-slate-800 border border-slate-200 text-[11px] font-semibold shadow-2xs"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No projects extracted yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CERTIFICATIONS & ACADEMICS */}
          {activeTab === 'education' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-900">Education & Accreditations</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Academic qualifications and validated professional certifications
                </p>
              </div>

              {/* Academic Details Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-sky-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      {profile?.education?.institution || 'Institution Pending'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile?.education?.cgpa ? (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        CGPA: {profile.education.cgpa}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={openEditProfileModal}
                      className="p-1 text-slate-400 hover:text-sky-700 rounded transition-colors cursor-pointer"
                      title="Edit Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                  <div>
                    <span className="text-slate-400">Degree:</span> {profile?.education?.degree || 'Undergraduate'}
                  </div>
                  <div>
                    <span className="text-slate-400">Field:</span> {profile?.education?.fieldOfStudy || 'Technical / Engineering'}
                  </div>
                  <div>
                    <span className="text-slate-400">Graduation:</span> {profile?.education?.graduationYear ? `Class of ${profile.education.graduationYear}` : 'In Progress'}
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span> Completed
                  </div>
                </div>
              </div>

              {/* Certifications Card */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Professional Certifications
                </h4>
                {profile?.certifications && profile.certifications.length > 0 ? (
                  profile.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-4 rounded-2xl bg-sky-50/50 border border-sky-200/80 space-y-2 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-900">{cert.title}</h5>
                        <span className="text-xs font-bold text-sky-700">{cert.issueDate}</span>
                      </div>
                      <p className="text-xs text-slate-600">Issuer: {cert.issuer}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cert.skillsValidated.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md bg-white text-sky-800 border border-sky-200 text-[10px] font-bold"
                          >
                            ✓ {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1.5">
                    <Award className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No external certifications extracted yet.</p>
                    <p className="text-[11px] text-slate-500">
                      Certificates will be automatically indexed when you upload a resume containing certification links or licenses.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Adding Self-Reported Skill */}
      <Modal
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        title="Add Self-Reported Skill"
        subtitle="This skill will be marked as 'Self Reported' until verified via assessment."
      >
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Skill Name</label>
            <input
              type="text"
              required
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="e.g. Tableau, Docker, GraphQL"
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
            >
              <option value="Data Visualization">Data Visualization</option>
              <option value="Database & Querying">Database & Querying</option>
              <option value="Programming Languages">Programming Languages</option>
              <option value="Analytics & Math">Analytics & Math</option>
              <option value="Emerging Tech">Emerging Tech</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Proficiency Level</label>
            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value as any)}
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
            >
              <option value="Basic">Basic</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddSkillOpen(false)}
              className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-sm cursor-pointer"
            >
              Save Skill to Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal for Updating Resume */}
      <Modal
        isOpen={isUpdateResumeOpen}
        onClose={handleCloseUpdateModal}
        title="Upload Updated Resume"
        subtitle="Upload your latest resume (PDF or DOCX). Our local deterministic engine will extract new skills, projects, and credentials to refresh your career profile."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isAnalyzing && !analysisSuccess && (
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-sky-500 bg-sky-50/50 scale-[0.99]'
                    : resumeFile
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-sky-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      validateAndSetFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="mx-auto w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3 shadow-inner">
                  {resumeFile ? <FileCheck className="w-7 h-7 text-emerald-600" /> : <Upload className="w-7 h-7" />}
                </div>

                {resumeFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-slate-900">{resumeFile.name}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                    </p>
                    <p className="text-[11px] text-sky-600 font-bold mt-2">Click or drag another file to replace</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-slate-900">
                      Drag and drop your updated resume, or <span className="text-sky-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 font-medium">Supports PDF, DOCX (Max 10MB)</p>
                  </div>
                )}
              </div>

              {/* Notice */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">Deterministic Parsing with High Accuracy</p>
                  <p>
                    Uploading a new resume will re-scan projects, certifications, education, and skills. Existing self-reported skills will be preserved.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseUpdateModal}
                  className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!resumeFile}
                  onClick={handleStartResumeUpdate}
                  className={`inline-flex items-center gap-2 py-2.5 px-5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer ${
                    resumeFile
                      ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/25'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze & Update Profile
                </button>
              </div>
            </>
          )}

          {/* Analyzing Progress State */}
          {isAnalyzing && (
            <div className="py-8 space-y-6 text-center">
              <div className="relative mx-auto w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-sky-100 border-t-sky-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-sky-600 absolute inset-0 m-auto" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-base font-extrabold text-slate-900">Processing Your Updated Resume</h4>
                <p className="text-xs text-slate-500">
                  Our deterministic parser is analyzing document structure, sections, and keywords...
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-2 text-left">
                {[
                  'Uploading updated resume file...',
                  'Extracting clean text & structure via PyMuPDF...',
                  'Segmenting multi-projects, skills & education...',
                  'Aligning local skill ontology & resolving conflicts...',
                  'Updating your live career profile...',
                ].map((stepText, idx) => {
                  const isDone = idx < analysisProgressIndex;
                  const isCurrent = idx === analysisProgressIndex;
                  return (
                    <div
                      key={stepText}
                      className={`flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all ${
                        isCurrent
                          ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200/80'
                          : isDone
                          ? 'text-emerald-700 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span>{stepText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Success Summary State */}
          {analysisSuccess && analysisResult && (
            <div className="space-y-6 py-2">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-900">Profile Updated Successfully!</h4>
                  <p className="text-xs text-emerald-700">
                    Your profile, verified skills, and project portfolio have been refreshed from your latest resume.
                  </p>
                </div>
              </div>

              {/* Extraction Metrics Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-2xl font-black text-slate-900">{analysisResult.skills?.length || 0}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Skills Extracted</p>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200/70">
                  <p className="text-2xl font-black text-indigo-700">{analysisResult.experience?.length || 0}</p>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">Experience</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-2xl font-black text-slate-900">{analysisResult.projects?.length || 0}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Projects Found</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-2xl font-black text-slate-900">{analysisResult.education?.length || 0}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Degrees / Edu</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-2xl font-black text-slate-900">{analysisResult.certifications?.length || 0}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Certifications</p>
                </div>
              </div>

              {/* Sample Extracted Skills Pills */}
              {analysisResult.skills && analysisResult.skills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">Recently Extracted Skills:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                    {analysisResult.skills.map((sk) => (
                      <span
                        key={sk.skill_id}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold"
                      >
                        {sk.canonical_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCloseUpdateModal}
                  className="inline-flex items-center gap-2 py-2 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                >
                  <span>View Updated Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Target Career Role Switcher Modal */}
      <Modal
        isOpen={isEditRoleOpen}
        onClose={() => setIsEditRoleOpen(false)}
        title="Switch Target Career Path"
      >
        <form onSubmit={handleSaveTargetRole} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Career Direction & Target Role
            </label>
            <select
              value={isCustomSelectedRole ? '__CUSTOM__' : selectedRole}
              onChange={(e) => {
                if (e.target.value === '__CUSTOM__') {
                  setIsCustomSelectedRole(true);
                } else {
                  setIsCustomSelectedRole(false);
                  setSelectedRole(e.target.value);
                }
              }}
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
            >
              {CAREER_ROLE_CATEGORIES.map((cat) => (
                <optgroup key={cat.category} label={cat.category}>
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

          {isCustomSelectedRole && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom Role Title
              </label>
              <input
                type="text"
                required
                value={customRoleInput}
                onChange={(e) => {
                  setCustomRoleInput(e.target.value);
                  setSelectedRole(e.target.value);
                }}
                placeholder="e.g. Autonomous Systems Lead / Robotics Architect"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-sky-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-sky-900"
              />
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-sky-900 space-y-1">
            <p className="font-extrabold flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-sky-600" />
              Dynamic Intelligence Recalculation
            </p>
            <p className="text-[11px] text-sky-700 leading-relaxed">
              When you save, the Profile Intelligence Agent recalculates skill gaps, market demand percentages, and matches strictly against this domain.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditRoleOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingRole}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isUpdatingRole ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Recalculating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save & Recalculate
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Profile & Academic Details Modal */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Profile & Academic Details"
        subtitle="Update your personal details, institution, and career direction"
      >
        <form onSubmit={handleSaveProfileDetails} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Current City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Enter your current city"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                College / University Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editCollege}
                onChange={(e) => setEditCollege(e.target.value)}
                placeholder="Enter college or university name"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Degree <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={editDegree}
                onChange={(e) => setEditDegree(e.target.value)}
                placeholder="e.g. B.Tech / BCA / MCA"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Branch / Field of Study
              </label>
              <input
                type="text"
                value={editBranch}
                onChange={(e) => setEditBranch(e.target.value)}
                placeholder="e.g. Computer Science / Robotics"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
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
                value={editGradYear}
                onChange={(e) => setEditGradYear(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Role
              </label>
              <input
                type="text"
                value={editTargetRole}
                onChange={(e) => setEditTargetRole(e.target.value)}
                placeholder="e.g. Full Stack Developer"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingProfile ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
