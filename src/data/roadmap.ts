export interface RoadmapItem {
  id: string;
  stage: 'FOUNDATION' | 'CORE SKILLS' | 'INDUSTRY SKILLS' | 'JOB READY';
  stageOrder: number;
  skillName: string;
  currentLevel: 'Basic' | 'Intermediate' | 'Advanced' | 'None';
  targetLevel: 'Basic' | 'Intermediate' | 'Advanced';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  status: 'Completed' | 'In Progress' | 'Not Started';
  learningObjective: string;
  recommendedResources: { title: string; type: 'Course' | 'Project' | 'Assessment'; estTime: string }[];
}

export const initialRoadmap: RoadmapItem[] = [
  // STAGE 1: FOUNDATION
  {
    id: 'rm_1',
    stage: 'FOUNDATION',
    stageOrder: 1,
    skillName: 'Relational Database Queries (SQL)',
    currentLevel: 'Intermediate',
    targetLevel: 'Advanced',
    priority: 'Critical',
    estimatedHours: 20,
    status: 'In Progress',
    learningObjective: 'Master complex window functions (ROW_NUMBER, DENSE_RANK, LAG/LEAD), subqueries, and execution query optimization.',
    recommendedResources: [
      { title: 'Advanced SQL Querying Masterclass', type: 'Course', estTime: '12 hrs' },
      { title: 'Complex Window Functions Hands-On Assessment', type: 'Assessment', estTime: '3 hrs' },
    ],
  },
  {
    id: 'rm_2',
    stage: 'FOUNDATION',
    stageOrder: 1,
    skillName: 'Python for Data Analysis',
    currentLevel: 'Advanced',
    targetLevel: 'Advanced',
    priority: 'High',
    estimatedHours: 10,
    status: 'Completed',
    learningObjective: 'Efficient data manipulation using Pandas dataframes, NumPy arrays, and vectorized operations.',
    recommendedResources: [
      { title: 'Pandas Data Wrangling Capstone', type: 'Project', estTime: '10 hrs' },
    ],
  },
  {
    id: 'rm_3',
    stage: 'FOUNDATION',
    stageOrder: 1,
    skillName: 'Business Statistics & Probability',
    currentLevel: 'Basic',
    targetLevel: 'Intermediate',
    priority: 'High',
    estimatedHours: 25,
    status: 'In Progress',
    learningObjective: 'Apply hypothesis testing, p-value calculation, confidence intervals, and correlation vs causation analysis.',
    recommendedResources: [
      { title: 'Statistical Inference for Analytics', type: 'Course', estTime: '18 hrs' },
      { title: 'A/B Testing Experiment Design Project', type: 'Project', estTime: '7 hrs' },
    ],
  },

  // STAGE 2: CORE SKILLS
  {
    id: 'rm_4',
    stage: 'CORE SKILLS',
    stageOrder: 2,
    skillName: 'Power BI & DAX Calculations',
    currentLevel: 'Basic',
    targetLevel: 'Advanced',
    priority: 'High',
    estimatedHours: 30,
    status: 'Not Started',
    learningObjective: 'Create interactive dashboards, star-schema data modeling, and write advanced DAX calculated measures.',
    recommendedResources: [
      { title: 'Power BI Desktop & DAX Essentials', type: 'Course', estTime: '20 hrs' },
      { title: 'Corporate Financial Dashboard Build', type: 'Project', estTime: '10 hrs' },
    ],
  },
  {
    id: 'rm_5',
    stage: 'CORE SKILLS',
    stageOrder: 2,
    skillName: 'Exploratory Data Analysis (EDA)',
    currentLevel: 'Intermediate',
    targetLevel: 'Advanced',
    priority: 'Medium',
    estimatedHours: 15,
    status: 'In Progress',
    learningObjective: 'Detect outliers, treat missing values, perform multivariate analysis, and present key takeaways.',
    recommendedResources: [
      { title: 'Practical EDA with Seaborn & Matplotlib', type: 'Course', estTime: '10 hrs' },
    ],
  },

  // STAGE 3: INDUSTRY SKILLS
  {
    id: 'rm_6',
    stage: 'INDUSTRY SKILLS',
    stageOrder: 3,
    skillName: 'Cloud Data Warehousing (BigQuery)',
    currentLevel: 'None',
    targetLevel: 'Intermediate',
    priority: 'High',
    estimatedHours: 20,
    status: 'Not Started',
    learningObjective: 'Execute SQL queries over terabyte-scale datasets in Google BigQuery and manage partition tables.',
    recommendedResources: [
      { title: 'Google Cloud BigQuery Developer Guide', type: 'Course', estTime: '14 hrs' },
      { title: 'BigQuery Sandbox Lab', type: 'Project', estTime: '6 hrs' },
    ],
  },
  {
    id: 'rm_7',
    stage: 'INDUSTRY SKILLS',
    stageOrder: 3,
    skillName: 'Generative AI for Analytics',
    currentLevel: 'None',
    targetLevel: 'Intermediate',
    priority: 'High',
    estimatedHours: 15,
    status: 'Not Started',
    learningObjective: 'Utilize AI assistants to synthesize complex SQL queries, automate documentation, and evaluate model outputs.',
    recommendedResources: [
      { title: 'AI-Assisted Data Analysis Workflow', type: 'Course', estTime: '10 hrs' },
    ],
  },

  // STAGE 4: JOB READY
  {
    id: 'rm_8',
    stage: 'JOB READY',
    stageOrder: 4,
    skillName: 'Portfolio Project & Case Study',
    currentLevel: 'Basic',
    targetLevel: 'Advanced',
    priority: 'Critical',
    estimatedHours: 35,
    status: 'In Progress',
    learningObjective: 'Complete end-to-end industry data analyst case study with GitHub documentation and live Power BI demo.',
    recommendedResources: [
      { title: 'End-to-End E-Commerce Analytics Capstone', type: 'Project', estTime: '30 hrs' },
      { title: 'SkillVantage AI Technical Assessment', type: 'Assessment', estTime: '5 hrs' },
    ],
  },
];
