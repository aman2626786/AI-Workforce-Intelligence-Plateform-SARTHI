import { StudentProfile, initialStudentProfile, SkillItem, ProjectItem, CertificationItem, ExperienceItem } from '../data/profile';
import { IndustrySkill, initialSkills } from '../data/skills';
import { IndustryOverview, industryData, CompanySkillCriteria, EmergingSkill } from '../data/industry';
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

  async getIndustryOverview(role: string = 'Data Scientist'): Promise<IndustryOverview> {
    const rLower = (role || this.profile.targetRole || 'Data Scientist').toLowerCase();
    
    let domainCompanies: CompanySkillCriteria[] = [];
    let domainEmerging: EmergingSkill[] = [];

    if (rLower.includes('data') || rLower.includes('analytic') || rLower.includes('statistic') || rLower.includes('bi')) {
      domainCompanies = [
        {
          id: 'cc_ds_1',
          companyName: 'Microsoft India - Data & AI',
          companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
          industryTier: 'Tier 1 Tech',
          activeRole: 'Data Scientist (Machine Learning & NLP)',
          openPositionsCount: 16,
          entryMandatorySkills: ['Python', 'SQL & Query Optimization', 'Machine Learning'],
          preferredAdvancedSkills: ['PyTorch', 'Distributed Spark', 'MLflow / MLOps'],
          hiringStatus: 'Actively Hiring',
          minProficiencyExpected: 'Advanced',
        },
        {
          id: 'cc_ds_2',
          companyName: 'Fractal Analytics',
          companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120',
          industryTier: 'Unicorn',
          activeRole: 'AI & Data Science Specialist',
          openPositionsCount: 22,
          entryMandatorySkills: ['Python & Pandas', 'SQL', 'Business Statistics'],
          preferredAdvancedSkills: ['Power BI & Tableau', 'Deep Learning', 'Tableau'],
          hiringStatus: 'Hiring Peak',
          minProficiencyExpected: 'Intermediate',
        },
        {
          id: 'cc_ds_3',
          companyName: 'Swiggy Intelligence Labs',
          companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120',
          industryTier: 'Unicorn',
          activeRole: 'Lead Data Scientist - Ranking & Recommendations',
          openPositionsCount: 9,
          entryMandatorySkills: ['Python', 'Machine Learning', 'Business Statistics'],
          preferredAdvancedSkills: ['Spark / Kafka', 'Feature Stores', 'Deep Learning'],
          hiringStatus: 'Actively Hiring',
          minProficiencyExpected: 'Advanced',
        },
        {
          id: 'cc_ds_4',
          companyName: 'Walmart Global Tech',
          companyLogo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
          industryTier: 'Tier 1 Tech',
          activeRole: 'Data Scientist - Forecasting & Supply Chain',
          openPositionsCount: 14,
          entryMandatorySkills: ['SQL & Query Optimization', 'Python & Pandas', 'Business Statistics'],
          preferredAdvancedSkills: ['BigQuery / GCP', 'PyTorch', 'Docker'],
          hiringStatus: 'Actively Hiring',
          minProficiencyExpected: 'Intermediate',
        },
      ];

      domainEmerging = [
        {
          id: 'em_ds_1',
          name: 'LLM Fine-Tuning & RAG Pipelines',
          growthRate: '+48% YoY',
          demandPercentage: 92,
          status: 'Rapid Growth',
          whyItMatters: 'Deploying domain-adapted foundation models with vector embeddings and LangChain/LlamaIndex.',
          recommendedAction: 'Build a production document retrieval QA system with hybrid vector search and reranking.',
        },
        {
          id: 'em_ds_2',
          name: 'Feature Stores & MLOps (MLflow / Feast)',
          growthRate: '+42% YoY',
          demandPercentage: 86,
          status: 'Rapid Growth',
          whyItMatters: 'Standardizing machine learning feature engineering, model registry, and automated inference.',
          recommendedAction: 'Set up an automated CI/CD model retraining pipeline with drift monitoring.',
        },
        {
          id: 'em_ds_3',
          name: 'Real-time Streaming Analytics (Spark / Kafka)',
          growthRate: '+31% YoY',
          demandPercentage: 79,
          status: 'Growing',
          whyItMatters: 'Low-latency event stream processing and continuous feature aggregation for online prediction.',
          recommendedAction: 'Implement real-time windowed aggregations with structured streaming.',
        },
      ];
    } else if (rLower.includes('ai') || rLower.includes('machine learning') || rLower.includes('vision') || rLower.includes('nlp')) {
      domainCompanies = [
        {
          id: 'cc_ai_1',
          companyName: 'Anthropic Partner Lab',
          companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120',
          industryTier: 'Unicorn',
          activeRole: 'Applied AI & LLM Engineer',
          openPositionsCount: 14,
          entryMandatorySkills: ['PyTorch', 'Python', 'Generative AI & LLMs'],
          preferredAdvancedSkills: ['CUDA', 'MLOps & Docker', 'Computer Vision / NLP'],
          hiringStatus: 'Actively Hiring',
          minProficiencyExpected: 'Advanced',
        },
        {
          id: 'cc_ai_2',
          companyName: 'NVIDIA AI Research',
          companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
          industryTier: 'Tier 1 Tech',
          activeRole: 'Deep Learning Systems Engineer',
          openPositionsCount: 18,
          entryMandatorySkills: ['PyTorch & Neural Networks', 'Python', 'Computer Vision / NLP'],
          preferredAdvancedSkills: ['CUDA & GPU Acceleration', 'MLOps & Docker', 'Transformers'],
          hiringStatus: 'Hiring Peak',
          minProficiencyExpected: 'Advanced',
        },
      ];
      domainEmerging = [
        {
          id: 'em_ai_1',
          name: 'Multimodal Vision-Language Models',
          growthRate: '+55% YoY',
          demandPercentage: 94,
          status: 'Rapid Growth',
          whyItMatters: 'Joint visual-textual reasoning, CLIP embeddings, and vision transformer fine-tuning.',
          recommendedAction: 'Fine-tune open-weight vision models on custom OCR and spatial reasoning tasks.',
        },
        {
          id: 'em_ai_2',
          name: 'CUDA Kernel Optimization & TensorRT',
          growthRate: '+46% YoY',
          demandPercentage: 88,
          status: 'Rapid Growth',
          whyItMatters: 'High-throughput low-latency model inference on enterprise GPU clusters.',
          recommendedAction: 'Quantize transformer checkpoints into FP8/INT4 using TensorRT-LLM.',
        },
      ];
    } else if (rLower.includes('full') || rLower.includes('software') || rLower.includes('backend') || rLower.includes('frontend')) {
      domainCompanies = [
        {
          id: 'cc_swe_1',
          companyName: 'Razorpay Tech',
          companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120',
          industryTier: 'Unicorn',
          activeRole: 'Full Stack Software Engineer - Fintech Core',
          openPositionsCount: 20,
          entryMandatorySkills: ['TypeScript & JavaScript', 'React / Next.js', 'Node.js & FastAPI / Backend'],
          preferredAdvancedSkills: ['SQL & Database Architecture', 'Docker & CI/CD', 'Kafka'],
          hiringStatus: 'Actively Hiring',
          minProficiencyExpected: 'Advanced',
        },
        {
          id: 'cc_swe_2',
          companyName: 'Google India',
          companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
          industryTier: 'Tier 1 Tech',
          activeRole: 'Software Development Engineer (SDE II)',
          openPositionsCount: 35,
          entryMandatorySkills: ['TypeScript & JavaScript', 'SQL & Database Architecture', 'Node.js & FastAPI / Backend'],
          preferredAdvancedSkills: ['Docker & CI/CD', 'React / Next.js', 'System Design'],
          hiringStatus: 'Hiring Peak',
          minProficiencyExpected: 'Advanced',
        },
      ];
      domainEmerging = [
        {
          id: 'em_swe_1',
          name: 'Next.js 15 Full Stack Server Actions',
          growthRate: '+44% YoY',
          demandPercentage: 91,
          status: 'Rapid Growth',
          whyItMatters: 'Full stack streaming SSR with edge rendering, server components, and secure server actions.',
          recommendedAction: 'Build zero-API-layer database actions with optimistic UI and React 19 hooks.',
        },
        {
          id: 'em_swe_2',
          name: 'High-Throughput Distributed Kafka Streams',
          growthRate: '+36% YoY',
          demandPercentage: 83,
          status: 'Growing',
          whyItMatters: 'Event-driven async microservices with idempotent handlers and exactly-once message delivery.',
          recommendedAction: 'Implement partitioned message pub/sub handling with dead-letter queue recovery.',
        },
      ];
    } else if (rLower.includes('cyber') || rLower.includes('security') || rLower.includes('cloud') || rLower.includes('devops')) {
      domainCompanies = [
        {
          id: 'cc_cyb_1',
          companyName: 'CrowdStrike',
          companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120',
          industryTier: 'Tier 1 Tech',
          activeRole: 'Cybersecurity Engineer (Threat Hunting & SOC)',
          openPositionsCount: 12,
          entryMandatorySkills: ['Network Security & Firewalls', 'SIEM & SOC Operations', 'OWASP & Web Security'],
          preferredAdvancedSkills: ['Cryptography & Identity', 'Threat Hunting', 'Splunk'],
          hiringStatus: 'Actively Hiring',
          minProficiencyExpected: 'Advanced',
        },
      ];
      domainEmerging = [
        {
          id: 'em_cyb_1',
          name: 'Zero Trust & Cloud Security Posture (CSPM)',
          growthRate: '+50% YoY',
          demandPercentage: 95,
          status: 'Rapid Growth',
          whyItMatters: 'Automated policy enforcement, identity boundary governance, and multi-cloud asset defense.',
          recommendedAction: 'Design identity-aware proxy and automated compliance rule remediation.',
        },
      ];
    } else {
      // Robotics & Embedded Systems
      domainCompanies = [
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
          entryMandatorySkills: ['ROS2', 'Kinematics & Dynamics', 'OpenCV'],
          preferredAdvancedSkills: ['SLAM & Perception', 'Embedded C & RTOS'],
          hiringStatus: 'Hiring Peak',
          minProficiencyExpected: 'Intermediate',
        },
      ];
      domainEmerging = [
        {
          id: 'em_rob_1',
          name: 'ROS2 DDS & Nav2 Stack',
          growthRate: '+45% YoY',
          demandPercentage: 93,
          status: 'Rapid Growth',
          whyItMatters: 'Industry-standard distributed robotics communication and autonomous navigation stack.',
          recommendedAction: 'Build navigation costmaps and custom BT recovery behaviors for AMR chassis.',
        },
        {
          id: 'em_rob_2',
          name: 'Visual SLAM & LiDAR Fusion',
          growthRate: '+38% YoY',
          demandPercentage: 87,
          status: 'Rapid Growth',
          whyItMatters: 'Essential for mobile robots operating in GPS-denied indoor warehouse and industrial environments.',
          recommendedAction: 'Integrate real-time point cloud registration with extended Kalman filtering.',
        },
      ];
    }

    return {
      targetRole: role || this.profile.targetRole || 'Data Scientist',
      totalJobSignals: 1840,
      lastUpdated: 'Live Feed Today',
      timeframe: 'Last 6 Months',
      location: 'Pan India (Bengaluru, Pune, Hyderabad, Remote)',
      trendData: this.industryInfo.trendData,
      emergingSkills: domainEmerging,
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

    const domainSkills = this.generateDomainSkills(this.profile.targetRole || 'Data Scientist');
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
  async getJobMatches(role: string = 'Data Scientist'): Promise<JobMatch[]> {
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

    // Dynamic role-filtered fallback with TRUE candidate-to-job matching and Full Tiered JD Skills
    const targetRoleLower = (role || this.profile.targetRole || 'Data Scientist').toLowerCase();
    const candidateSkills = this.profile.skills || [];

    const calculateDynamicJobMatch = (jobData: {
      id: string;
      companyName: string;
      companyLogo: string;
      jobTitle: string;
      location: string;
      type: string;
      salaryRange: string;
      department: string;
      postedDaysAgo: number;
      applyUrl: string;
      rawSkills: Array<{ name: string; category: string; demandProbability: number; tier: 'Core' | 'Secondary' | 'Specialized' }>;
    }): JobMatch => {
      const strong: string[] = [];
      const missing: string[] = [];
      const enrichedJdSkills = jobData.rawSkills.map((sk) => {
        const matched = findMatchingCandidateSkill(candidateSkills, sk.name);
        const isMatched = !!matched;
        if (isMatched) {
          strong.push(matched.name);
        } else {
          missing.push(sk.name);
        }
        return {
          ...sk,
          isMatched,
        };
      });

      // Core and secondary skills define the primary match index
      const coreAndSecondary = enrichedJdSkills.filter((s) => s.tier === 'Core' || s.tier === 'Secondary');
      const coreMatchedCount = enrichedJdSkills.filter((s) => s.tier === 'Core' && s.isMatched).length;
      const secMatchedCount = enrichedJdSkills.filter((s) => s.tier === 'Secondary' && s.isMatched).length;
      const totalCoreSec = Math.max(1, coreAndSecondary.length);

      const score = Math.round(((coreMatchedCount * 1.5 + secMatchedCount) / (7 * 1.5 + (totalCoreSec - 7))) * 100);

      const topStrong = strong.slice(0, 4);
      const topMissing = missing.slice(0, 2);

      const explanation = strong.length > 0
        ? `Direct match for ${topStrong.join(', ')}. Mastering ${topMissing.join(' & ')} will complete your 100% profile fit.`
        : `Foundational role requiring core proficiency in ${enrichedJdSkills.slice(0, 3).map((s) => s.name).join(', ')}.`;

      return {
        id: jobData.id,
        companyName: jobData.companyName,
        companyLogo: jobData.companyLogo,
        jobTitle: jobData.jobTitle,
        location: jobData.location,
        type: jobData.type,
        salaryRange: jobData.salaryRange,
        matchScore: Math.min(98, Math.max(30, score)),
        matchedSkillsCount: strong.length,
        totalRequiredSkillsCount: enrichedJdSkills.length,
        strongSkills: topStrong,
        missingSkills: topMissing,
        matchExplanation: explanation,
        postedDaysAgo: jobData.postedDaysAgo,
        department: jobData.department,
        applyUrl: jobData.applyUrl,
        jdSkills: enrichedJdSkills,
      };
    };

    // DATA SCIENCE & ANALYTICS DOMAIN
    if (targetRoleLower.includes('data') || targetRoleLower.includes('analytic') || targetRoleLower.includes('statistic') || targetRoleLower.includes('bi')) {
      return [
        calculateDynamicJobMatch({
          id: 'job_ds_1',
          companyName: 'Microsoft India',
          companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
          jobTitle: 'Data Scientist - Machine Learning & Analytics',
          location: 'Bengaluru, India',
          type: 'Full-Time',
          salaryRange: '₹22.0 - ₹38.0 LPA',
          department: 'Data & AI Cloud Group',
          postedDaysAgo: 1,
          applyUrl: 'https://careers.microsoft.com/',
          rawSkills: [
            // Top 7 Core Mandates (88% - 98%)
            { name: 'Python', category: 'Programming', demandProbability: 98, tier: 'Core' },
            { name: 'SQL & Query Optimization', category: 'Database', demandProbability: 96, tier: 'Core' },
            { name: 'Machine Learning', category: 'Predictive Modeling', demandProbability: 94, tier: 'Core' },
            { name: 'Business Statistics', category: 'Analytics', demandProbability: 92, tier: 'Core' },
            { name: 'Git / GitHub', category: 'Tools', demandProbability: 90, tier: 'Core' },
            { name: 'Excel', category: 'Data Analysis', demandProbability: 89, tier: 'Core' },
            { name: 'Data Structures & Algorithms', category: 'Computer Science', demandProbability: 88, tier: 'Core' },

            // Skills 8 to 20 High-Demand Secondary (60% - 84%)
            { name: 'Power BI & Tableau', category: 'Visualization', demandProbability: 84, tier: 'Secondary' },
            { name: 'Python & Pandas', category: 'Data Wrangling', demandProbability: 82, tier: 'Secondary' },
            { name: 'PyTorch & Neural Networks', category: 'Deep Learning', demandProbability: 79, tier: 'Secondary' },
            { name: 'Scikit-Learn', category: 'ML Algorithms', demandProbability: 77, tier: 'Secondary' },
            { name: 'A/B Testing & Experimentation', category: 'Statistics', demandProbability: 75, tier: 'Secondary' },
            { name: 'Feature Engineering', category: 'Data Preparation', demandProbability: 73, tier: 'Secondary' },
            { name: 'Docker', category: 'Deployment', demandProbability: 70, tier: 'Secondary' },
            { name: 'Distributed Spark & BigQuery', category: 'Big Data', demandProbability: 68, tier: 'Secondary' },
            { name: 'MLOps & Model Registry (MLflow)', category: 'MLOps', demandProbability: 66, tier: 'Secondary' },
            { name: 'Problem Solving', category: 'Analytical', demandProbability: 65, tier: 'Secondary' },
            { name: 'Communication Skills', category: 'Stakeholder Management', demandProbability: 64, tier: 'Secondary' },
            { name: 'Time Series Forecasting', category: 'Econometrics', demandProbability: 62, tier: 'Secondary' },
            { name: 'CI/CD Pipelines', category: 'DevOps', demandProbability: 60, tier: 'Secondary' },

            // Specialized & Emerging Competencies (35% - 58%)
            { name: 'Generative AI & LLMs', category: 'Emerging AI', demandProbability: 56, tier: 'Specialized' },
            { name: 'Vector Databases (Pinecone/Milvus)', category: 'RAG Architecture', demandProbability: 50, tier: 'Specialized' },
            { name: 'Kubeflow & Cloud ML Endpoints', category: 'Cloud Infrastructure', demandProbability: 42, tier: 'Specialized' },
          ],
        }),
        calculateDynamicJobMatch({
          id: 'job_ds_2',
          companyName: 'Fractal Analytics',
          companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120',
          jobTitle: 'AI & Data Science Consultant',
          location: 'Mumbai / Bengaluru',
          type: 'Full-Time',
          salaryRange: '₹14.0 - ₹25.0 LPA',
          department: 'Enterprise AI Strategy',
          postedDaysAgo: 2,
          applyUrl: 'https://fractal.ai/careers/',
          rawSkills: [
            // Top 7 Core Mandates
            { name: 'Python', category: 'Programming', demandProbability: 97, tier: 'Core' },
            { name: 'SQL & Query Optimization', category: 'Database', demandProbability: 95, tier: 'Core' },
            { name: 'Excel', category: 'Data Analysis', demandProbability: 93, tier: 'Core' },
            { name: 'Business Statistics', category: 'Mathematical Modeling', demandProbability: 91, tier: 'Core' },
            { name: 'Power BI & Tableau', category: 'Executive Dashboards', demandProbability: 90, tier: 'Core' },
            { name: 'Machine Learning', category: 'Algorithms', demandProbability: 89, tier: 'Core' },
            { name: 'Communication Skills', category: 'Client Consulting', demandProbability: 88, tier: 'Core' },

            // Skills 8 to 20 High-Demand Secondary
            { name: 'Python & Pandas', category: 'Data Wrangling', demandProbability: 84, tier: 'Secondary' },
            { name: 'Git / GitHub', category: 'Source Control', demandProbability: 81, tier: 'Secondary' },
            { name: 'Predictive Analytics & Regression', category: 'Statistics', demandProbability: 78, tier: 'Secondary' },
            { name: 'Problem Solving', category: 'Business Logic', demandProbability: 76, tier: 'Secondary' },
            { name: 'Hypothesis Testing', category: 'Inference', demandProbability: 74, tier: 'Secondary' },
            { name: 'Data Visualization & Storytelling', category: 'Reporting', demandProbability: 72, tier: 'Secondary' },
            { name: 'Scikit-Learn', category: 'ML Models', demandProbability: 70, tier: 'Secondary' },
            { name: 'PyTorch & Neural Networks', category: 'Deep Learning', demandProbability: 68, tier: 'Secondary' },
            { name: 'Cloud Data Warehouses (Snowflake)', category: 'Data Systems', demandProbability: 66, tier: 'Secondary' },
            { name: 'Docker', category: 'Containerization', demandProbability: 64, tier: 'Secondary' },
            { name: 'A/B Testing', category: 'Experimentation', demandProbability: 63, tier: 'Secondary' },
            { name: 'Generative AI & LLMs', category: 'Prompt Engineering', demandProbability: 61, tier: 'Secondary' },
            { name: 'PowerPoint & Presentation', category: 'Reporting', demandProbability: 60, tier: 'Secondary' },

            // Specialized
            { name: 'RAG & Vector Search', category: 'Enterprise Search', demandProbability: 54, tier: 'Specialized' },
            { name: 'Automated ML (AutoML)', category: 'Modeling Tools', demandProbability: 45, tier: 'Specialized' },
          ],
        }),
        calculateDynamicJobMatch({
          id: 'job_ds_3',
          companyName: 'Swiggy Intelligence Labs',
          companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120',
          jobTitle: 'Data Scientist - Recommendations & Search',
          location: 'Bengaluru, India',
          type: 'Full-Time',
          salaryRange: '₹20.0 - ₹34.0 LPA',
          department: 'Consumer Intelligence',
          postedDaysAgo: 3,
          applyUrl: 'https://careers.swiggy.com/',
          rawSkills: [
            // Top 7 Core Mandates
            { name: 'Python', category: 'Programming', demandProbability: 99, tier: 'Core' },
            { name: 'Machine Learning', category: 'Recommender Systems', demandProbability: 96, tier: 'Core' },
            { name: 'SQL & Query Optimization', category: 'Data Retrieval', demandProbability: 95, tier: 'Core' },
            { name: 'Business Statistics', category: 'A/B Testing', demandProbability: 93, tier: 'Core' },
            { name: 'Git / GitHub', category: 'Version Control', demandProbability: 91, tier: 'Core' },
            { name: 'Python & Pandas', category: 'Data Analysis', demandProbability: 90, tier: 'Core' },
            { name: 'Data Structures & Algorithms', category: 'Computer Science', demandProbability: 88, tier: 'Core' },

            // Skills 8 to 20 High-Demand Secondary
            { name: 'PyTorch & Neural Networks', category: 'Deep Learning', demandProbability: 84, tier: 'Secondary' },
            { name: 'Distributed Spark', category: 'Big Data Processing', demandProbability: 81, tier: 'Secondary' },
            { name: 'Ranking Algorithms (XGBoost/LightGBM)', category: 'Gradient Boosting', demandProbability: 79, tier: 'Secondary' },
            { name: 'Feature Stores (Feast)', category: 'ML Systems', demandProbability: 76, tier: 'Secondary' },
            { name: 'Docker', category: 'Deployment', demandProbability: 74, tier: 'Secondary' },
            { name: 'Power BI & Tableau', category: 'Analytics Dashboards', demandProbability: 72, tier: 'Secondary' },
            { name: 'Excel', category: 'Quick Analysis', demandProbability: 70, tier: 'Secondary' },
            { name: 'Problem Solving', category: 'Algorithmic', demandProbability: 68, tier: 'Secondary' },
            { name: 'A/B Testing & Metric Evaluation', category: 'Experimentation', demandProbability: 66, tier: 'Secondary' },
            { name: 'MLOps & Inference Serving', category: 'Production ML', demandProbability: 64, tier: 'Secondary' },
            { name: 'Kafka Real-Time Streams', category: 'Data Pipelines', demandProbability: 62, tier: 'Secondary' },
            { name: 'Communication Skills', category: 'Cross-Functional', demandProbability: 61, tier: 'Secondary' },
            { name: 'Generative AI & LLMs', category: 'Search Personalization', demandProbability: 60, tier: 'Secondary' },

            // Specialized
            { name: 'Graph Neural Networks', category: 'Location Graphs', demandProbability: 52, tier: 'Specialized' },
            { name: 'Reinforcement Learning', category: 'Dynamic Pricing', demandProbability: 44, tier: 'Specialized' },
          ],
        }),
        calculateDynamicJobMatch({
          id: 'job_ds_4',
          companyName: 'Walmart Global Tech',
          companyLogo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
          jobTitle: 'Associate Data Scientist - Inventory & Supply Chain',
          location: 'Bengaluru, India',
          type: 'Full-Time',
          salaryRange: '₹16.0 - ₹28.0 LPA',
          department: 'Global Supply Chain Analytics',
          postedDaysAgo: 4,
          applyUrl: 'https://careers.walmart.com/',
          rawSkills: [
            // Top 7 Core Mandates
            { name: 'SQL & Query Optimization', category: 'Relational Analytics', demandProbability: 98, tier: 'Core' },
            { name: 'Python', category: 'Programming', demandProbability: 96, tier: 'Core' },
            { name: 'Excel', category: 'Spreadsheet Modeling', demandProbability: 94, tier: 'Core' },
            { name: 'Business Statistics', category: 'Statistical Analysis', demandProbability: 92, tier: 'Core' },
            { name: 'Machine Learning', category: 'Predictive Modeling', demandProbability: 90, tier: 'Core' },
            { name: 'Git / GitHub', category: 'Source Control', demandProbability: 89, tier: 'Core' },
            { name: 'Power BI & Tableau', category: 'Executive BI', demandProbability: 88, tier: 'Core' },

            // Skills 8 to 20 High-Demand Secondary
            { name: 'Time Series & Demand Forecasting', category: 'Econometrics', demandProbability: 84, tier: 'Secondary' },
            { name: 'Python & Pandas', category: 'Feature Engineering', demandProbability: 81, tier: 'Secondary' },
            { name: 'BigQuery & Cloud Data Lakes', category: 'GCP Analytics', demandProbability: 78, tier: 'Secondary' },
            { name: 'Problem Solving', category: 'Operations Research', demandProbability: 76, tier: 'Secondary' },
            { name: 'Scikit-Learn', category: 'Classification/Regression', demandProbability: 74, tier: 'Secondary' },
            { name: 'Communication Skills', category: 'Stakeholder Presentations', demandProbability: 72, tier: 'Secondary' },
            { name: 'Docker', category: 'Containerization', demandProbability: 70, tier: 'Secondary' },
            { name: 'A/B Testing', category: 'Experimentation', demandProbability: 68, tier: 'Secondary' },
            { name: 'PyTorch & Neural Networks', category: 'Deep Learning', demandProbability: 65, tier: 'Secondary' },
            { name: 'CI/CD Automation Pipelines', category: 'DevOps', demandProbability: 63, tier: 'Secondary' },
            { name: 'Automated Reporting Scripts', category: 'ETL Jobs', demandProbability: 62, tier: 'Secondary' },
            { name: 'Generative AI & LLMs', category: 'Data Summarization', demandProbability: 61, tier: 'Secondary' },
            { name: 'PowerPoint', category: 'Reporting', demandProbability: 60, tier: 'Secondary' },

            // Specialized
            { name: 'Linear Programming & Optimization (PuLP)', category: 'Operations Research', demandProbability: 51, tier: 'Specialized' },
            { name: 'Simulation Modeling', category: 'Supply Chain Sim', demandProbability: 43, tier: 'Specialized' },
          ],
        }),
      ];
    }

    // AI & MACHINE LEARNING DOMAIN
    if (targetRoleLower.includes('ai') || targetRoleLower.includes('machine learning') || targetRoleLower.includes('vision') || targetRoleLower.includes('nlp')) {
      return [
        calculateDynamicJobMatch({
          id: 'job_ai_1',
          companyName: 'Anthropic Partner Lab',
          companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120',
          jobTitle: 'Applied AI & LLM Systems Engineer',
          location: 'Bengaluru / Remote',
          type: 'Full-Time',
          salaryRange: '₹24.0 - ₹45.0 LPA',
          department: 'Generative AI Research',
          postedDaysAgo: 1,
          applyUrl: 'https://www.google.com/search?q=Anthropic+Applied+AI+Engineer+Careers',
          rawSkills: [
            { name: 'Python', category: 'Programming', demandProbability: 99, tier: 'Core' },
            { name: 'PyTorch & Neural Networks', category: 'Deep Learning', demandProbability: 97, tier: 'Core' },
            { name: 'Generative AI & LLMs', category: 'Foundation Models', demandProbability: 96, tier: 'Core' },
            { name: 'Transformers & RAG', category: 'NLP Architecture', demandProbability: 94, tier: 'Core' },
            { name: 'Git / GitHub', category: 'Version Control', demandProbability: 91, tier: 'Core' },
            { name: 'Linux', category: 'Operating Systems', demandProbability: 90, tier: 'Core' },
            { name: 'Data Structures & Algorithms', category: 'Computer Science', demandProbability: 88, tier: 'Core' },

            { name: 'MLOps & Docker', category: 'Containerized Inference', demandProbability: 84, tier: 'Secondary' },
            { name: 'Computer Vision / NLP', category: 'Applied AI', demandProbability: 82, tier: 'Secondary' },
            { name: 'Vector Databases (Pinecone/Chroma)', category: 'Embeddings', demandProbability: 80, tier: 'Secondary' },
            { name: 'FastAPI Backend Endpoints', category: 'Serving', demandProbability: 77, tier: 'Secondary' },
            { name: 'Fine-Tuning (LoRA / QLoRA)', category: 'Model Training', demandProbability: 75, tier: 'Secondary' },
            { name: 'Problem Solving', category: 'Algorithms', demandProbability: 73, tier: 'Secondary' },
            { name: 'CUDA & GPU Acceleration', category: 'Hardware Acceleration', demandProbability: 71, tier: 'Secondary' },
            { name: 'Evaluation Frameworks (Ragas)', category: 'Benchmarking', demandProbability: 68, tier: 'Secondary' },
            { name: 'Communication Skills', category: 'Collaboration', demandProbability: 65, tier: 'Secondary' },
            { name: 'SQL & Database Architecture', category: 'Databases', demandProbability: 63, tier: 'Secondary' },
            { name: 'CI/CD Automation Pipelines', category: 'DevOps', demandProbability: 62, tier: 'Secondary' },
            { name: 'Prompt Engineering & Guardrails', category: 'Safety', demandProbability: 61, tier: 'Secondary' },
            { name: 'Model Quantization (GGUF/AWQ)', category: 'Optimization', demandProbability: 60, tier: 'Secondary' },

            { name: 'Agentic Workflows (LangGraph)', category: 'Multi-Agent', demandProbability: 55, tier: 'Specialized' },
            { name: 'Distributed DeepSpeed / FSDP', category: 'Cluster Training', demandProbability: 48, tier: 'Specialized' },
          ],
        }),
      ];
    }

    // SOFTWARE & FULL STACK DOMAIN
    if (targetRoleLower.includes('full') || targetRoleLower.includes('software') || targetRoleLower.includes('backend') || targetRoleLower.includes('frontend')) {
      return [
        calculateDynamicJobMatch({
          id: 'job_swe_1',
          companyName: 'Razorpay',
          companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120',
          jobTitle: 'Full Stack Software Engineer - Core Platform',
          location: 'Bengaluru, India',
          type: 'Full-Time',
          salaryRange: '₹18.0 - ₹32.0 LPA',
          department: 'Payments & Merchant Tech',
          postedDaysAgo: 1,
          applyUrl: 'https://razorpay.com/jobs/',
          rawSkills: [
            { name: 'TypeScript & JavaScript', category: 'Programming', demandProbability: 98, tier: 'Core' },
            { name: 'React / Next.js', category: 'Frontend Architecture', demandProbability: 96, tier: 'Core' },
            { name: 'Node.js & FastAPI / Backend', category: 'Backend Systems', demandProbability: 95, tier: 'Core' },
            { name: 'SQL & Database Architecture', category: 'Databases', demandProbability: 93, tier: 'Core' },
            { name: 'Git / GitHub', category: 'Version Control', demandProbability: 91, tier: 'Core' },
            { name: 'HTML/CSS', category: 'Web Standards', demandProbability: 90, tier: 'Core' },
            { name: 'Data Structures & Algorithms', category: 'Computer Science', demandProbability: 88, tier: 'Core' },

            { name: 'Docker & CI/CD', category: 'DevOps', demandProbability: 84, tier: 'Secondary' },
            { name: 'REST & GraphQL API Design', category: 'Web Protocols', demandProbability: 82, tier: 'Secondary' },
            { name: 'Redis Caching & Session Stores', category: 'Performance', demandProbability: 79, tier: 'Secondary' },
            { name: 'PostgreSQL Query Optimization', category: 'Data Modeling', demandProbability: 77, tier: 'Secondary' },
            { name: 'Linux', category: 'Server Administration', demandProbability: 75, tier: 'Secondary' },
            { name: 'State Management (Redux/Zustand)', category: 'Frontend', demandProbability: 73, tier: 'Secondary' },
            { name: 'Problem Solving', category: 'Engineering Logic', demandProbability: 71, tier: 'Secondary' },
            { name: 'Unit & Integration Testing (Jest/Playwright)', category: 'QA', demandProbability: 69, tier: 'Secondary' },
            { name: 'Microservices Communication', category: 'Distributed', demandProbability: 67, tier: 'Secondary' },
            { name: 'Communication Skills', category: 'Team Agility', demandProbability: 65, tier: 'Secondary' },
            { name: 'Cloud Deployments (AWS/GCP)', category: 'Cloud', demandProbability: 63, tier: 'Secondary' },
            { name: 'Security & JWT Authentication', category: 'AppSec', demandProbability: 62, tier: 'Secondary' },
            { name: 'Tailwind CSS', category: 'Styling', demandProbability: 60, tier: 'Secondary' },

            { name: 'Kafka Event Streaming', category: 'High-Throughput', demandProbability: 54, tier: 'Specialized' },
            { name: 'Kubernetes Cluster Orchestration', category: 'Infra', demandProbability: 46, tier: 'Specialized' },
          ],
        }),
      ];
    }

    // ROBOTICS & HARDWARE DOMAIN (DEFAULT)
    return [
      calculateDynamicJobMatch({
        id: 'job_dom_1',
        companyName: 'GreyOrange Robotics',
        companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120',
        jobTitle: 'Robotics Software Engineer - Autonomous Systems',
        location: 'Bengaluru, India',
        type: 'Full-Time',
        salaryRange: '₹14.0 - ₹24.0 LPA',
        department: 'Robotics R&D',
        postedDaysAgo: 1,
        applyUrl: 'https://careers.greyorange.com/',
        rawSkills: [
          { name: 'ROS / ROS2', category: 'Robotics Middleware', demandProbability: 98, tier: 'Core' },
          { name: 'C++', category: 'Systems Programming', demandProbability: 95, tier: 'Core' },
          { name: 'Linux', category: 'Operating Systems', demandProbability: 94, tier: 'Core' },
          { name: 'Python', category: 'Programming', demandProbability: 92, tier: 'Core' },
          { name: 'Gazebo', category: 'Robotics Simulation', demandProbability: 90, tier: 'Core' },
          { name: 'Embedded C', category: 'Real-Time Systems', demandProbability: 89, tier: 'Core' },
          { name: 'Git / GitHub', category: 'Tools & DevOps', demandProbability: 88, tier: 'Core' },

          { name: 'SLAM & Perception', category: 'Autonomous Navigation', demandProbability: 84, tier: 'Secondary' },
          { name: 'OpenCV', category: 'Computer Vision', demandProbability: 81, tier: 'Secondary' },
          { name: 'Microcontrollers', category: 'Hardware Interfacing', demandProbability: 78, tier: 'Secondary' },
          { name: 'Sensors & Actuators', category: 'Hardware Telemetry', demandProbability: 76, tier: 'Secondary' },
          { name: 'Kinematics & Dynamics', category: 'Robotics Mechanics', demandProbability: 74, tier: 'Secondary' },
          { name: 'PID Control & State Estimation', category: 'Control Systems', demandProbability: 72, tier: 'Secondary' },
          { name: 'Docker', category: 'Deployment', demandProbability: 70, tier: 'Secondary' },
          { name: 'CAN Bus & Hardware Telemetry', category: 'Protocols', demandProbability: 68, tier: 'Secondary' },
          { name: 'RTOS Task Scheduling', category: 'Real-Time OS', demandProbability: 66, tier: 'Secondary' },
          { name: 'Problem Solving', category: 'Core Engineering', demandProbability: 65, tier: 'Secondary' },
          { name: 'PCB Design', category: 'Electronics', demandProbability: 63, tier: 'Secondary' },
          { name: 'CI/CD Automation Pipelines', category: 'DevOps', demandProbability: 62, tier: 'Secondary' },
          { name: 'Communication Skills', category: 'Collaboration', demandProbability: 60, tier: 'Secondary' },

          { name: 'CUDA & GPU Acceleration', category: 'Edge AI Computing', demandProbability: 56, tier: 'Specialized' },
          { name: 'Point Cloud Library (PCL)', category: '3D Spatial Mapping', demandProbability: 51, tier: 'Specialized' },
          { name: 'Safety Standards (ISO 26262)', category: 'Industrial Compliance', demandProbability: 44, tier: 'Specialized' },
          { name: 'MoveIt Motion Planning', category: 'Manipulator Control', demandProbability: 40, tier: 'Specialized' },
        ],
      }),
      calculateDynamicJobMatch({
        id: 'job_dom_2',
        companyName: 'ABB Robotics',
        companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120',
        jobTitle: 'Junior Robotics Engineer - Perception & Control',
        location: 'Bengaluru, India',
        type: 'Full-Time',
        salaryRange: '₹8.0 - ₹15.0 LPA',
        department: 'Industrial Automation',
        postedDaysAgo: 3,
        applyUrl: 'https://careers.abb/global/en',
        rawSkills: [
          { name: 'ROS / ROS2', category: 'Robotics Middleware', demandProbability: 96, tier: 'Core' },
          { name: 'C++', category: 'Systems Programming', demandProbability: 94, tier: 'Core' },
          { name: 'OpenCV', category: 'Computer Vision', demandProbability: 91, tier: 'Core' },
          { name: 'Microcontrollers', category: 'Hardware Interfacing', demandProbability: 89, tier: 'Core' },
          { name: 'Embedded C', category: 'Embedded Systems', demandProbability: 88, tier: 'Core' },
          { name: 'Python', category: 'Programming', demandProbability: 87, tier: 'Core' },
          { name: 'Linux', category: 'Operating Systems', demandProbability: 86, tier: 'Core' },

          { name: 'Gazebo', category: 'Robotics Simulation', demandProbability: 83, tier: 'Secondary' },
          { name: 'Sensors & Actuators', category: 'Hardware Telemetry', demandProbability: 80, tier: 'Secondary' },
          { name: 'Kinematics & Dynamics', category: 'Manipulation', demandProbability: 77, tier: 'Secondary' },
          { name: 'Git / GitHub', category: 'Tools', demandProbability: 75, tier: 'Secondary' },
          { name: 'SLAM & Perception', category: 'Navigation', demandProbability: 73, tier: 'Secondary' },
          { name: 'CAN Bus & Hardware Telemetry', category: 'Protocols', demandProbability: 70, tier: 'Secondary' },
          { name: 'PID Control & State Estimation', category: 'Control Systems', demandProbability: 68, tier: 'Secondary' },
          { name: 'PCB Design', category: 'Electronics', demandProbability: 65, tier: 'Secondary' },
          { name: 'Docker', category: 'DevOps', demandProbability: 64, tier: 'Secondary' },
          { name: 'Problem Solving', category: 'Analytical', demandProbability: 63, tier: 'Secondary' },
          { name: 'Communication Skills', category: 'Collaboration', demandProbability: 62, tier: 'Secondary' },
          { name: 'Serial UART/SPI/I2C', category: 'Bus Protocols', demandProbability: 61, tier: 'Secondary' },
          { name: 'Kalman Filtering', category: 'State Estimation', demandProbability: 60, tier: 'Secondary' },

          { name: 'CUDA & GPU Acceleration', category: 'Edge AI', demandProbability: 52, tier: 'Specialized' },
          { name: 'Industrial Robot Safety (ISO 10218)', category: 'Safety Standards', demandProbability: 46, tier: 'Specialized' },
        ],
      }),
      calculateDynamicJobMatch({
        id: 'job_dom_3',
        companyName: 'Tesla Autopilot & Robotics',
        companyLogo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120',
        jobTitle: 'Robotics Engineer - Autonomous Navigation',
        location: 'Remote / Global',
        type: 'Remote',
        salaryRange: '₹18.0 - ₹32.0 LPA',
        department: 'Autonomous Vehicles',
        postedDaysAgo: 5,
        applyUrl: 'https://www.tesla.com/careers/search/?query=Robotics',
        rawSkills: [
          { name: 'C++', category: 'Modern C++ (17/20)', demandProbability: 99, tier: 'Core' },
          { name: 'ROS / ROS2', category: 'Robotics Middleware', demandProbability: 97, tier: 'Core' },
          { name: 'SLAM & Perception', category: 'Autonomous Navigation', demandProbability: 95, tier: 'Core' },
          { name: 'Python', category: 'Algorithms', demandProbability: 93, tier: 'Core' },
          { name: 'Linux', category: 'Operating Systems', demandProbability: 92, tier: 'Core' },
          { name: 'Sensors & Actuators', category: 'LiDAR & Camera Suite', demandProbability: 90, tier: 'Core' },
          { name: 'Git / GitHub', category: 'Version Control', demandProbability: 88, tier: 'Core' },

          { name: 'OpenCV', category: 'Computer Vision', demandProbability: 84, tier: 'Secondary' },
          { name: 'Gazebo', category: 'Physics Simulation', demandProbability: 82, tier: 'Secondary' },
          { name: 'CUDA & GPU Acceleration', category: 'High-Performance Edge AI', demandProbability: 80, tier: 'Secondary' },
          { name: 'Embedded C', category: 'Firmware', demandProbability: 77, tier: 'Secondary' },
          { name: 'Microcontrollers', category: 'ARM Cortex', demandProbability: 75, tier: 'Secondary' },
          { name: 'Kinematics & Dynamics', category: 'Trajectory Planning', demandProbability: 73, tier: 'Secondary' },
          { name: 'Docker', category: 'Containerization', demandProbability: 70, tier: 'Secondary' },
          { name: 'CAN Bus & Hardware Telemetry', category: 'Automotive Bus', demandProbability: 68, tier: 'Secondary' },
          { name: 'PID Control & State Estimation', category: 'Kalman Filters', demandProbability: 66, tier: 'Secondary' },
          { name: 'Problem Solving', category: 'Algorithms', demandProbability: 65, tier: 'Secondary' },
          { name: 'Communication Skills', category: 'Team Leadership', demandProbability: 63, tier: 'Secondary' },
          { name: 'Point Cloud Library (PCL)', category: 'LiDAR Processing', demandProbability: 62, tier: 'Secondary' },
          { name: 'CI/CD Automation Pipelines', category: 'Continuous Testing', demandProbability: 60, tier: 'Secondary' },

          { name: 'Deep Learning Perception', category: 'Neural Networks', demandProbability: 55, tier: 'Specialized' },
          { name: 'Safety Standards (ISO 26262)', category: 'Functional Safety (ASIL-D)', demandProbability: 48, tier: 'Specialized' },
        ],
      }),
      calculateDynamicJobMatch({
        id: 'job_dom_4',
        companyName: 'Qualcomm Robotics Lab',
        companyLogo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=120',
        jobTitle: 'Embedded Robotics Systems Engineer',
        location: 'Hyderabad, India',
        type: 'Full-Time',
        salaryRange: '₹15.0 - ₹26.0 LPA',
        department: 'Edge AI & Robotics',
        postedDaysAgo: 2,
        applyUrl: 'https://qualcomm.wd5.myworkdayjobs.com/External?q=Robotics',
        rawSkills: [
          { name: 'Embedded C', category: 'Bare-Metal & RTOS', demandProbability: 97, tier: 'Core' },
          { name: 'Microcontrollers', category: 'Snapdragon & STM32', demandProbability: 95, tier: 'Core' },
          { name: 'C++', category: 'Embedded C++', demandProbability: 93, tier: 'Core' },
          { name: 'Linux', category: 'Embedded Linux / Yocto', demandProbability: 92, tier: 'Core' },
          { name: 'PCB Design', category: 'Board Bring-Up', demandProbability: 90, tier: 'Core' },
          { name: 'Sensors & Actuators', category: 'Hardware Interfacing', demandProbability: 89, tier: 'Core' },
          { name: 'Git / GitHub', category: 'Source Control', demandProbability: 88, tier: 'Core' },

          { name: 'ROS / ROS2', category: 'Middleware', demandProbability: 84, tier: 'Secondary' },
          { name: 'CAN Bus & Hardware Telemetry', category: 'I2C/SPI/UART/CAN', demandProbability: 82, tier: 'Secondary' },
          { name: 'Python', category: 'Automation Scripting', demandProbability: 79, tier: 'Secondary' },
          { name: 'OpenCV', category: 'Vision Telemetry', demandProbability: 76, tier: 'Secondary' },
          { name: 'RTOS Task Scheduling', category: 'FreeRTOS & Zephyr', demandProbability: 74, tier: 'Secondary' },
          { name: 'Gazebo', category: 'URDF Simulation', demandProbability: 72, tier: 'Secondary' },
          { name: 'Problem Solving', category: 'Hardware Debugging', demandProbability: 70, tier: 'Secondary' },
          { name: 'Docker', category: 'Containerized Testing', demandProbability: 68, tier: 'Secondary' },
          { name: 'PID Control & State Estimation', category: 'Motor Closed-Loop', demandProbability: 66, tier: 'Secondary' },
          { name: 'Communication Skills', category: 'Cross-Functional', demandProbability: 64, tier: 'Secondary' },
          { name: 'Oscilloscopes & Logic Analyzers', category: 'Lab Instruments', demandProbability: 62, tier: 'Secondary' },
          { name: 'CI/CD Automation Pipelines', category: 'Automated Flashing', demandProbability: 61, tier: 'Secondary' },
          { name: 'SLAM & Perception', category: 'Edge Navigation', demandProbability: 60, tier: 'Secondary' },

          { name: 'CUDA & GPU Acceleration', category: 'NPU / DSP Acceleration', demandProbability: 55, tier: 'Specialized' },
          { name: 'Functional Safety Compliance', category: 'Automotive / Industrial', demandProbability: 47, tier: 'Specialized' },
        ],
      }),
    ];
  }

  // --- Career Roadmap ---
  async getCareerRoadmap(role?: string): Promise<RoadmapItem[]> {
    const targetRoleLower = (role || this.profile.targetRole || 'Data Scientist').toLowerCase();

    if (targetRoleLower.includes('data') || targetRoleLower.includes('analytic') || targetRoleLower.includes('statistic') || targetRoleLower.includes('bi')) {
      return [
        {
          id: 'rm_ds_1',
          stage: 'FOUNDATION',
          stageOrder: 1,
          skillName: 'Business Statistics & Probability Inference',
          currentLevel: 'Intermediate',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 18,
          status: 'In Progress',
          learningObjective: 'Master hypothesis testing, regression modeling, and statistical inference for predictive modeling.',
          recommendedResources: [
            { title: 'Practical Statistics for Data Scientists', type: 'Course', estTime: '10 hrs' },
            { title: 'A/B Testing & Statistical Experimentation Lab', type: 'Project', estTime: '8 hrs' }
          ]
        },
        {
          id: 'rm_ds_2',
          stage: 'CORE SKILLS',
          stageOrder: 2,
          skillName: 'SQL & Query Optimization',
          currentLevel: 'None',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 20,
          status: 'In Progress',
          learningObjective: 'Master complex window functions, CTEs, query plan indexing, and large dataset aggregation.',
          recommendedResources: [
            { title: 'Advanced SQL for Production Analytics', type: 'Course', estTime: '12 hrs' },
            { title: 'E-Commerce Million-Row Query Optimization Capstone', type: 'Project', estTime: '8 hrs' }
          ]
        },
        {
          id: 'rm_ds_3',
          stage: 'INDUSTRY SKILLS',
          stageOrder: 3,
          skillName: 'Machine Learning Pipelines & Scikit-Learn',
          currentLevel: 'None',
          targetLevel: 'Advanced',
          priority: 'High',
          estimatedHours: 24,
          status: 'In Progress',
          learningObjective: 'Implement cross-validation, feature transformation, XGBoost, and ensemble decision architectures.',
          recommendedResources: [
            { title: 'Production Machine Learning Engineering', type: 'Course', estTime: '14 hrs' },
            { title: 'Customer Churn & Recommender Pipeline Lab', type: 'Project', estTime: '10 hrs' }
          ]
        },
        {
          id: 'rm_ds_4',
          stage: 'JOB READY',
          stageOrder: 4,
          skillName: 'Power BI / Tableau Executive Dashboards',
          currentLevel: 'None',
          targetLevel: 'Advanced',
          priority: 'Medium',
          estimatedHours: 16,
          status: 'In Progress',
          learningObjective: 'Build real-time interactive business intelligence dashboards with DAX measures and automated ETL.',
          recommendedResources: [
            { title: 'Enterprise Business Intelligence & DAX Mastery', type: 'Course', estTime: '10 hrs' },
            { title: 'Executive Operations KPI Dashboard Capstone', type: 'Project', estTime: '6 hrs' }
          ]
        }
      ];
    }

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
