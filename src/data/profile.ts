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

export const createEmptyStudentProfile = (name?: string, email?: string): StudentProfile => ({
  id: 'std_' + Math.random().toString(36).substring(2, 9),
  name: name || '',
  email: email || '',
  avatarUrl: '',
  education: {
    institution: '',
    degree: '',
    fieldOfStudy: '',
    graduationYear: new Date().getFullYear().toString(),
    cgpa: '',
  },
  location: '',
  targetRole: 'Robotics Engineer',
  targetLocation: 'Bengaluru',
  targetCompany: 'Open to Top Employers',
  readinessScore: 0,
  resume: {
    fileName: '',
    uploadDate: '',
    fileSize: '',
    parsedStatus: 'Pending',
  },
  skills: [],
  projects: [],
  experience: [],
  certifications: [],
});

export const initialStudentProfile: StudentProfile = createEmptyStudentProfile();

