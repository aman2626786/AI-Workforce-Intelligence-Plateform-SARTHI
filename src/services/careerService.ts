import { StudentProfile, initialStudentProfile, SkillItem, ProjectItem, CertificationItem, ExperienceItem } from '../data/profile';
import { IndustrySkill, initialSkills } from '../data/skills';
import { IndustryOverview, industryData, CompanySkillCriteria } from '../data/industry';
import { JobMatch, initialJobs } from '../data/jobs';
import { RoadmapItem, initialRoadmap } from '../data/roadmap';
import { isSkillMatch, findMatchingCandidateSkill } from '../utils/skillMatcher';

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

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('skillvantage_user_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.profile = { ...this.profile, ...parsed };
        }
      } catch (e) {
        console.warn('Could not read user profile from localStorage:', e);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('skillvantage_user_profile', JSON.stringify(this.profile));
      } catch (e) {
        console.warn('Could not save user profile to localStorage:', e);
      }
    }
  }

  // --- Student Profile ---
  async getStudentProfile(): Promise<StudentProfile> {
    this.loadFromStorage();
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...this.profile }), 50);
    });
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
        cgpa: data.cgpa || this.profile.education?.cgpa || '8.4',
      },
      location: data.city,
      targetRole: data.targetRole || 'Robotics Engineer',
      targetLocation: data.preferredLocation || data.city,
      targetCompany: 'Open to Top Employers',
      readinessScore: calculatedReadiness,
      resume: {
        fileName: data.resumeFileName || 'Uploaded_Resume.pdf',
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        fileSize: data.resumeFileSize || '1.8 MB',
        parsedStatus: 'Parsed',
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
  async getIndustrySkills(role: string = 'Robotics Engineer', location: string = 'India'): Promise<IndustrySkill[]> {
    try {
      const { api } = await import('./api');
      const data = await api.getSkillGaps();
      if (data && data.skill_gaps && data.skill_gaps.length > 0) {
        return data.skill_gaps.map((g: any) => ({
          id: g.skill_id,
          name: g.canonical_name,
          category: g.category,
          demandPercentage: Math.round(g.demand_percentage),
          trend: g.trend_label === 'RISING_FAST' ? 'rapid' : g.trend_label === 'RISING' ? 'up' : g.trend_label === 'DECLINING' ? 'down' : 'stable',
          priority: g.priority_level === 'HIGH' ? 'High' : g.priority_level === 'MEDIUM' ? 'Medium' : 'Low',
          status: g.is_emerging ? 'Emerging' : g.trend_label === 'RISING' ? 'Rising' : 'Stable',
          studentLevel: g.status === 'MATCHED' ? 'Advanced' : g.status === 'PARTIAL' ? 'Intermediate' : 'None',
          requiredLevel: 'Advanced',
          gapSeverity: g.status === 'MATCHED' ? 'Met' : g.status === 'PARTIAL' ? 'Partial' : 'Critical',
          categoryColor: g.status === 'MATCHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : g.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200',
          description: g.matching_evidence || `${g.canonical_name} is required in ${Math.round(g.demand_percentage)}% of target job postings.`
        }));
      }
    } catch (e) {
      // Graceful fallback to domain generators if live API is starting
    }

    return this.generateDomainSkills(role);
  }

  generateDomainSkills(role: string): IndustrySkill[] {
    const rLower = (role || 'Robotics Engineer').toLowerCase();
    const studentSkillNames = (this.profile.skills || []).map((s) => s.name.toLowerCase());

    let baseDefs: Array<{ name: string; category: string; demand: number; trend: 'rapid' | 'up' | 'stable'; priority: 'High' | 'Medium' | 'Low'; status: 'Emerging' | 'Rising' | 'Stable'; desc: string }> = [];

    // Include core and specialized domain skills
    if (rLower.includes('robot') || rLower.includes('autonom') || rLower.includes('mechatron')) {
      baseDefs = [
        { name: 'ROS / ROS2', category: 'Robotics Middleware', demand: 94, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Robot Operating System node development, DDS, and message passing.' },
        { name: 'C++', category: 'Systems Programming', demand: 89, trend: 'up', priority: 'High', status: 'Rising', desc: 'Modern C++ (C++17/20) for real-time low latency motion execution.' },
        { name: 'SLAM & Perception', category: 'Autonomous Navigation', demand: 84, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Simultaneous localization, LiDAR point cloud mapping, and Kalman filters.' },
        { name: 'Gazebo & Simulation', category: 'Robotics Simulation', demand: 78, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Physics-based simulation and URDF kinematic modeling.' },
        { name: 'Kinematics & Dynamics', category: 'Robotics Mechanics', demand: 75, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Forward/inverse kinematics, MoveIt, and trajectory planning.' },
        { name: 'Embedded C & RTOS', category: 'Embedded Systems', demand: 71, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Deterministic task scheduling on STM32, Arduino, and ARM Cortex.' },
        { name: 'CUDA & GPU Acceleration', category: 'Edge Computing', demand: 68, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Parallel acceleration for on-robot deep learning and vision perception.' },
        { name: 'CAN Bus & Hardware Telemetry', category: 'Industrial Protocols', demand: 64, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Differential serial bus communication between motor controllers and ECU.' }
      ];
    } else if (rLower.includes('embed') || rLower.includes('firmware') || rLower.includes('iot') || rLower.includes('hardware')) {
      baseDefs = [
        { name: 'Embedded C', category: 'Firmware Development', demand: 95, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Low-level bare-metal driver programming and register configuration.' },
        { name: 'FreeRTOS / RTOS', category: 'Real-Time Systems', demand: 90, trend: 'rapid', priority: 'High', status: 'Rising', desc: 'Real-time operating system kernel task scheduling and semaphores.' },
        { name: 'Microcontrollers (STM32/ESP32)', category: 'Hardware', demand: 88, trend: 'up', priority: 'High', status: 'Rising', desc: 'ARM Cortex-M peripheral integration and flashing.' },
        { name: 'Communication Protocols (I2C/SPI/CAN)', category: 'Hardware Interfaces', demand: 82, trend: 'stable', priority: 'High', status: 'Stable', desc: 'CAN bus, UART, SPI, and I2C hardware bus telemetry.' },
        { name: 'PCB Design & Schematics', category: 'Electronics', demand: 68, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Altium Designer and KiCad multilayer PCB routing.' }
      ];
    } else if (rLower.includes('cyber') || rLower.includes('security') || rLower.includes('soc')) {
      baseDefs = [
        { name: 'Network Security & Firewalls', category: 'Cybersecurity', demand: 92, trend: 'up', priority: 'High', status: 'Rising', desc: 'Packet analysis, Wireshark, and network boundary defense.' },
        { name: 'SIEM & SOC Operations', category: 'Incident Response', demand: 88, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Splunk, log monitoring, and threat hunting.' },
        { name: 'OWASP & Web Security', category: 'AppSec', demand: 85, trend: 'up', priority: 'High', status: 'Rising', desc: 'Vulnerability assessment, penetration testing, and secure practical security.' },
        { name: 'Cryptography & Identity', category: 'Security Architecture', demand: 74, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'PKI, TLS, and identity access management.' }
      ];
    } else if (rLower.includes('ai') || rLower.includes('machine learning') || rLower.includes('vision') || rLower.includes('nlp')) {
      baseDefs = [
        { name: 'PyTorch & Neural Networks', category: 'Deep Learning', demand: 94, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Model architecture design, training loops, and CUDA acceleration.' },
        { name: 'Python', category: 'Programming', demand: 96, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Core scientific computing, NumPy, and algorithm optimization.' },
        { name: 'Generative AI & LLMs', category: 'Emerging Tech', demand: 88, trend: 'rapid', priority: 'High', status: 'Emerging', desc: 'Transformers, fine-tuning, embeddings, and RAG pipelines.' },
        { name: 'Computer Vision / NLP', category: 'Applied AI', demand: 82, trend: 'up', priority: 'High', status: 'Rising', desc: 'Object detection, OpenCV, and text representations.' },
        { name: 'MLOps & Docker', category: 'Deployment', demand: 75, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Containerized model inference and REST API deployment.' }
      ];
    } else if (rLower.includes('full') || rLower.includes('software') || rLower.includes('backend') || rLower.includes('frontend')) {
      baseDefs = [
        { name: 'TypeScript & JavaScript', category: 'Programming', demand: 92, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Modern typed application development across client and server.' },
        { name: 'React / Next.js', category: 'Frontend', demand: 90, trend: 'up', priority: 'High', status: 'Rising', desc: 'Component architecture, SSR, and dynamic user interfaces.' },
        { name: 'Node.js & FastAPI / Backend', category: 'Backend', demand: 87, trend: 'up', priority: 'High', status: 'Rising', desc: 'REST API design, authentication, and async microservices.' },
        { name: 'SQL & Database Architecture', category: 'Databases', demand: 84, trend: 'stable', priority: 'High', status: 'Stable', desc: 'PostgreSQL, relational data modeling, and query indexing.' },
        { name: 'Docker & CI/CD', category: 'DevOps', demand: 76, trend: 'up', priority: 'Medium', status: 'Rising', desc: 'Containerization, automated build workflows, and cloud deployments.' }
      ];
    } else {
      baseDefs = [
        { name: 'SQL & Query Optimization', category: 'Database', demand: 92, trend: 'stable', priority: 'High', status: 'Stable', desc: 'Complex joins, window functions, and relational analytics.' },
        { name: 'Python & Pandas', category: 'Data Analysis', demand: 88, trend: 'up', priority: 'High', status: 'Rising', desc: 'Data wrangling, statistical transformations, and feature engineering.' },
        { name: 'Power BI & Tableau', category: 'Data Visualization', demand: 85, trend: 'up', priority: 'High', status: 'Rising', desc: 'Executive dashboard development and DAX measures.' },
        { name: 'Business Statistics', category: 'Analytics', demand: 72, trend: 'stable', priority: 'Medium', status: 'Stable', desc: 'Hypothesis testing, regression analysis, and variance tests.' }
      ];
    }

    const studentSkills = this.profile.skills || [];

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
          gapSeverity = b.priority === 'High' ? 'Critical' : 'Partial';
        }
      } else {
        studentLevel = 'None';
        gapSeverity = b.priority === 'High' ? 'Critical' : 'Partial';
      }

      return {
        id: `dom_sk_${idx}_${b.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: b.name,
        category: b.category,
        demandPercentage: b.demand,
        trend: b.trend,
        priority: b.priority,
        status: b.status,
        studentLevel: studentLevel,
        requiredLevel: 'Advanced',
        gapSeverity: gapSeverity,
        categoryColor: gapSeverity === 'Met' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : gapSeverity === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200',
        description: b.desc
      };
    });
  }

  async getIndustryOverview(role: string = 'Robotics Engineer'): Promise<IndustryOverview> {
    const rLower = (role || this.profile.targetRole || 'Robotics Engineer').toLowerCase();
    
    let domainCompanies: CompanySkillCriteria[] = [
      {
        id: 'cc_rob_1',
        companyName: 'GreyOrange Robotics',
        companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120',
        industryTier: 'Tier 1 Tech',
        activeRole: 'Robotics Software Engineer',
        openPositionsCount: 8,
        entryMandatorySkills: ['ROS / ROS2', 'C++', 'SLAM & Perception'],
        preferredAdvancedSkills: ['Gazebo', 'MoveIt', 'RTOS'],
        hiringStatus: 'Actively Hiring',
        minProficiencyExpected: 'Intermediate',
      },
      {
        id: 'cc_rob_2',
        companyName: 'ABB Robotics',
        companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120',
        industryTier: 'Tier 1 Tech',
        activeRole: 'Autonomous Navigation Engineer',
        openPositionsCount: 12,
        entryMandatorySkills: ['ROS2', 'Kinematics', 'OpenCV'],
        preferredAdvancedSkills: ['LiDAR Point Clouds', 'State Estimation'],
        hiringStatus: 'Hiring Peak',
        minProficiencyExpected: 'Intermediate',
      },
      {
        id: 'cc_rob_3',
        companyName: 'Tesla Autopilot & Robotics',
        companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
        industryTier: 'Unicorn',
        activeRole: 'SLAM & Perception Engineer',
        openPositionsCount: 6,
        entryMandatorySkills: ['C++', 'ROS2', 'SLAM'],
        preferredAdvancedSkills: ['CUDA', 'Kalman Filters', 'Sensors'],
        hiringStatus: 'Actively Hiring',
        minProficiencyExpected: 'Advanced',
      },
    ];

    if (rLower.includes('cyber') || rLower.includes('security')) {
      domainCompanies = [
        {
          id: 'cc_cyb_1',
          companyName: 'CrowdStrike',
          companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120',
          industryTier: 'Tier 1 Tech',
          activeRole: 'Cybersecurity Engineer',
          openPositionsCount: 10,
          entryMandatorySkills: ['SIEM', 'Network Security', 'OWASP'],
          preferredAdvancedSkills: ['Splunk', 'Threat Hunting'],
          hiringStatus: 'Actively Hiring',
          minProficiencyExpected: 'Advanced',
        },
      ];
    } else if (rLower.includes('ai') || rLower.includes('machine learning')) {
      domainCompanies = [
        {
          id: 'cc_ai_1',
          companyName: 'Anthropic Partner Lab',
          companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120',
          industryTier: 'Unicorn',
          activeRole: 'AI / Deep Learning Engineer',
          openPositionsCount: 14,
          entryMandatorySkills: ['PyTorch', 'Python', 'LLMs & Generative AI'],
          preferredAdvancedSkills: ['CUDA', 'MLOps', 'Transformers'],
          hiringStatus: 'Actively Hiring',
          minProficiencyExpected: 'Advanced',
        },
      ];
    }

    return {
      targetRole: role || this.profile.targetRole || 'Robotics Engineer',
      totalJobSignals: 1840,
      lastUpdated: 'Live Feed Today',
      timeframe: 'Last 6 Months',
      location: 'Pan India (Bengaluru, Pune, Hyderabad, Remote)',
      trendData: this.industryInfo.trendData,
      emergingSkills: this.industryInfo.emergingSkills,
      companyCriteria: domainCompanies,
      skillCompanyMappings: this.industryInfo.skillCompanyMappings,
    };
  }

  // --- Skill Gap Analysis ---
  async getSkillGaps(): Promise<{
    matchScore: number;
    criticalCount: number;
    metCount: number;
    gaps: IndustrySkill[];
  }> {
    try {
      const { api } = await import('./api');
      const data = await api.getSkillGaps();
      if (data && data.skill_gaps && data.skill_gaps.length > 0) {
        const liveGaps: IndustrySkill[] = data.skill_gaps.map((g: any) => ({
          id: g.skill_id,
          name: g.canonical_name,
          category: g.category,
          demandPercentage: Math.round(g.demand_percentage),
          trend: g.trend_label === 'RISING_FAST' ? 'rapid' : g.trend_label === 'RISING' ? 'up' : g.trend_label === 'DECLINING' ? 'down' : 'stable',
          priority: g.priority_level === 'HIGH' ? 'High' : g.priority_level === 'MEDIUM' ? 'Medium' : 'Low',
          status: g.is_emerging ? 'Emerging' : g.trend_label === 'RISING' ? 'Rising' : 'Stable',
          studentLevel: g.status === 'MATCHED' ? 'Advanced' : g.status === 'PARTIAL' ? 'Intermediate' : 'None',
          requiredLevel: 'Advanced',
          gapSeverity: g.status === 'MATCHED' ? 'Met' : g.status === 'PARTIAL' ? 'Partial' : 'Critical',
          categoryColor: g.status === 'MATCHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : g.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200',
          description: g.matching_evidence || `${g.canonical_name} demanded in ${Math.round(g.demand_percentage)}% of active jobs.`
        }));

        const criticalCount = liveGaps.filter((s) => s.gapSeverity === 'Critical').length;
        const metCount = liveGaps.filter((s) => s.gapSeverity === 'Met').length;

        // Update profile readiness score
        this.profile.readinessScore = Math.round(data.career_fit_score || this.profile.readinessScore);
        this.saveToStorage();

        return {
          matchScore: Math.round(data.career_fit_score || this.profile.readinessScore),
          criticalCount,
          metCount,
          gaps: liveGaps,
        };
      }
    } catch (e) {
      // Graceful fallback to dynamic domain generator
    }

    const domainSkills = this.generateDomainSkills(this.profile.targetRole || 'Robotics Engineer');
    const criticalCount = domainSkills.filter((s) => s.gapSeverity === 'Critical').length;
    const metCount = domainSkills.filter((s) => s.gapSeverity === 'Met').length;
    const matchScore = Math.round((metCount / Math.max(1, domainSkills.length)) * 100);

    return {
      matchScore: matchScore > 0 ? matchScore : 65,
      criticalCount,
      metCount,
      gaps: domainSkills,
    };
  }

  // --- Job & Company Matching ---
  async getJobMatches(role: string = 'Robotics Engineer'): Promise<JobMatch[]> {
    try {
      const { api } = await import('./api');
      const data = await api.getRecommendations(20);
      if (data && data.recommendations && data.recommendations.length > 0) {
        return data.recommendations.map((r: any) => {
          const matchedSkillsList = (r.matched_skills || []).map((s: any) => s.canonical_name || s);
          const missingSkillsList = [
            ...(r.missing_required_skills || []).map((s: any) => s.canonical_name || s),
            ...(r.missing_preferred_skills || []).map((s: any) => s.canonical_name || s)
          ];
          const totalReq = matchedSkillsList.length + missingSkillsList.length;

          return {
            id: r.job_id,
            companyName: r.company_name,
            companyLogo: `https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120`,
            jobTitle: r.title,
            location: r.remote ? 'Remote' : (r.location || 'India'),
            type: r.remote ? 'Remote' : 'Full-Time',
            salaryRange: r.salary_min && r.salary_max ? `₹${(r.salary_min / 100000).toFixed(1)} - ₹${(r.salary_max / 100000).toFixed(1)} LPA` : '₹12.0 - ₹22.0 LPA',
            matchScore: Math.round(r.match_score),
            matchedSkillsCount: matchedSkillsList.length,
            totalRequiredSkillsCount: Math.max(matchedSkillsList.length, totalReq),
            strongSkills: matchedSkillsList,
            missingSkills: missingSkillsList,
            matchExplanation: r.why_recommended || (r.explanation_breakdown || []).join(' • '),
            postedDaysAgo: 2,
            department: r.country === 'IN' ? 'Domestic Market' : 'Global Opportunities',
          };
        });
      }
    } catch (e) {
      // Graceful fallback to dynamic domain job matches
    }

    // Dynamic role-filtered fallback with TRUE candidate-to-job matching
    const targetRoleLower = (role || this.profile.targetRole || 'Robotics Engineer').toLowerCase();
    const candidateSkills = this.profile.skills || [];

    const calculateDynamicJobMatch = (jobData: {
      id: string;
      companyName: string;
      companyLogo: string;
      jobTitle: string;
      location: string;
      type: string;
      salaryRange: string;
      requiredSkills: string[];
      department: string;
      postedDaysAgo: number;
    }): JobMatch => {
      const strong: string[] = [];
      const missing: string[] = [];

      jobData.requiredSkills.forEach((reqSkill) => {
        const matched = findMatchingCandidateSkill(candidateSkills, reqSkill);
        if (matched) {
          strong.push(matched.name);
        } else {
          missing.push(reqSkill);
        }
      });

      const total = jobData.requiredSkills.length;
      const score = Math.round((strong.length / Math.max(1, total)) * 100);

      const explanation = strong.length > 0
        ? `Direct match based on your verified ${strong.slice(0, 3).join(', ')} expertise.` +
          (missing.length > 0 ? ` Adding ${missing[0]} will bring you to 100%.` : '')
        : `Requires foundational skills in ${jobData.requiredSkills.slice(0, 2).join(' & ')}.`;

      return {
        id: jobData.id,
        companyName: jobData.companyName,
        companyLogo: jobData.companyLogo,
        jobTitle: jobData.jobTitle,
        location: jobData.location,
        type: jobData.type,
        salaryRange: jobData.salaryRange,
        matchScore: Math.max(35, score),
        matchedSkillsCount: strong.length,
        totalRequiredSkillsCount: total,
        strongSkills: strong,
        missingSkills: missing,
        matchExplanation: explanation,
        postedDaysAgo: jobData.postedDaysAgo,
        department: jobData.department,
      };
    };

    if (targetRoleLower.includes('robot') || targetRoleLower.includes('autonom') || targetRoleLower.includes('mechatron')) {
      return [
        calculateDynamicJobMatch({
          id: 'job_dom_1',
          companyName: 'GreyOrange Robotics',
          companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120',
          jobTitle: 'Robotics Software Engineer - Autonomous Systems',
          location: 'Bengaluru, India',
          type: 'Full-Time',
          salaryRange: '₹14.0 - ₹24.0 LPA',
          requiredSkills: ['ROS2', 'C++', 'SLAM', 'Gazebo', 'Embedded C'],
          department: 'Robotics R&D',
          postedDaysAgo: 1,
        }),
        calculateDynamicJobMatch({
          id: 'job_dom_2',
          companyName: 'ABB Robotics',
          companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120',
          jobTitle: 'Junior Robotics Engineer - Perception & Control',
          location: 'Bengaluru, India',
          type: 'Full-Time',
          salaryRange: '₹8.0 - ₹15.0 LPA',
          requiredSkills: ['ROS2', 'OpenCV', 'Microcontrollers', 'C++'],
          department: 'Industrial Automation',
          postedDaysAgo: 3,
        }),
        calculateDynamicJobMatch({
          id: 'job_dom_3',
          companyName: 'Tesla Autopilot & Robotics',
          companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
          jobTitle: 'Robotics Engineer - Autonomous Navigation',
          location: 'Remote / Global',
          type: 'Remote',
          salaryRange: '₹18.0 - ₹32.0 LPA',
          requiredSkills: ['ROS2', 'SLAM', 'C++', 'Sensors & Actuators'],
          department: 'Autonomous Vehicles',
          postedDaysAgo: 5,
        }),
        calculateDynamicJobMatch({
          id: 'job_dom_4',
          companyName: 'Qualcomm Robotics Lab',
          companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120',
          jobTitle: 'Embedded Robotics Systems Engineer',
          location: 'Hyderabad, India',
          type: 'Full-Time',
          salaryRange: '₹15.0 - ₹26.0 LPA',
          requiredSkills: ['Embedded C', 'Microcontrollers', 'Linux', 'PCB Design', 'C++'],
          department: 'Edge AI & Robotics',
          postedDaysAgo: 2,
        }),
      ];
    }

    const filtered = this.jobs.filter(
      (j) => j.jobTitle.toLowerCase().includes(targetRoleLower) || targetRoleLower === 'all'
    );
    return filtered.length > 0 ? filtered : this.jobs;
  }

  // --- Career Roadmap ---
  async getCareerRoadmap(role?: string): Promise<RoadmapItem[]> {
    const targetRoleLower = (role || this.profile.targetRole || 'Robotics Engineer').toLowerCase();

    if (targetRoleLower.includes('robot') || targetRoleLower.includes('autonom') || targetRoleLower.includes('mechatron')) {
      return [
        {
          id: 'rm_rob_1',
          stage: 'FOUNDATION',
          stageOrder: 1,
          skillName: 'ROS & ROS2 Architecture',
          currentLevel: 'Intermediate',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 20,
          status: 'In Progress',
          learningObjective: 'Master ROS2 DDS node communications, action servers, and custom message types.',
          recommendedResources: [
            { title: 'ROS2 Navigation & Node Mastery', type: 'Course', estTime: '12 hrs' },
            { title: 'Autonomous Rover Teleoperation Capstone', type: 'Project', estTime: '8 hrs' }
          ]
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
          status: 'In Progress',
          learningObjective: 'Implement Cartographer and Gmapping with Kalman Filter sensor fusion.',
          recommendedResources: [
            { title: 'LiDAR SLAM & Point Cloud Processing', type: 'Course', estTime: '15 hrs' },
            { title: 'Indoor Autonomous Navigation Lab', type: 'Project', estTime: '10 hrs' }
          ]
        },
        {
          id: 'rm_rob_3',
          stage: 'INDUSTRY SKILLS',
          stageOrder: 3,
          skillName: 'Gazebo Simulation & Kinematics',
          currentLevel: 'None',
          targetLevel: 'Advanced',
          priority: 'Medium',
          estimatedHours: 18,
          status: 'In Progress',
          learningObjective: 'Design URDF robotic arm models and execute inverse kinematics trajectories in MoveIt.',
          recommendedResources: [
            { title: 'Robotics Dynamics & MoveIt Trajectory Planning', type: 'Course', estTime: '10 hrs' },
            { title: 'Multi-Axis Robotic Arm Simulator', type: 'Project', estTime: '8 hrs' }
          ]
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
          status: 'In Progress',
          learningObjective: 'Deploy real-time motor controller loops and CAN bus communication on STM32 / FreeRTOS.',
          recommendedResources: [
            { title: 'STM32 FreeRTOS Motor Control Architecture', type: 'Course', estTime: '14 hrs' },
            { title: 'Hardware-in-the-Loop Autonomous Test Rig', type: 'Project', estTime: '8 hrs' }
          ]
        }
      ];
    }

    return new Promise((resolve) => {
      resolve([...this.roadmap]);
    });
  }

  async toggleRoadmapStatus(id: string): Promise<RoadmapItem[]> {
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

    return [...this.roadmap];
  }

  async addSkillToRoadmap(skill: IndustrySkill): Promise<RoadmapItem[]> {
    const newItem: RoadmapItem = {
      id: `rm_${Date.now()}`,
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
    return [...this.roadmap];
  }
}

export const careerService = new CareerService();
