export interface IndustrySkill {
  id: string;
  name: string;
  category: string;
  demandPercentage: number; // e.g. 78 = 78% of job postings require this
  trend: 'up' | 'stable' | 'down' | 'rapid';
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | 'Emerging';
  status: 'Rising' | 'Stable' | 'Emerging' | 'Declining';
  studentLevel: 'Basic' | 'Intermediate' | 'Advanced' | 'None';
  requiredLevel: 'Basic' | 'Intermediate' | 'Advanced';
  gapSeverity: 'Critical' | 'Partial' | 'Met';
  categoryColor: string;
  description: string;
}

export const initialSkills: IndustrySkill[] = [
  {
    id: 'sk_ros',
    name: 'ROS / ROS2',
    category: 'Robotics Middleware',
    demandPercentage: 94,
    trend: 'rapid',
    priority: 'Critical',
    status: 'Rising',
    studentLevel: 'Intermediate',
    requiredLevel: 'Advanced',
    gapSeverity: 'Partial',
    categoryColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Robot Operating System node development, DDS, action servers, and custom message passing.',
  },
  {
    id: 'sk_cpp',
    name: 'C++',
    category: 'Systems Programming',
    demandPercentage: 89,
    trend: 'up',
    priority: 'High',
    status: 'Rising',
    studentLevel: 'Advanced',
    requiredLevel: 'Advanced',
    gapSeverity: 'Met',
    categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Modern C++ (C++17/20) for real-time low-latency motion control and driver interfacing.',
  },
  {
    id: 'sk_slam',
    name: 'SLAM & Perception',
    category: 'Autonomous Navigation',
    demandPercentage: 84,
    trend: 'rapid',
    priority: 'High',
    status: 'Emerging',
    studentLevel: 'Intermediate',
    requiredLevel: 'Advanced',
    gapSeverity: 'Partial',
    categoryColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Simultaneous localization, LiDAR point cloud mapping, and Kalman filter sensor fusion.',
  },
  {
    id: 'sk_gazebo',
    name: 'Gazebo & Simulation',
    category: 'Robotics Simulation',
    demandPercentage: 78,
    trend: 'up',
    priority: 'Medium',
    status: 'Rising',
    studentLevel: 'Basic',
    requiredLevel: 'Intermediate',
    gapSeverity: 'Partial',
    categoryColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Physics-based multi-body simulation and URDF kinematic modeling.',
  },
  {
    id: 'sk_rtos',
    name: 'Embedded C & RTOS',
    category: 'Embedded Systems',
    demandPercentage: 71,
    trend: 'up',
    priority: 'Medium',
    status: 'Rising',
    studentLevel: 'Intermediate',
    requiredLevel: 'Intermediate',
    gapSeverity: 'Met',
    categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Deterministic task scheduling on STM32, ARM Cortex, and FreeRTOS.',
  },
];
