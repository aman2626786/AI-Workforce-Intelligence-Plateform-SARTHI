'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StudentProfile } from '../data/profile';
import { IndustrySkill } from '../data/skills';
import { IndustryOverview } from '../data/industry';
import { JobMatch } from '../data/jobs';
import { RoadmapItem } from '../data/roadmap';
import { careerService } from '../services/careerService';

export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  profile: StudentProfile | null;
  skills: IndustrySkill[];
  industryOverview: IndustryOverview | null;
  jobs: JobMatch[];
  roadmap: RoadmapItem[];
  isLoading: boolean;
  activeRole: string;
  setActiveRole: (role: string) => void;
  activeLocation: string;
  setActiveLocation: (loc: string) => void;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
  aiDrawerTopic: string;
  openAiDrawerWithTopic: (topic: string) => void;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
  updateTargetCareer: (role: string, location: string, company?: string) => Promise<void>;
  updateProfileInfo: (updates: { name?: string; email?: string; targetRole?: string; targetLocation?: string; targetCompany?: string }) => Promise<void>;
  addSkillToRoadmap: (skill: IndustrySkill) => Promise<void>;
  toggleRoadmapStatus: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  addSelfReportedSkill: (name: string, category: string, level: 'Basic' | 'Intermediate' | 'Advanced') => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [skills, setSkills] = useState<IndustrySkill[]>([]);
  const [industryOverview, setIndustryOverview] = useState<IndustryOverview | null>(null);
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Deterministic SSR initial defaults to prevent hydration mismatch
  const [activeRole, setActiveRole] = useState<string>('Robotics Engineer');
  const [activeLocation, setActiveLocation] = useState<string>('Bengaluru');

  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [aiDrawerTopic, setAiDrawerTopic] = useState<string>('General Career Intelligence');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    const id = Math.random().toString(36).substring(2, 9);
    // GUARANTEE: Maximum 1 single toast on screen at any time. Never stack multiple boxes!
    setToasts([{ id, type, message }]);
    toastTimeoutRef.current = setTimeout(() => {
      setToasts([]);
    }, 2800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openAiDrawerWithTopic = (topic: string) => {
    setAiDrawerTopic(topic);
    setIsAiDrawerOpen(true);
  };

  const refreshData = async () => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const profData = await careerService.getStudentProfile();
      const currentRole = profData.targetRole || activeRole || 'Data Scientist';
      const currentLocation = profData.targetLocation || profData.location || activeLocation || 'India';

      if (profData.targetRole && profData.targetRole !== activeRole) {
        setActiveRole(profData.targetRole);
      }
      if ((profData.targetLocation || profData.location) && (profData.targetLocation || profData.location) !== activeLocation) {
        setActiveLocation(profData.targetLocation || profData.location);
      }

      const [skillsData, indData, jobsData, roadmapData] = await Promise.all([
        careerService.getIndustrySkills(currentRole, currentLocation),
        careerService.getIndustryOverview(currentRole),
        careerService.getJobMatches(currentRole),
        careerService.getCareerRoadmap(currentRole),
      ]);

      const freshProfile = await careerService.getStudentProfile();
      setProfile(freshProfile);
      setSkills(skillsData);
      setIndustryOverview(indData);
      setJobs(jobsData);
      setRoadmap(roadmapData);
    } catch (err) {
      console.warn('Career data loading notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side hydration sync for saved user profile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/admin')) {
        return;
      }
      try {
        const saved = localStorage.getItem('skillvantage_user_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.targetRole && parsed.targetRole !== activeRole) {
            setActiveRole(parsed.targetRole);
          }
          if ((parsed.preferredLocation || parsed.location) && (parsed.preferredLocation || parsed.location) !== activeLocation) {
            setActiveLocation(parsed.preferredLocation || parsed.location);
          }
        }
      } catch (e) {}
    }
    careerService.getStudentProfile().then((p) => {
      if (p && p.targetRole && p.targetRole !== activeRole) {
        setActiveRole(p.targetRole);
      }
      if (p && (p.targetLocation || p.location)) {
        setActiveLocation(p.targetLocation || p.location);
      }
    });
  }, []);

  useEffect(() => {
    refreshData();
  }, [activeRole, activeLocation]);

  const updateTargetCareer = async (role: string, location: string, company?: string) => {
    setActiveRole(role);
    setActiveLocation(location);
    const updated = await careerService.updateTargetCareer(role, location, company);
    setProfile(updated);
    addToast(`Target career updated to ${role} in ${location}`, 'success');
  };

  const updateProfileInfo = async (updates: {
    name?: string;
    email?: string;
    targetRole?: string;
    targetLocation?: string;
    targetCompany?: string;
  }) => {
    if (updates.targetRole) setActiveRole(updates.targetRole);
    if (updates.targetLocation) setActiveLocation(updates.targetLocation);
    const updated = await careerService.updateProfileInfo(updates);
    setProfile(updated);
    await refreshData();
    addToast('Profile & career preferences updated successfully!', 'success');
  };

  const addSkillToRoadmap = async (skill: IndustrySkill) => {
    const key = skill.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const alreadyExists = roadmap.some(
      (r) => r.skillName.toLowerCase().replace(/[^a-z0-9]/g, '') === key
    );
    if (alreadyExists) {
      addToast(`"${skill.name}" is already in your Career Roadmap.`, 'info');
      return;
    }
    const updated = await careerService.addSkillToRoadmap(skill);
    setRoadmap(updated);
    addToast(`"${skill.name}" added to your Career Roadmap!`, 'success');
  };

  const toggleRoadmapStatus = async (id: string) => {
    const updated = await careerService.toggleRoadmapStatus(id);
    setRoadmap(updated);
    const updatedProfile = await careerService.getStudentProfile();
    setProfile(updatedProfile);
  };

  const logout = async () => {
    try {
      const { authService } = await import('@/services/authService');
      await authService.logout();
    } catch (e) {}
    const { createEmptyStudentProfile } = await import('@/data/profile');
    setProfile(createEmptyStudentProfile());
    addToast('You have been logged out successfully.', 'info');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const addSelfReportedSkill = async (
    name: string,
    category: string,
    level: 'Basic' | 'Intermediate' | 'Advanced'
  ) => {
    const updatedProfile = await careerService.addSkill(name, category, level);
    setProfile(updatedProfile);
    addToast(`Skill "${name}" added to your Career Profile!`, 'success');
  };


  return (
    <AppContext.Provider
      value={{
        profile,
        skills,
        industryOverview,
        jobs,
        roadmap,
        isLoading,
        activeRole,
        setActiveRole,
        activeLocation,
        setActiveLocation,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        aiDrawerTopic,
        openAiDrawerWithTopic,
        toasts,
        addToast,
        removeToast,
        refreshData,
        updateTargetCareer,
        updateProfileInfo,
        addSkillToRoadmap,
        toggleRoadmapStatus,
        logout,
        addSelfReportedSkill,
      }}

    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
