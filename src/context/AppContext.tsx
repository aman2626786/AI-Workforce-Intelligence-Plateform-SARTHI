'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  isFeedbackModalOpen: boolean;
  setIsFeedbackModalOpen: (open: boolean) => void;
  openFeedbackModal: () => void;
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
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const openFeedbackModal = () => setIsFeedbackModalOpen(true);
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

  const lastFetchedRef = useRef<{ role: string; location: string }>({ role: '', location: '' });
  const isRefreshingRef = useRef<boolean>(false);

  const getCacheKey = (role: string, type: string) =>
    `matchskill_cache_${(role || 'default').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${type}`;

  const loadFromCache = (role: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const rawSkills = localStorage.getItem(getCacheKey(role, 'skills'));
      const rawOverview = localStorage.getItem(getCacheKey(role, 'overview'));
      const rawJobs = localStorage.getItem(getCacheKey(role, 'jobs'));
      const rawRoadmap = localStorage.getItem(getCacheKey(role, 'roadmap'));

      if (rawSkills && rawOverview && rawRoadmap) {
        return {
          skills: JSON.parse(rawSkills),
          industryOverview: JSON.parse(rawOverview),
          jobs: rawJobs ? JSON.parse(rawJobs) : [],
          roadmap: JSON.parse(rawRoadmap),
        };
      }
    } catch (e) {
      console.warn('Failed to load from browser storage cache:', e);
    }
    return null;
  };

  const saveToCache = (role: string, data: { skills: any; industryOverview: any; jobs: any; roadmap: any }) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(getCacheKey(role, 'skills'), JSON.stringify(data.skills));
      localStorage.setItem(getCacheKey(role, 'overview'), JSON.stringify(data.industryOverview));
      localStorage.setItem(getCacheKey(role, 'jobs'), JSON.stringify(data.jobs));
      localStorage.setItem(getCacheKey(role, 'roadmap'), JSON.stringify(data.roadmap));
    } catch (e) {
      console.warn('Failed to save to browser storage cache:', e);
    }
  };

  const refreshData = async () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin') || path.startsWith('/login') || path.startsWith('/signup')) {
        setIsLoading(false);
        return;
      }
    }
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    // Fast path: load instantly from local browser storage if present (0ms delay)
    const currentTargetRole = activeRole || 'Data Scientist';
    const cachedData = loadFromCache(currentTargetRole);
    if (cachedData) {
      setSkills(cachedData.skills);
      setIndustryOverview(cachedData.industryOverview);
      setJobs(cachedData.jobs);
      setRoadmap(cachedData.roadmap);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    try {
      const profData = await careerService.getStudentProfile();
      const currentRole = profData.targetRole || activeRole || 'Data Scientist';
      const currentLocation = profData.targetLocation || profData.location || activeLocation || 'India';

      lastFetchedRef.current = { role: currentRole, location: currentLocation };

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

      setProfile(profData);
      setSkills(skillsData);
      setIndustryOverview(indData);
      setJobs(jobsData);
      setRoadmap(roadmapData);

      // Persist to browser localStorage so next visits/tab switches are instant
      saveToCache(currentRole, {
        skills: skillsData,
        industryOverview: indData,
        jobs: jobsData,
        roadmap: roadmapData,
      });
    } catch (err) {
      console.warn('Career data loading notice:', err);
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  };

  // Client-side hydration sync for saved user profile & persistent auth listener
  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;
    import('@/services/authService').then(({ authService }) => {
      unsubscribeAuth = authService.initAuthListener(() => {
        refreshData();
      });
    });

    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin') || path.startsWith('/login') || path.startsWith('/signup')) {
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

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (
      lastFetchedRef.current.role === activeRole &&
      lastFetchedRef.current.location === activeLocation
    ) {
      return;
    }
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
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(getCacheKey(activeRole, 'roadmap'), JSON.stringify(updated));
      } catch (e) {}
    }
    addToast(`"${skill.name}" added to your Career Roadmap!`, 'success');
  };

  const toggleRoadmapStatus = async (id: string) => {
    const updated = await careerService.toggleRoadmapStatus(id);
    setRoadmap(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(getCacheKey(activeRole, 'roadmap'), JSON.stringify(updated));
      } catch (e) {}
    }
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
        isFeedbackModalOpen,
        setIsFeedbackModalOpen,
        openFeedbackModal,
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
