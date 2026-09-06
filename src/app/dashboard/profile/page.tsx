'use client';

import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { api, ResumeAnalysisResult } from '@/services/api';
import { careerService } from '@/services/careerService';
import { CAREER_ROLE_CATEGORIES } from '@/app/onboarding/page';

export default function StudentProfilePage() {
  const { profile, addSelfReportedSkill, addToast, refreshData, setActiveRole } = useApp();

  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Data Visualization');
  const [newSkillLevel, setNewSkillLevel] = useState<'Basic' | 'Intermediate' | 'Advanced'>('Intermediate');

  // Target Career Switcher States
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(profile?.targetRole || '');
  const [isCustomSelectedRole, setIsCustomSelectedRole] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Resume Update States
  const [isUpdateResumeOpen, setIsUpdateResumeOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgressIndex, setAnalysisProgressIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // 1. Direct deterministic parsing & analysis via local Python engine
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

      // 2. Extracted skills directly from the new resume
      const parsedSkills = (result.skills || []).map((s) => ({
        canonical_name: s.canonical_name,
        category: s.category,
        confidence: s.confidence,
        source_section: s.source_section,
      }));

      const firstEdu = result.education && result.education.length > 0 ? result.education[0] : null;

      // 3. Sync live career profile with the newly parsed resume data
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
      setErrorMessage(err.message || 'Error occurred while updating resume.');
      addToast(err.message || 'Error occurred while updating resume.', 'error');
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Student Career Profile</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Your verified skills, projects, certifications, and target career metadata.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsUpdateResumeOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload Updated Resume
          </button>

          <button
            onClick={() => setIsAddSkillOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Self-Reported Skill
          </button>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal & Education */}
        <div className="space-y-6 lg:col-span-1">
          {/* User Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm text-center">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Profile Avatar"
                className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-slate-100 shadow-md mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white text-3xl font-extrabold flex items-center justify-center mx-auto border-4 border-slate-100 shadow-md mb-4">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <h2 className="text-xl font-black text-slate-900">{profile?.name || 'Student Candidate'}</h2>
            <p className="text-xs font-semibold text-brand-600 mt-0.5">{profile?.targetRole ? `${profile.targetRole} Candidate` : 'Career Track Pending'}</p>
            <p className="text-xs text-slate-500 mt-1">{profile?.email || 'Registered User'}</p>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-left text-xs font-medium text-slate-600">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Current Location: <strong className="text-slate-900">{profile?.location || 'Not Specified'}</strong></span>
              </div>
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Target Role: <strong className="text-slate-900">{profile?.targetRole || 'Not Selected'}</strong></span>
                </div>
                <button
                  onClick={() => {
                    setSelectedRole(profile?.targetRole || '');
                    setIsCustomSelectedRole(false);
                    setIsEditRoleOpen(true);
                  }}
                  className="px-2.5 py-1 text-[10px] font-extrabold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Change
                </button>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Target Location: <strong className="text-slate-900">{profile?.targetLocation || 'Not Specified'}</strong></span>
              </div>
            </div>
          </div>

          {/* Target Career Direction Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-brand-900 to-slate-900 text-white shadow-soft-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-300" />
                <h3 className="text-xs font-black uppercase tracking-wider text-brand-200">Career Direction</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active AI Target
              </span>
            </div>
            <div>
              <p className="text-base font-black text-white">{profile?.targetRole || 'No Target Role Selected Yet'}</p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Skill gaps, market benchmarks, and job matching scores are actively tuned for this career path.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedRole(profile?.targetRole || '');
                setIsCustomSelectedRole(false);
                setIsEditRoleOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-600/30 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Switch Target Career Path
            </button>
          </div>

          {/* Education Box */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-extrabold text-slate-900">Education Details</h3>
            </div>
            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-900 text-sm">{profile?.education?.institution || 'Academic Institution (Not specified)'}</h4>
              <p className="text-slate-600 font-medium">{profile?.education?.degree || 'Degree'}</p>
              <p className="text-slate-500 font-medium">Field: {profile?.education?.fieldOfStudy || 'Engineering & Technology'}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-bold text-slate-700">
                <span>Graduation: {profile?.education?.graduationYear || '2026'}</span>
                <span className="text-brand-600">CGPA: {profile?.education?.cgpa || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Resume Box */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-extrabold text-slate-900">Resume Metadata</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                profile?.resume?.fileName
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {profile?.resume?.fileName ? 'Parsed' : 'Pending Upload'}
              </span>
            </div>

            {profile?.resume?.fileName ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <p className="font-extrabold text-slate-900 truncate">{profile.resume.fileName}</p>
                <p className="text-slate-500 font-medium">Uploaded: {profile.resume.uploadDate || 'Recent'} • {profile.resume.fileSize || 'PDF'}</p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-center text-slate-500 font-medium">
                No resume uploaded yet. Upload below for automated skill extraction.
              </div>
            )}

            <button
              onClick={() => setIsUpdateResumeOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200/60 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {profile?.resume?.fileName ? 'Upload Updated Resume' : 'Upload Resume Now'}
            </button>
          </div>
        </div>

        {/* Right Column: Skills Matrix, Projects & Certifications */}
        <div className="space-y-6 lg:col-span-2">
          {/* Extracted & Verified Skills Matrix */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Extracted & Verified Skills</h3>
                <p className="text-xs text-slate-500 font-medium">Categorized by verification source & level</p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 flex-wrap">
                <SkillBadge type="Verified" />
                <SkillBadge type="Resume Extracted" />
                <SkillBadge type="Self Reported" />
              </div>
            </div>

            {profile?.skills && profile.skills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:bg-white hover:shadow-soft-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{skill.category}</span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{skill.name}</h4>
                      </div>
                      <SkillBadge type={skill.type} />
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-1">
                      <span>Level: <strong className="text-slate-900">{skill.level}</strong></span>
                      <span className="text-brand-600">{skill.proficiencyScore}% Score</span>
                    </div>

                    {skill.verifiedBy && (
                      <p className="text-[10px] text-slate-400 italic">Validated by: {skill.verifiedBy}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No skills added to your profile yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Upload your resume to automatically extract your technical skills or add self-reported skills manually.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsAddSkillOpen(true)}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-sm cursor-pointer"
                  >
                    + Add First Skill
                  </button>
                  <button
                    onClick={() => setIsUpdateResumeOpen(true)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs shadow-sm cursor-pointer"
                  >
                    Upload Resume
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Work Experience / Internships Section */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Work Experience & Internships</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                {profile?.experience?.length || 0} Positions
              </span>
            </div>

            <div className="space-y-4">
              {profile?.experience && profile.experience.length > 0 ? (
                profile.experience.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{exp.role}</h4>
                        <p className="text-xs font-bold text-indigo-600">{exp.company}</p>
                      </div>
                      {(exp.startDate || exp.endDate) && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 self-start sm:self-auto">
                          {exp.startDate} {exp.endDate ? `– ${exp.endDate}` : ''}
                        </span>
                      )}
                    </div>
                    {exp.description && (
                      <p className="text-xs text-slate-600 leading-relaxed font-medium pt-1">{exp.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-2">No work experience or internships extracted yet.</p>
              )}
            </div>
          </div>

          {/* Projects Section */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-4">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-brand-600" />
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Projects</h3>
            </div>

            <div className="space-y-4">
              {profile?.projects && profile.projects.length > 0 ? (
                profile.projects.map((proj) => (
                  <div key={proj.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900">{proj.title}</h4>
                      <span className="text-xs font-semibold text-slate-400">{proj.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{proj.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.skillsUsed.map((sk) => (
                        <span key={sk} className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 text-[11px] font-semibold">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-2">No projects extracted yet.</p>
              )}
            </div>
          </div>

          {/* Certifications Section */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft-sm space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Certifications</h3>
            </div>

            <div className="space-y-4">
              {profile?.certifications && profile.certifications.length > 0 ? (
                profile.certifications.map((cert) => (
                  <div key={cert.id} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900">{cert.title}</h4>
                      <span className="text-xs font-bold text-emerald-700">{cert.issueDate}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">Issuer: {cert.issuer}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cert.skillsValidated.map((sk) => (
                        <span key={sk} className="px-2 py-0.5 rounded-md bg-white text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-2">No certifications extracted yet.</p>
              )}
            </div>
          </div>
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
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
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
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
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
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-600/20"
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
                    ? 'border-purple-500 bg-purple-50/50 scale-[0.99]'
                    : resumeFile
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-purple-400 bg-slate-50/50 hover:bg-purple-50/20'
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

                <div className="mx-auto w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3 shadow-inner">
                  {resumeFile ? <FileCheck className="w-7 h-7 text-emerald-600" /> : <Upload className="w-7 h-7" />}
                </div>

                {resumeFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-slate-900">{resumeFile.name}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                    </p>
                    <p className="text-[11px] text-purple-600 font-bold mt-2">Click or drag another file to replace</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-slate-900">
                      Drag and drop your updated resume, or <span className="text-purple-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 font-medium">Supports PDF, DOCX (Max 10MB)</p>
                  </div>
                )}
              </div>

              {/* Current Resume Info notice */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
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
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!resumeFile}
                  onClick={handleStartResumeUpdate}
                  className={`inline-flex items-center gap-2 py-2.5 px-5 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer ${
                    resumeFile
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25'
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
                <div className="w-16 h-16 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-purple-600 absolute inset-0 m-auto" />
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
                          ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200/80'
                          : isDone
                          ? 'text-emerald-700 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
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
                        className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold"
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
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer"
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
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-900"
            >
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
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-brand-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold text-brand-900"
              />
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200 text-xs text-brand-900 space-y-1">
            <p className="font-extrabold flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-brand-600" />
              Dynamic Intelligence Recalculation
            </p>
            <p className="text-[11px] text-brand-700 leading-relaxed">
              When you save, the Profile Intelligence Agent recalculates skill gaps, market demand percentages, and matches strictly against this domain.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditRoleOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingRole}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
    </div>
  );
}
