export interface SkillItem {
  id: string;
  name: string;
  category: string;
  level: 'Basic' | 'Intermediate' | 'Advanced';
  type: 'Self Reported' | 'Resume Extracted' | 'Verified';
  proficiencyScore: number; // 0 - 100
  verifiedBy?: string;
  lastUpdated: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  skillsUsed: string[];
  link?: string;
  date: string;
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialId?: string;
  skillsValidated: string[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  education: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear: string;
    cgpa: string;
  };
  location: string;
  targetRole: string;
  targetLocation: string;
  targetCompany: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  readinessScore: number;
  resume: {
    fileName: string;
    uploadDate: string;
    fileSize: string;
    parsedStatus: 'Parsed' | 'Processing' | 'Pending';
  };
  skills: SkillItem[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  certifications: CertificationItem[];
}

export const initialStudentProfile: StudentProfile = {
  id: 'std_10029',
  name: 'Yogesh Kumar',
  email: 'yogesh.kumar@student.edu',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  education: {
    institution: 'National Institute of Technology',
    degree: 'Bachelor of Technology (B.Tech)',
    fieldOfStudy: 'Computer Science & Engineering',
    graduationYear: '2026',
    cgpa: '8.6 / 10',
  },
  location: 'Bengaluru, India',
  targetRole: 'Data Analyst',
  targetLocation: 'Bengaluru',
  targetCompany: 'Open to All',
  readinessScore: 72,
  resume: {
    fileName: 'Yogesh_Kumar_Resume_2026.pdf',
    uploadDate: '2026-08-20',
    fileSize: '1.4 MB',
    parsedStatus: 'Parsed',
  },
  skills: [
    {
      id: 'sk_1',
      name: 'SQL',
      category: 'Database & Querying',
      level: 'Intermediate',
      type: 'Verified',
      proficiencyScore: 75,
      verifiedBy: 'SkillVantage AI Assessment',
      lastUpdated: '2026-08-25',
    },
    {
      id: 'sk_2',
      name: 'Python',
      category: 'Programming Languages',
      level: 'Advanced',
      type: 'Verified',
      proficiencyScore: 88,
      verifiedBy: 'Resume Parser & GitHub Sync',
      lastUpdated: '2026-08-22',
    },
    {
      id: 'sk_3',
      name: 'Pandas',
      category: 'Data Manipulation',
      level: 'Advanced',
      type: 'Resume Extracted',
      proficiencyScore: 82,
      lastUpdated: '2026-08-20',
    },
    {
      id: 'sk_4',
      name: 'Power BI',
      category: 'Data Visualization',
      level: 'Basic',
      type: 'Self Reported',
      proficiencyScore: 45,
      lastUpdated: '2026-08-15',
    },
    {
      id: 'sk_5',
      name: 'Statistics',
      category: 'Analytics & Math',
      level: 'Basic',
      type: 'Self Reported',
      proficiencyScore: 50,
      lastUpdated: '2026-08-18',
    },
    {
      id: 'sk_6',
      name: 'Excel (Advanced)',
      category: 'Business Tools',
      level: 'Intermediate',
      type: 'Resume Extracted',
      proficiencyScore: 70,
      lastUpdated: '2026-08-20',
    },
    {
      id: 'sk_7',
      name: 'Machine Learning',
      category: 'Data Science',
      level: 'Basic',
      type: 'Self Reported',
      proficiencyScore: 40,
      lastUpdated: '2026-08-10',
    },
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'E-Commerce Customer Churn Analysis',
      description: 'Analyzed customer behavior dataset of 50,000+ users using Python, Pandas, and SQL to identify key churn indicators.',
      skillsUsed: ['Python', 'Pandas', 'SQL', 'Data Visualization'],
      link: 'https://github.com/yogesh/churn-analysis',
      date: 'July 2026',
    },
    {
      id: 'proj_2',
      title: 'Interactive Retail Sales Dashboard',
      description: 'Built a multi-tab Power BI dashboard displaying regional revenue performance, profit margins, and monthly growth trends.',
      skillsUsed: ['Power BI', 'Excel', 'Data Storytelling'],
      link: 'https://github.com/yogesh/sales-dashboard',
      date: 'May 2026',
    },
  ],
  certifications: [
    {
      id: 'cert_1',
      title: 'Google Data Analytics Professional Certificate',
      issuer: 'Coursera / Google',
      issueDate: 'June 2026',
      credentialId: 'GDA-98234-2026',
      skillsValidated: ['Data Analysis', 'SQL', 'R Programming', 'Tableau'],
    },
    {
      id: 'cert_2',
      title: 'SQL for Data Science',
      issuer: 'UC Davis / Coursera',
      issueDate: 'April 2026',
      credentialId: 'UCD-55102-2026',
      skillsValidated: ['SQL', 'Relational Databases', 'Data Manipulation'],
    },
  ],
  experience: [
    {
      id: 'exp_1',
      role: 'Data Analyst Intern',
      company: 'TechCorp Analytics',
      startDate: 'May 2025',
      endDate: 'July 2025',
      description: 'Built SQL queries and automated business intelligence dashboards. Cleaned and manipulated customer records using Python and Pandas.'
    }
  ],
};
