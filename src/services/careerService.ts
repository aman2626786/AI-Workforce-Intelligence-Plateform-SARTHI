import { StudentProfile, initialStudentProfile, createEmptyStudentProfile, SkillItem, ProjectItem, CertificationItem, ExperienceItem } from '../data/profile';
import { IndustrySkill, initialSkills } from '../data/skills';
import { IndustryOverview, industryData, CompanySkillCriteria, EmergingSkill } from '../data/industry';
import { JobMatch, initialJobs } from '../data/jobs';
import { RoadmapItem, initialRoadmap } from '../data/roadmap';
import { isSkillMatch, findMatchingCandidateSkill } from '../utils/skillMatcher';
import { getRoleSkillDefinitions, getRoleOverviewData } from './domainKnowledge';
import { GLOBAL_SCRAPED_JOBS_DB, ScrapedJobRecord } from '../data/scrapedJobsDatabase';
import { SCRAPED_COMPANIES_DATA, ScrapedCompanyInfo } from '../data/scrapedCompaniesData';

/**
 * Service Layer Abstraction for SkillVantage AI
 * Synchronizes registered user data & parsed resume data dynamically.
 */

class CareerService {
  private profile: StudentProfile = { ...initialStudentProfile };
  private skills: IndustrySkill[] = [...initialSkills];
  private industryInfo: IndustryOverview = { ...industryData };
  private jobs: JobMatch[] = [...initialJobs];
  private roadmap: RoadmapItem[] = [...initialRoadmap];

  constructor() {
    // Attempt to load live user profile from storage if available
    this.loadFromStorage();
  }

  private getStorageKey(): string {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('skillvantage_user_session');
        if (raw) {
          const session = JSON.parse(raw);
          const email = (session.email || session.user_id || '').toLowerCase().trim();
          if (email) {
            return `skillvantage_student_profile_${email}`;
          }
        }
      } catch (e) {}
    }
    return 'skillvantage_student_profile_guest';
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const key = this.getStorageKey();
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.profile = { ...createEmptyStudentProfile(), ...parsed };
        } else {
          const raw = localStorage.getItem('skillvantage_user_session');
          if (raw) {
            const session = JSON.parse(raw);
            this.profile = createEmptyStudentProfile(session.name || '', session.email || '');
            if (session.avatar_url) this.profile.avatarUrl = session.avatar_url;
          } else {
            this.profile = createEmptyStudentProfile();
          }
        }
      } catch (e) {
        console.warn('Could not read user profile from localStorage:', e);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        const key = this.getStorageKey();
        localStorage.setItem(key, JSON.stringify(this.profile));
      } catch (e) {
        console.warn('Could not save user profile to localStorage:', e);
      }
    }
  }

  resetProfileForNewUser(user?: { name?: string; email?: string; avatar_url?: string }) {
    this.profile = createEmptyStudentProfile(user?.name, user?.email);
    if (user?.avatar_url) this.profile.avatarUrl = user.avatar_url;
    this.skills = [];
    this.roadmap = [];
    this.saveToStorage();
  }

  // --- Student Profile ---
  async getStudentProfile(): Promise<StudentProfile> {
    this.loadFromStorage();
    try {
      const { api, getToken } = await import('./api');
      if (!getToken()) {
        return { ...this.profile };
      }
      const remote = await api.getStudentProfile();
      const education = remote.education?.[0];
      this.profile = {
        ...this.profile,
        id: remote.id || this.profile.id,
        name: remote.name || this.profile.name,
        location: remote.city || this.profile.location,
        targetRole: remote.target_role || this.profile.targetRole,
        targetLocation: remote.preferred_location || remote.city || this.profile.targetLocation,
        education: {
          ...this.profile.education,
          institution: remote.college || education?.institution || this.profile.education.institution,
          degree: remote.degree || education?.degree || this.profile.education.degree,
          fieldOfStudy: remote.branch || education?.field || this.profile.education.fieldOfStudy,
          graduationYear: String(remote.graduation_year || education?.graduation_year || this.profile.education.graduationYear),
        },
        projects: (remote.projects || []).map((project: any, index: number) => ({
          id: project.id || `project_${index}`,
          title: project.name,
          description: project.description || '',
          skillsUsed: project.technologies || [],
          link: project.url,
          date: 'Recent',
        })),
        experience: (remote.experience || []).map((item: any, index: number) => ({
          id: item.id || `experience_${index}`,
          role: item.role || '',
          company: item.company || '',
          startDate: item.start_date,
          endDate: item.end_date,
          description: item.description,
        })),
        certifications: (remote.certifications || []).map((item: any, index: number) => ({
          id: item.id || `certification_${index}`,
          title: item.name,
          issuer: item.issuer || '',
          issueDate: item.date || '',
          skillsValidated: [],
        })),
      };
      this.saveToStorage();
    } catch (error: any) {
      if (!error?.message?.includes('not found') && !error?.message?.includes('404')) {
        console.warn('Backend profile unavailable; using cached profile:', error?.message || error);
      }
    }
    return { ...this.profile };
  }

  /**
   * Dynamically populates the student profile using EXACT information
   * entered during registration/onboarding and extracted from their resume.
   */
  async syncOnboardingProfile(data: {
    name: string;
    email: string;
    city: string;
    educationLevel: string;
    degree: string;
    branch?: string;
    college: string;
    graduationYear: number;
    cgpa?: string;
    targetRole?: string;
    preferredLocation?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    resumeFileName?: string;
    resumeFileSize?: string;
    skills: Array<{
      canonical_name: string;
      category: string;
      confidence: number;
      source_section?: string;
    }>;
    projects?: Array<{
      name: string;
      description?: string;
      technologies?: string[];
      url?: string;
    }>;
    experience?: Array<{
      role?: string;
      company?: string;
      start_date?: string;
      end_date?: string;
      description?: string;
    }>;
    certifications?: Array<{
      name: string;
      issuer?: string;
      date?: string;
    }>;
  }): Promise<StudentProfile> {
    // Map extracted/confirmed skills into SkillItems
    const mappedSkills: SkillItem[] = data.skills.map((sk, index) => {
      const isSelfReported = sk.source_section === 'STUDENT_INPUT';
      const level: 'Basic' | 'Intermediate' | 'Advanced' =
        sk.confidence >= 0.95 ? 'Advanced' : sk.confidence >= 0.85 ? 'Intermediate' : 'Basic';

      return {
        id: `sk_live_${index}_${Date.now()}`,
        name: sk.canonical_name,
        category: sk.category || 'General',
        level: level,
        type: isSelfReported ? 'Self Reported' : 'Resume Extracted',
        proficiencyScore: Math.round(sk.confidence * 100),
        lastUpdated: new Date().toISOString().split('T')[0],
      };
    });

    // Map extracted projects into ProjectItems
    const mappedProjects: ProjectItem[] = (data.projects || []).map((p, index) => ({
      id: `proj_live_${index}`,
      title: p.name,
      description: p.description || 'Developed practical solution applying core industry tools.',
      skillsUsed: p.technologies || [],
      link: p.url,
      date: 'Recent',
    }));

    // Map extracted experience into ExperienceItems
    const mappedExperience: ExperienceItem[] = (data.experience || []).map((e, index) => ({
      id: `exp_live_${index}`,
      role: e.role || 'Intern / Professional',
      company: e.company || 'Organization',
      startDate: e.start_date,
      endDate: e.end_date,
      description: e.description,
    }));

    // Map extracted certifications into CertificationItems
    const mappedCertifications: CertificationItem[] = (data.certifications || []).map((c, index) => ({
      id: `cert_live_${index}`,
      title: c.name,
      issuer: c.issuer || 'Accredited Issuer',
      issueDate: c.date || '2025',
      skillsValidated: [],
    }));

    // Calculate dynamic readiness score based on number of skills and profile completeness
    const skillCount = mappedSkills.length;
    const baseScore = Math.min(88, 50 + skillCount * 3.5);
    const calculatedReadiness = Math.round(baseScore);

    // Build the dynamic live profile
    this.profile = {
      id: `std_${Date.now()}`,
      name: data.name,
      email: data.email,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=2563eb&textColor=ffffff`,
      education: {
        institution: data.college,
        degree: data.degree,
        fieldOfStudy: data.branch || 'Engineering / Technical',
        graduationYear: String(data.graduationYear),
        cgpa: data.cgpa || this.profile.education?.cgpa || '',
      },
      location: data.city,
      targetRole: data.targetRole || '',
      targetLocation: data.preferredLocation || data.city || '',
      targetCompany: '',
      readinessScore: calculatedReadiness,
      resume: {
        fileName: data.resumeFileName || '',
        uploadDate: data.resumeFileName ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        fileSize: data.resumeFileSize || '',
        parsedStatus: data.resumeFileName ? 'Parsed' : 'Pending',
      },
      skills: mappedSkills,
      projects: mappedProjects,
      experience: mappedExperience,
      certifications: mappedCertifications,
    };

    this.saveToStorage();
    return { ...this.profile };
  }

  async updateTargetCareer(role: string, location?: string, company?: string): Promise<StudentProfile> {
    this.profile = {
      ...this.profile,
      targetRole: role,
      targetLocation: location || this.profile.targetLocation || 'Bengaluru',
      targetCompany: company || this.profile.targetCompany || 'Open to All',
    };
    this.saveToStorage();

    try {
      const { api } = await import('./api');
      await api.updateTargetCareer(role, this.profile.targetLocation);
      await api.recalculateIntelligence();
    } catch (e) {
      console.warn('Backend updateTargetCareer sync error:', e);
    }
    return { ...this.profile };
  }

  async updateProfileInfo(updates: {
    name?: string;
    email?: string;
    location?: string;
    targetRole?: string;
    targetLocation?: string;
    targetCompany?: string;
    education?: {
      institution?: string;
      degree?: string;
      fieldOfStudy?: string;
      graduationYear?: string;
      cgpa?: string;
    };
  }): Promise<StudentProfile> {
    this.profile = {
      ...this.profile,
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.email !== undefined ? { email: updates.email } : {}),
      ...(updates.location !== undefined ? { location: updates.location } : {}),
      ...(updates.targetRole !== undefined ? { targetRole: updates.targetRole } : {}),
      ...(updates.targetLocation !== undefined ? { targetLocation: updates.targetLocation } : {}),
      ...(updates.targetCompany !== undefined ? { targetCompany: updates.targetCompany } : {}),
      ...(updates.education
        ? {
            education: {
              ...this.profile.education,
              ...updates.education,
            },
          }
        : {}),
    };
    this.saveToStorage();

    try {
      const { api } = await import('./api');
      if (updates.targetRole) {
        await api.updateTargetCareer(updates.targetRole, updates.targetLocation || this.profile.targetLocation);
        await api.recalculateIntelligence();
      }
      // Sync basic profile data with backend API
      await api.saveBasicProfile({
        name: this.profile.name,
        city: this.profile.location,
        education_level: 'Undergraduate',
        degree: this.profile.education?.degree || '',
        branch: this.profile.education?.fieldOfStudy || '',
        college: this.profile.education?.institution || '',
        graduation_year: Number(this.profile.education?.graduationYear) || new Date().getFullYear(),
        target_role: this.profile.targetRole,
        preferred_location: this.profile.targetLocation,
      });
    } catch (e) {
      console.warn('Backend updateProfileInfo sync error:', e);
    }
    return { ...this.profile };
  }

  async addSkill(name: string, category: string, level: 'Basic' | 'Intermediate' | 'Advanced'): Promise<StudentProfile> {
    const newSkillItem: SkillItem = {
      id: `sk_${Date.now()}`,
      name,
      category,
      level,
      type: 'Self Reported',
      proficiencyScore: level === 'Advanced' ? 85 : level === 'Intermediate' ? 65 : 40,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    this.profile.skills.unshift(newSkillItem);
    this.saveToStorage();
    return { ...this.profile };
  }

  // --- Industry Skill Intelligence ---
  async getIndustrySkills(role: string = 'Data Scientist', location: string = 'India'): Promise<IndustrySkill[]> {
    this.loadFromStorage();
    const domainSkills = this.generateDomainSkills(role);

    // Calculate candidate's real weighted readiness score based on actual matched skills
    let totalWeight = 0;
    let earnedWeight = 0;
    domainSkills.forEach((s) => {
      const weight = s.priority === 'Critical' || s.priority === 'High' ? 3 : s.priority === 'Medium' ? 2 : 1;
      totalWeight += weight;
      if (s.studentLevel === 'Advanced') earnedWeight += weight * 1.0;
      else if (s.studentLevel === 'Intermediate') earnedWeight += weight * 0.65;
      else if (s.studentLevel === 'Basic') earnedWeight += weight * 0.35;
    });

    const studentSkillsCount = this.profile.skills?.length || 0;
    this.profile.readinessScore = studentSkillsCount === 0 || totalWeight === 0 
      ? 0 
      : Math.round((earnedWeight / totalWeight) * 100);
    this.saveToStorage();

    return domainSkills;

  }

  generateDomainSkills(role: string): IndustrySkill[] {
    const activeRole = role || this.profile.targetRole || 'Data Scientist';
    const studentSkills = this.profile.skills || [];
    const baseDefs = getRoleSkillDefinitions(activeRole);

    return baseDefs.map((b, idx) => {
      // Find candidate's matching skill in resume with bulletproof canonical matcher
      const candidateSkill = findMatchingCandidateSkill(studentSkills, b.name);

      let studentLevel: 'Advanced' | 'Intermediate' | 'Basic' | 'None' = 'None';
      let gapSeverity: 'Met' | 'Partial' | 'Critical' = 'Critical';

      if (candidateSkill) {
        studentLevel = (candidateSkill.level as any) || 'Intermediate';
        if (studentLevel === 'Advanced') {
          gapSeverity = 'Met';
        } else if (studentLevel === 'Intermediate') {
          gapSeverity = 'Partial';
        } else {
          gapSeverity = b.priority === 'Critical' || b.priority === 'High' ? 'Critical' : 'Partial';
        }
      } else {
        studentLevel = 'None';
        gapSeverity = b.priority === 'Critical' || b.priority === 'High' ? 'Critical' : 'Partial';
      }

      const tier: string =
        idx < 10
          ? 'Top 10 Core Mandate'
          : idx < 25
          ? 'Secondary Tech Stack'
          : idx < 38
          ? 'Specialized & Domain Tools'
          : 'Professional & Best Practices';

      return {
        id: `dom_sk_${idx}_${b.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
        name: b.name,
        category: b.category,
        demandPercentage: b.demand,
        trend: b.trend,
        priority: b.priority,
        status: b.status,
        studentLevel: studentLevel,
        requiredLevel: 'Advanced',
        gapSeverity: gapSeverity,
        categoryColor:
          gapSeverity === 'Met'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : gapSeverity === 'Partial'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-rose-50 text-rose-700 border-rose-200',
        description: b.desc,
        tier: tier,
        tierRank: idx + 1,
      };
    });
  }

  async getIndustryOverview(role: string = 'Data Scientist'): Promise<IndustryOverview> {
    const targetRole = role || this.profile.targetRole || 'Data Scientist';
    const overviewData = getRoleOverviewData(targetRole);

    return {
      targetRole: targetRole,
      totalJobSignals: 1840,
      lastUpdated: 'Live Feed Today',
      timeframe: 'Last 6 Months',
      location: 'Pan India (Bengaluru, Pune, Hyderabad, Remote)',
      trendData: overviewData.trendData,
      emergingSkills: overviewData.emergingSkills,
      companyCriteria: overviewData.companyCriteria,
      skillCompanyMappings: overviewData.skillCompanyMappings,
    };
  }

  // --- Skill Gap Analysis ---
  async getSkillGaps(): Promise<{
    matchScore: number;
    criticalCount: number;
    metCount: number;
    gaps: IndustrySkill[];
  }> {
    this.loadFromStorage();
    const domainSkills = this.generateDomainSkills(this.profile.targetRole || 'Data Scientist');
    const criticalCount = domainSkills.filter((s) => s.gapSeverity === 'Critical').length;
    const metCount = domainSkills.filter((s) => s.gapSeverity === 'Met').length;

    let totalWeight = 0;
    let earnedWeight = 0;
    domainSkills.forEach((s) => {
      const weight = s.priority === 'Critical' || s.priority === 'High' ? 3 : s.priority === 'Medium' ? 2 : 1;
      totalWeight += weight;
      if (s.studentLevel === 'Advanced') earnedWeight += weight * 1.0;
      else if (s.studentLevel === 'Intermediate') earnedWeight += weight * 0.65;
      else if (s.studentLevel === 'Basic') earnedWeight += weight * 0.35;
    });

    const matchScore = Math.max(10, Math.round((earnedWeight / Math.max(1, totalWeight)) * 100));
    this.profile.readinessScore = matchScore;
    this.saveToStorage();

    return {
      matchScore,
      criticalCount,
      metCount,
      gaps: domainSkills,
    };
  }

  // --- Job & Company Matching ---
  async getJobMatches(role: string = 'Data Scientist'): Promise<JobMatch[]> {
    this.loadFromStorage();
    const targetRoleLower = (role || this.profile.targetRole || 'Data Scientist').toLowerCase();
    const candidateSkills = this.profile.skills || [];

    // Filter scraped jobs based on target role keywords
    const roleTokens = targetRoleLower.split(/[\s/,-]+/).filter((t) => t.length > 2);

    let matchedScraped = GLOBAL_SCRAPED_JOBS_DB.filter((job) => {
      const titleLower = job.title.toLowerCase();
      const domainLower = job.domain.toLowerCase();
      const catLower = job.category.toLowerCase();
      return roleTokens.some((tok) => titleLower.includes(tok) || domainLower.includes(tok) || catLower.includes(tok));
    });

    if (matchedScraped.length < 12) {
      matchedScraped = GLOBAL_SCRAPED_JOBS_DB.slice(0, 36);
    }

    const calculatedMatches: JobMatch[] = matchedScraped.slice(0, 48).map((jobData, index) => {
      const strong: string[] = [];
      const missing: string[] = [];

      const enrichedJdSkills = jobData.skills.map((skName, skIdx) => {
        const matched = findMatchingCandidateSkill(candidateSkills, skName);
        const isMatched = !!matched;
        if (isMatched) {
          strong.push(matched.name);
        } else {
          missing.push(skName);
        }
        return {
          name: skName,
          category: jobData.category,
          demandProbability: Math.max(50, 98 - skIdx * 4),
          tier: (skIdx < 3 ? 'Core' : skIdx < 7 ? 'Secondary' : 'Specialized') as 'Core' | 'Secondary' | 'Specialized',
          isMatched,
        };
      });

      const totalReq = Math.max(1, jobData.skills.length);
      const matchedCount = strong.length;

      // If candidate has 0 skills (fresh profile), matchScore is strictly 0!
      const matchScore = candidateSkills.length === 0
        ? 0
        : Math.min(99, Math.max(15, Math.round((matchedCount / totalReq) * 100)));

      const topStrong = strong.slice(0, 4);
      const topMissing = missing.slice(0, 3);

      const explanation = strong.length > 0
        ? `Direct match for ${topStrong.join(', ')}. Mastering ${topMissing.join(' & ')} will complete your 100% profile fit.`
        : candidateSkills.length === 0
        ? `Fresh profile detected. Add your verified skills to calculate compatibility for ${jobData.company}.`
        : `Foundational role requiring core proficiency in ${jobData.skills.slice(0, 3).join(', ')}.`;

      return {
        id: jobData.jobId,
        companyName: jobData.company,
        companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
        jobTitle: jobData.title,
        location: jobData.location,
        type: 'Full-Time',
        salaryRange: jobData.salaryBand,
        matchScore,
        matchedSkillsCount: matchedCount,
        totalRequiredSkillsCount: totalReq,
        strongSkills: topStrong,
        missingSkills: topMissing,
        matchExplanation: explanation,
        postedDaysAgo: (index % 5) + 1,
        department: jobData.domain || jobData.category,
        applyUrl: jobData.applyUrl,
        jdSkills: enrichedJdSkills,
      };
    });

    // If user has skills, sort highest matching first
    if (candidateSkills.length > 0) {
      calculatedMatches.sort((a, b) => b.matchScore - a.matchScore);
    }

    return calculatedMatches;
  }

  getScrapedJobsDatabase(): ScrapedJobRecord[] {
    return GLOBAL_SCRAPED_JOBS_DB;
  }

  getScrapedCompaniesDatabase(): ScrapedCompanyInfo[] {
    return SCRAPED_COMPANIES_DATA;
  }

  private deduplicateRoadmap(items: RoadmapItem[]): RoadmapItem[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = item.skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getRoadmapStorageKey(role?: string): string {
    const roleSlug = (role || this.profile.targetRole || 'default')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    return `${this.getStorageKey()}_roadmap_${roleSlug}`;
  }

  generateRoadmapForRole(role: string): RoadmapItem[] {
    const r = (role || '').toLowerCase();
    if (r.includes('robot') || r.includes('autonom') || r.includes('mechatron') || r.includes('embedded')) {
      return [
        {
          id: 'rm_rob_1',
          stage: 'FOUNDATION',
          stageOrder: 1,
          skillName: 'ROS / ROS2 Core Architecture',
          currentLevel: 'Intermediate',
          targetLevel: 'Advanced',
          priority: 'Critical',
          estimatedHours: 20,
          status: 'In Progress',
          learningObjective: 'Master ROS2 DDS node communications, action servers, and custom message types.',
          recommendedResources: [
            { title: 'ROS2 Navigation & Node Mastery', type: 'Course', estTime: '12 hrs' },
            { title: 'Autonomous Rover Teleoperation Capstone', type: 'Project', estTime: '8 hrs' },
          ],
        },
        {
          id: 'rm_rob_2',
          stage: 'CORE SKILLS',
          stageOrder: 2,
          skillName: 'Visual SLAM & LiDAR Mapping',
          currentLevel: 'Basic',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 25,
          status: 'Not Started',
          learningObjective: 'Implement Cartographer and Gmapping with Kalman Filter sensor fusion.',
          recommendedResources: [
            { title: 'LiDAR SLAM & Point Cloud Processing', type: 'Course', estTime: '15 hrs' },
            { title: 'Indoor Autonomous Navigation Lab', type: 'Project', estTime: '10 hrs' },
          ],
        },
        {
          id: 'rm_rob_3',
          stage: 'INDUSTRY SKILLS',
          stageOrder: 3,
          skillName: 'Gazebo Simulation & MoveIt Kinematics',
          currentLevel: 'None',
          targetLevel: 'Advanced',
          priority: 'Medium',
          estimatedHours: 18,
          status: 'Not Started',
          learningObjective: 'Design URDF robotic arm models and execute inverse kinematics trajectories in MoveIt.',
          recommendedResources: [
            { title: 'Robotics Dynamics & MoveIt Trajectory Planning', type: 'Course', estTime: '10 hrs' },
            { title: 'Multi-Axis Robotic Arm Simulator', type: 'Project', estTime: '8 hrs' },
          ],
        },
        {
          id: 'rm_rob_4',
          stage: 'JOB READY',
          stageOrder: 4,
          skillName: 'RTOS & Embedded Microcontrollers',
          currentLevel: 'Intermediate',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 22,
          status: 'Not Started',
          learningObjective: 'Deploy real-time motor controller loops and CAN bus communication on STM32 / FreeRTOS.',
          recommendedResources: [
            { title: 'STM32 FreeRTOS Motor Control Architecture', type: 'Course', estTime: '14 hrs' },
            { title: 'Hardware-in-the-Loop Autonomous Test Rig', type: 'Project', estTime: '8 hrs' },
          ],
        },
      ];
    } else if (r.includes('data sci') || r.includes('machine learn') || r.includes('ai') || r.includes('deep learn') || r.includes('mlops')) {
      return [
        {
          id: 'rm_ai_1',
          stage: 'FOUNDATION',
          stageOrder: 1,
          skillName: 'Python & Vectorized Data Manipulation',
          currentLevel: 'Intermediate',
          targetLevel: 'Advanced',
          priority: 'Critical',
          estimatedHours: 15,
          status: 'In Progress',
          learningObjective: 'Vectorized computing with NumPy, Pandas data wrangling, and algorithmic data structures.',
          recommendedResources: [
            { title: 'Applied Python for Scientific Computing', type: 'Course', estTime: '10 hrs' },
            { title: 'High-Performance Data Pipeline Lab', type: 'Project', estTime: '5 hrs' },
          ],
        },
        {
          id: 'rm_ai_2',
          stage: 'CORE SKILLS',
          stageOrder: 2,
          skillName: 'Statistical Machine Learning & Scikit-Learn',
          currentLevel: 'Basic',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 25,
          status: 'Not Started',
          learningObjective: 'Formulate predictive models with cross-validation, gradient boosting (XGBoost/LightGBM), and feature engineering.',
          recommendedResources: [
            { title: 'Machine Learning Specialization in Python', type: 'Course', estTime: '15 hrs' },
            { title: 'End-to-End Churn & Retention Predictor', type: 'Project', estTime: '10 hrs' },
          ],
        },
        {
          id: 'rm_ai_3',
          stage: 'INDUSTRY SKILLS',
          stageOrder: 3,
          skillName: 'Deep Learning & PyTorch Transformers',
          currentLevel: 'None',
          targetLevel: 'Intermediate',
          priority: 'High',
          estimatedHours: 30,
          status: 'Not Started',
          learningObjective: 'Train and fine-tune convolutional neural networks and transformer architectures using PyTorch and Hugging Face.',
          recommendedResources: [
            { title: 'Deep Learning with PyTorch', type: 'Course', estTime: '20 hrs' },
            { title: 'LLM Fine-Tuning on Custom Domain Corpus', type: 'Project', estTime: '10 hrs' },
          ],
        },
        {
          id: 'rm_ai_4',
          stage: 'JOB READY',
          stageOrder: 4,
          skillName: 'MLOps, Docker & FastAPI Production Serving',
          currentLevel: 'None',
          targetLevel: 'Advanced',
          priority: 'Critical',
          estimatedHours: 20,
          status: 'Not Started',
          learningObjective: 'Containerize ML models with Docker, serve low-latency inference via FastAPI, and track experiments via MLflow.',
          recommendedResources: [
            { title: 'Production Machine Learning Systems', type: 'Course', estTime: '12 hrs' },
            { title: 'Live Model API Deployment on Cloud', type: 'Project', estTime: '8 hrs' },
          ],
        },
      ];
    } else if (r.includes('full stack') || r.includes('frontend') || r.includes('backend') || r.includes('software') || r.includes('web')) {
      return [
        {
          id: 'rm_swe_1',
          stage: 'FOUNDATION',
          stageOrder: 1,
          skillName: 'Modern TypeScript & Frontend Architecture',
          currentLevel: 'Intermediate',
          targetLevel: 'Advanced',
          priority: 'Critical',
          estimatedHours: 20,
          status: 'In Progress',
          learningObjective: 'Master TypeScript strict type safety, asynchronous patterns, state management, and Next.js / React 19.',
          recommendedResources: [
            { title: 'Enterprise TypeScript & Modern React', type: 'Course', estTime: '12 hrs' },
            { title: 'Dynamic Interactive SaaS Dashboard', type: 'Project', estTime: '8 hrs' },
          ],
        },
        {
          id: 'rm_swe_2',
          stage: 'CORE SKILLS',
          stageOrder: 2,
          skillName: 'Scalable REST & GraphQL Backend APIs',
          currentLevel: 'Basic',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 25,
          status: 'Not Started',
          learningObjective: 'Architect modular backend microservices with Express/Node or FastAPI, JWT authentication, and rate limiting.',
          recommendedResources: [
            { title: 'Backend API Engineering & Security', type: 'Course', estTime: '15 hrs' },
            { title: 'Multi-Tenant Collaborative Workspace API', type: 'Project', estTime: '10 hrs' },
          ],
        },
        {
          id: 'rm_swe_3',
          stage: 'INDUSTRY SKILLS',
          stageOrder: 3,
          skillName: 'Database Design & Caching (PostgreSQL & Redis)',
          currentLevel: 'None',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 20,
          status: 'Not Started',
          learningObjective: 'Index optimization, ACID transactions, relational data modeling in PostgreSQL, and Redis in-memory caching.',
          recommendedResources: [
            { title: 'High-Performance Relational Databases', type: 'Course', estTime: '12 hrs' },
            { title: 'Distributed Cache & Session Store Lab', type: 'Project', estTime: '8 hrs' },
          ],
        },
        {
          id: 'rm_swe_4',
          stage: 'JOB READY',
          stageOrder: 4,
          skillName: 'Docker, CI/CD Pipelines & Cloud Deployment',
          currentLevel: 'Basic',
          targetLevel: 'Advanced',
          priority: 'Critical',
          estimatedHours: 22,
          status: 'Not Started',
          learningObjective: 'Package full-stack applications with Docker, build automated GitHub Actions CI/CD workflows, and deploy to AWS/GCP.',
          recommendedResources: [
            { title: 'DevOps & Cloud Delivery for Software Engineers', type: 'Course', estTime: '14 hrs' },
            { title: 'Production Cloud Deployment Capstone', type: 'Project', estTime: '8 hrs' },
          ],
        },
      ];
    } else if (r.includes('cloud') || r.includes('devops') || r.includes('sre')) {
      return [
        {
          id: 'rm_cloud_1',
          stage: 'FOUNDATION',
          stageOrder: 1,
          skillName: 'Linux Systems Administration & Bash Scripting',
          currentLevel: 'Intermediate',
          targetLevel: 'Advanced',
          priority: 'Critical',
          estimatedHours: 18,
          status: 'In Progress',
          learningObjective: 'Automate server provisioning, systemd services, networking protocols (TCP/IP, DNS), and shell scripts.',
          recommendedResources: [
            { title: 'Linux Command Line & Scripting Mastery', type: 'Course', estTime: '10 hrs' },
            { title: 'Automated Server Hardening Script', type: 'Project', estTime: '8 hrs' },
          ],
        },
        {
          id: 'rm_cloud_2',
          stage: 'CORE SKILLS',
          stageOrder: 2,
          skillName: 'Docker Containers & Kubernetes Orchestration',
          currentLevel: 'Basic',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 30,
          status: 'Not Started',
          learningObjective: 'Build multi-stage Dockerfiles and manage production Kubernetes deployments, ingresses, and Helm charts.',
          recommendedResources: [
            { title: 'Kubernetes for Cloud Professionals', type: 'Course', estTime: '18 hrs' },
            { title: 'Microservices Cluster Deployment on K8s', type: 'Project', estTime: '12 hrs' },
          ],
        },
        {
          id: 'rm_cloud_3',
          stage: 'INDUSTRY SKILLS',
          stageOrder: 3,
          skillName: 'Infrastructure as Code (Terraform) on AWS/GCP',
          currentLevel: 'None',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 25,
          status: 'Not Started',
          learningObjective: 'Declaratively manage cloud VPCs, IAM policies, and compute clusters using reusable Terraform modules.',
          recommendedResources: [
            { title: 'Terraform Cloud Infrastructure Automation', type: 'Course', estTime: '15 hrs' },
            { title: 'Multi-Region High-Availability VPC Setup', type: 'Project', estTime: '10 hrs' },
          ],
        },
        {
          id: 'rm_cloud_4',
          stage: 'JOB READY',
          stageOrder: 4,
          skillName: 'CI/CD Pipelines & Site Reliability (Prometheus/Grafana)',
          currentLevel: 'None',
          targetLevel: 'Advanced',
          priority: 'Critical',
          estimatedHours: 20,
          status: 'Not Started',
          learningObjective: 'Automate build-test-deploy pipelines and monitor uptime with Prometheus metrics, alertmanagers, and Grafana.',
          recommendedResources: [
            { title: 'Observability & SRE in Cloud Systems', type: 'Course', estTime: '12 hrs' },
            { title: 'Automated Zero-Downtime Pipeline Lab', type: 'Project', estTime: '8 hrs' },
          ],
        },
      ];
    } else if (r.includes('cyber') || r.includes('security')) {
      return [
        {
          id: 'rm_sec_1',
          stage: 'FOUNDATION',
          stageOrder: 1,
          skillName: 'Network Security & Packet Analysis',
          currentLevel: 'Intermediate',
          targetLevel: 'Advanced',
          priority: 'Critical',
          estimatedHours: 20,
          status: 'In Progress',
          learningObjective: 'Inspect packet captures with Wireshark, analyze firewalls, TCP handshake vulnerabilities, and TLS ciphers.',
          recommendedResources: [
            { title: 'Network Security & Protocol Analysis', type: 'Course', estTime: '12 hrs' },
            { title: 'Wireshark Threat Detection Lab', type: 'Project', estTime: '8 hrs' },
          ],
        },
        {
          id: 'rm_sec_2',
          stage: 'CORE SKILLS',
          stageOrder: 2,
          skillName: 'Operating System Hardening & Identity Management',
          currentLevel: 'Basic',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 22,
          status: 'Not Started',
          learningObjective: 'Implement least-privilege RBAC, Active Directory security, PAM authentication, and auditd logging.',
          recommendedResources: [
            { title: 'Linux & Windows Enterprise Hardening', type: 'Course', estTime: '14 hrs' },
            { title: 'Enterprise Access Control & Audit Rig', type: 'Project', estTime: '8 hrs' },
          ],
        },
        {
          id: 'rm_sec_3',
          stage: 'INDUSTRY SKILLS',
          stageOrder: 3,
          skillName: 'Security Operations (SIEM & Splunk) & Incident Response',
          currentLevel: 'None',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 25,
          status: 'Not Started',
          learningObjective: 'Ingest enterprise server logs, detect anomalous lateral movement, and automate incident triage playbooks.',
          recommendedResources: [
            { title: 'SOC Analyst & SIEM Engineering', type: 'Course', estTime: '15 hrs' },
            { title: 'Splunk Threat Hunting Simulation', type: 'Project', estTime: '10 hrs' },
          ],
        },
        {
          id: 'rm_sec_4',
          stage: 'JOB READY',
          stageOrder: 4,
          skillName: 'Ethical Hacking & Web Penetration Testing (OWASP Top 10)',
          currentLevel: 'None',
          targetLevel: 'Advanced',
          priority: 'Critical',
          estimatedHours: 25,
          status: 'Not Started',
          learningObjective: 'Identify SQL injection, XSS, SSRF, and broken access controls using Burp Suite and Metasploit in legal labs.',
          recommendedResources: [
            { title: 'Practical Web Application Penetration Testing', type: 'Course', estTime: '15 hrs' },
            { title: 'OWASP Vulnerability Assessment & Audit Report', type: 'Project', estTime: '10 hrs' },
          ],
        },
      ];
    } else {
      // Default: Data Analyst & Business Intelligence
      return [...initialRoadmap];
    }
  }

  private loadRoadmapFromStorage(role?: string) {
    const targetRole = role || this.profile.targetRole || 'Software Engineer';
    if (typeof window !== 'undefined') {
      try {
        const key = this.getRoadmapStorageKey(targetRole);
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.roadmap = this.deduplicateRoadmap(parsed);
            return;
          }
        }
      } catch (e) {
        console.warn('Could not read roadmap from localStorage:', e);
      }
    }

    this.roadmap = this.deduplicateRoadmap(this.generateRoadmapForRole(targetRole));
    this.saveRoadmapToStorage(targetRole);
  }

  private saveRoadmapToStorage(role?: string) {
    if (typeof window !== 'undefined') {
      try {
        const targetRole = role || this.profile.targetRole || 'Software Engineer';
        const key = this.getRoadmapStorageKey(targetRole);
        localStorage.setItem(key, JSON.stringify(this.roadmap));
      } catch (e) {
        console.warn('Could not save roadmap to localStorage:', e);
      }
    }
  }

  // --- Career Roadmap ---
  async getCareerRoadmap(role?: string): Promise<RoadmapItem[]> {
    const targetRole = role || this.profile.targetRole || 'Software Engineer';
    this.loadRoadmapFromStorage(targetRole);
    this.roadmap = this.deduplicateRoadmap(this.roadmap);
    this.saveRoadmapToStorage(targetRole);

    return new Promise((resolve) => {
      resolve([...this.roadmap]);
    });
  }

  async deleteRoadmapItem(id: string): Promise<RoadmapItem[]> {
    this.roadmap = this.roadmap.filter((item) => item.id !== id);
    this.saveRoadmapToStorage();
    return [...this.roadmap];
  }

  async resetRoadmapForRole(role: string): Promise<RoadmapItem[]> {
    this.roadmap = this.deduplicateRoadmap(this.generateRoadmapForRole(role));
    this.saveRoadmapToStorage(role);
    return [...this.roadmap];
  }

  async toggleRoadmapStatus(id: string): Promise<RoadmapItem[]> {
    this.roadmap = this.deduplicateRoadmap(this.roadmap);
    this.roadmap = this.roadmap.map((item) => {
      if (item.id === id) {
        const nextStatus: RoadmapItem['status'] =
          item.status === 'Completed' ? 'In Progress' : 'Completed';
        return {
          ...item,
          status: nextStatus,
        };
      }
      return item;
    });

    const completed = this.roadmap.filter((r) => r.status === 'Completed').length;
    this.profile.readinessScore = Math.min(95, 60 + completed * 8);
    this.saveToStorage();
    this.saveRoadmapToStorage();

    return [...this.roadmap];
  }

  async addSkillToRoadmap(skill: IndustrySkill): Promise<RoadmapItem[]> {
    if (!this.roadmap || this.roadmap.length === 0) {
      this.loadRoadmapFromStorage();
    }
    this.roadmap = this.deduplicateRoadmap(this.roadmap);
    const key = skill.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const alreadyExists = this.roadmap.some(
      (item) => item.skillName.toLowerCase().replace(/[^a-z0-9]/g, '') === key
    );
    if (alreadyExists) {
      return [...this.roadmap];
    }

    const newItem: RoadmapItem = {
      id: `rm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      stage: 'CORE SKILLS',
      stageOrder: 2,
      skillName: skill.name,
      currentLevel: skill.studentLevel,
      targetLevel: skill.requiredLevel,
      priority: skill.priority === 'Emerging' ? 'High' : skill.priority,
      estimatedHours: 15,
      status: 'In Progress',
      learningObjective: `Master ${skill.name} through targeted exercises and real-world projects.`,
      recommendedResources: [
        { title: `${skill.name} Practical Specialization`, type: 'Course', estTime: '10 hrs' },
        { title: `${skill.name} Capstone Project`, type: 'Project', estTime: '5 hrs' },
      ],
    };
    this.roadmap.push(newItem);
    this.saveRoadmapToStorage();
    return [...this.roadmap];
  }
}

export const careerService = new CareerService();
