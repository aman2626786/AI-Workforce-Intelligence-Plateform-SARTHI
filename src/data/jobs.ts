export interface JobMatch {
  id: string;
  companyName: string;
  companyLogo: string;
  jobTitle: string;
  location: string;
  type: string; // e.g. Full-Time, Internship, Remote
  salaryRange: string;
  matchScore: number;
  matchedSkillsCount: number;
  totalRequiredSkillsCount: number;
  strongSkills: string[];
  missingSkills: string[];
  matchExplanation: string;
  postedDaysAgo: number;
  department: string;
}

export const initialJobs: JobMatch[] = [
  {
    id: 'job_rob_1',
    companyName: 'GreyOrange Robotics',
    companyLogo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&q=80&w=120',
    jobTitle: 'Robotics Software Engineer - Autonomous Systems',
    location: 'Bengaluru, KA (On-site)',
    type: 'Full-Time',
    salaryRange: '₹14.0 - ₹24.0 LPA',
    matchScore: 92,
    matchedSkillsCount: 5,
    totalRequiredSkillsCount: 6,
    strongSkills: ['ROS / ROS2', 'C++', 'SLAM & Perception', 'Kinematics & Dynamics', 'OpenCV'],
    missingSkills: ['Gazebo Simulation'],
    matchExplanation: '92% direct alignment with your verified ROS2 node development, SLAM mapping, and real-time C++ systems programming background.',
    postedDaysAgo: 1,
    department: 'Autonomous Mobile Robots (AMR)',
  },
  {
    id: 'job_rob_2',
    companyName: 'ABB Robotics',
    companyLogo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=120',
    jobTitle: 'Junior Autonomous Navigation Engineer',
    location: 'Bengaluru, KA',
    type: 'Full-Time',
    salaryRange: '₹10.0 - ₹18.0 LPA',
    matchScore: 85,
    matchedSkillsCount: 4,
    totalRequiredSkillsCount: 5,
    strongSkills: ['ROS2', 'C++', 'Kinematics', 'Embedded C & RTOS'],
    missingSkills: ['LiDAR Point Cloud Processing'],
    matchExplanation: 'Strong baseline in robotic manipulator kinematics and RTOS embedded control loops. Completing LiDAR mapping modules will boost match to 96%.',
    postedDaysAgo: 3,
    department: 'Industrial Automation & Robotics',
  },
  {
    id: 'job_rob_3',
    companyName: 'Tesla Autopilot & Robotics',
    companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&q=80&w=120',
    jobTitle: 'Robotics Engineer - SLAM & State Estimation',
    location: 'Remote / Global',
    type: 'Remote',
    salaryRange: '₹22.0 - ₹38.0 LPA',
    matchScore: 81,
    matchedSkillsCount: 4,
    totalRequiredSkillsCount: 6,
    strongSkills: ['Modern C++', 'ROS / ROS2', 'SLAM & Perception', 'Sensors & Actuators'],
    missingSkills: ['CUDA Acceleration', 'Kalman Filter Tuning'],
    matchExplanation: 'High compatibility for state estimation and perception pipelines. Requires deepening low-latency CUDA tensor acceleration.',
    postedDaysAgo: 2,
    department: 'Autonomous Perception & Autopilot',
  },
  {
    id: 'job_rob_4',
    companyName: 'Qualcomm Wireless & Robotics Lab',
    companyLogo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    jobTitle: 'Embedded Systems & Robotics Firmware Engineer',
    location: 'Hyderabad, TS',
    type: 'Full-Time',
    salaryRange: '₹12.0 - ₹20.0 LPA',
    matchScore: 78,
    matchedSkillsCount: 4,
    totalRequiredSkillsCount: 6,
    strongSkills: ['Embedded C & RTOS', 'Microcontrollers (STM32)', 'C++', 'Sensors & Actuators'],
    missingSkills: ['CAN Bus Protocol', 'FreeRTOS Semaphores'],
    matchExplanation: 'Direct match for your microcontrollers and hardware interfacing project background.',
    postedDaysAgo: 4,
    department: 'Robotics Platform Software',
  },
];
