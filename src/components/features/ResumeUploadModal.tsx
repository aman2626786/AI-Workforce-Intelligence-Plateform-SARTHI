'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { api, ResumeAnalysisResult } from '@/services/api';
import { careerService } from '@/services/careerService';
import { Modal } from '@/components/ui/Modal';
import {
  Upload,
  FileCheck,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  FileText,
} from 'lucide-react';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { profile, activeRole, refreshData, addToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgressIndex, setAnalysisProgressIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['.pdf', '.docx', '.doc'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setErrorMessage('Please upload a valid PDF or DOCX resume document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    setErrorMessage('');
    setResumeFile(file);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartResumeUpdate = async () => {
    if (!resumeFile) return;

    setIsAnalyzing(true);
    setAnalysisProgressIndex(0);
    setErrorMessage('');

    const stages = [
      'Uploading resume file...',
      'Extracting text & layout structure via PyMuPDF...',
      'Segmenting skills, projects, certifications & education...',
      'Cross-referencing 40+ industry competencies...',
      'Updating live skill-match intelligence...',
    ];

    const stageInterval = setInterval(() => {
      setAnalysisProgressIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      // 1. Direct deterministic parsing via Python engine
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

      // 3. Sync live career profile
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
        targetRole: profile?.targetRole || activeRole,
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
      addToast('Resume updated! Skills, projects, and matching scores successfully refreshed.', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      clearInterval(stageInterval);
      setIsAnalyzing(false);
      setErrorMessage(err.message || 'Error occurred while updating resume.');
      addToast(err.message || 'Error occurred while updating resume.', 'error');
    }
  };

  const handleClose = () => {
    onClose();
    setResumeFile(null);
    setAnalysisResult(null);
    setAnalysisSuccess(false);
    setIsAnalyzing(false);
    setErrorMessage('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload / Update Resume"
      subtitle="Upload your latest resume (PDF or DOCX). Our parser extracts verified skills and recalculates matching vs unmatching gaps against all industry requirements."
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
                    Drag and drop your resume file, or <span className="text-purple-600 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 font-medium">Supports PDF, DOCX (Max 10MB)</p>
                </div>
              )}
            </div>

            {/* Current Active Resume Info */}
            {profile?.resume?.fileName && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <div>
                    <span className="font-bold text-slate-800">Currently active: </span>
                    <span className="text-slate-600">{profile.resume.fileName}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {profile.skills.length} Skills Active
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
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
                Analyze & Match Skills
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
              <h4 className="text-base font-extrabold text-slate-900">Processing Your Resume</h4>
              <p className="text-xs text-slate-500">
                Extracting technical skills, tools, and experiences to calculate market alignment...
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-2 text-left">
              {[
                'Uploading resume file...',
                'Extracting text & layout structure via PyMuPDF...',
                'Segmenting skills, projects, certifications & education...',
                'Cross-referencing 40+ industry competencies...',
                'Updating live skill-match intelligence...',
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
                <h4 className="text-sm font-extrabold text-emerald-900">Resume Analyzed & Matches Updated!</h4>
                <p className="text-xs text-emerald-700">
                  {analysisResult.skills?.length || 0} skills successfully extracted. Industry skill status and gaps are now recalculated.
                </p>
              </div>
            </div>

            {/* Extracted Skills Pills */}
            {analysisResult.skills && analysisResult.skills.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Extracted Technical Skills from Resume:</p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {analysisResult.skills.map((sk) => (
                    <span
                      key={sk.skill_id}
                      className="px-2.5 py-1 rounded-lg bg-white text-purple-800 border border-purple-200 text-xs font-bold shadow-xs"
                    >
                      ✓ {sk.canonical_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                <span>View Skill Match Results</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
