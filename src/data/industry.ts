export interface TrendPoint {
  month: string;
  [key: string]: string | number;
}

export interface EmergingSkill {
  id: string;
  name: string;
  growthRate: string;
  demandPercentage: number;
  status: 'Rapid Growth' | 'Growing' | 'Stable';
  whyItMatters: string;
  recommendedAction: string;
}

export interface CompanySkillCriteria {
  id: string;
  companyName: string;
  companyLogo: string;
  industryTier: 'Tier 1 Tech' | 'Fintech' | 'Enterprise SaaS' | 'Unicorn' | 'Consulting';
  activeRole: string;
  openPositionsCount: number;
  entryMandatorySkills: string[];
  preferredAdvancedSkills: string[];
  hiringStatus: 'Actively Hiring' | 'High Demand' | 'Hiring Peak';
  minProficiencyExpected: 'Basic' | 'Intermediate' | 'Advanced';
}

export interface SkillToCompanyMapping {
  skillName: string;
  category: string;
  companiesCount: number; // e.g. 42 companies
  percentageOfMarket: number; // e.g. 78%
  sampleCompanies: {
    name: string;
    logo: string;
    isMandatory: boolean;
    roleLevel: string;
  }[];
  keyInterviewFocus: string;
}

export interface IndustryOverview {
  targetRole: string;
  totalJobSignals: number;
  lastUpdated: string;
  timeframe: string;
  location: string;
  trendData: TrendPoint[];
  emergingSkills: EmergingSkill[];
  companyCriteria: CompanySkillCriteria[];
  skillCompanyMappings: SkillToCompanyMapping[];
}

export const industryData: IndustryOverview = {
  targetRole: 'Robotics Engineer',
  totalJobSignals: 1840,
  lastUpdated: 'Live Feed Today',
  timeframe: 'Last 6 Months',
  location: 'Pan India (Bengaluru, Pune, Hyderabad, Remote)',
  trendData: [
    { month: 'Oct 2025', SQL: 45, Python: 75, PowerBI: 30, GenAI: 40, Cloud: 55 },
    { month: 'Nov 2025', SQL: 48, Python: 78, PowerBI: 32, GenAI: 48, Cloud: 60 },
    { month: 'Dec 2025', SQL: 50, Python: 82, PowerBI: 34, GenAI: 55, Cloud: 65 },
    { month: 'Jan 2026', SQL: 52, Python: 85, PowerBI: 35, GenAI: 62, Cloud: 70 },
    { month: 'Feb 2026', SQL: 55, Python: 88, PowerBI: 36, GenAI: 72, Cloud: 75 },
    { month: 'Mar 2026', SQL: 58, Python: 92, PowerBI: 38, GenAI: 84, Cloud: 80 },
  ],
  emergingSkills: [
    {
      id: 'em_1',
      name: 'ROS2 DDS & Nav2',
      growthRate: '+45% YoY',
      demandPercentage: 88,
      status: 'Rapid Growth',
      whyItMatters: 'Industry-standard distributed robotics communication and autonomous navigation stack.',
      recommendedAction: 'Master ROS2 node composition, lifecycle nodes, and Nav2 costmap plugins.',
    },
    {
      id: 'em_2',
      name: 'Visual SLAM & LiDAR Fusion',
      growthRate: '+38% YoY',
      demandPercentage: 82,
      status: 'Rapid Growth',
      whyItMatters: 'Essential for mobile robots operating in GPS-denied indoor warehouse and industrial environments.',
      recommendedAction: 'Implement Cartographer and extended Kalman filter odometry fusion.',
    },
    {
      id: 'em_3',
      name: 'MoveIt Trajectory Planning',
      growthRate: '+24% YoY',
      demandPercentage: 74,
      status: 'Growing',
      whyItMatters: 'Critical for multi-axis robotic arm manipulator inverse kinematics and obstacle avoidance.',
      recommendedAction: 'Build URDF kinematic models and execute collision-free trajectory planning.',
    },
  ],
  companyCriteria: [
    {
      id: 'cc_1',
      companyName: 'GreyOrange Robotics',
      companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120',
      industryTier: 'Tier 1 Tech',
      activeRole: 'Robotics Software Engineer',
      openPositionsCount: 14,
      entryMandatorySkills: ['ROS / ROS2', 'C++', 'SLAM & Perception'],
      preferredAdvancedSkills: ['Gazebo Simulation', 'MoveIt', 'RTOS'],
      hiringStatus: 'Actively Hiring',
      minProficiencyExpected: 'Intermediate',
    },
    {
      id: 'cc_2',
      companyName: 'ABB Robotics',
      companyLogo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=120',
      industryTier: 'Tier 1 Tech',
      activeRole: 'Autonomous Navigation Engineer',
      openPositionsCount: 8,
      entryMandatorySkills: ['C++', 'ROS2', 'Kinematics & Dynamics'],
      preferredAdvancedSkills: ['LiDAR Point Clouds', 'Gazebo', 'OpenCV'],
      hiringStatus: 'Hiring Peak',
      minProficiencyExpected: 'Intermediate',
    },
    {
      id: 'cc_3',
      companyName: 'Tesla Autopilot & Robotics',
      companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=120',
      industryTier: 'Unicorn',
      activeRole: 'Perception & Controls Engineer',
      openPositionsCount: 12,
      entryMandatorySkills: ['Modern C++', 'State Estimation', 'ROS2'],
      preferredAdvancedSkills: ['CUDA', 'Kalman Filters', 'Hardware in Loop'],
      hiringStatus: 'Actively Hiring',
      minProficiencyExpected: 'Advanced',
    },
  ],
  skillCompanyMappings: [
    {
      skillName: 'ROS / ROS2',
      category: 'Robotics Middleware',
      companiesCount: 48,
      percentageOfMarket: 94,
      sampleCompanies: [
        { name: 'GreyOrange Robotics', logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120', isMandatory: true, roleLevel: 'Robotics Engineer' },
        { name: 'ABB Robotics', logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=120', isMandatory: true, roleLevel: 'Junior Systems Engineer' },
        { name: 'Tesla Autopilot', logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=120', isMandatory: true, roleLevel: 'Autonomy Engineer' },
      ],
      keyInterviewFocus: 'ROS2 DDS communication, node lifecycle, custom msg/srv definitions, and multi-robot coordination.',
    },
    {
      skillName: 'C++',
      category: 'Systems Programming',
      companiesCount: 45,
      percentageOfMarket: 89,
      sampleCompanies: [
        { name: 'GreyOrange Robotics', logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120', isMandatory: true, roleLevel: 'Core Software Engineer' },
        { name: 'Tesla Autopilot', logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=120', isMandatory: true, roleLevel: 'Perception Systems' },
      ],
      keyInterviewFocus: 'Modern C++ (17/20), memory management, multithreading, and real-time execution optimization.',
    },
    {
      skillName: 'SLAM & Perception',
      category: 'Autonomous Navigation',
      companiesCount: 38,
      percentageOfMarket: 84,
      sampleCompanies: [
        { name: 'GreyOrange Robotics', logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120', isMandatory: true, roleLevel: 'Perception Specialist' },
        { name: 'ABB Robotics', logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=120', isMandatory: false, roleLevel: 'Autonomy Engineer' },
      ],
      keyInterviewFocus: 'Extended Kalman Filter (EKF), Cartographer, Point Cloud registration, and loop closure.',
    },
  ],
};
