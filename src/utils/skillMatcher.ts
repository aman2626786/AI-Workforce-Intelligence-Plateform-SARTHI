import { SkillItem } from '@/data/profile';

/**
 * High-Precision Canonical Skill Matcher
 * Matches extracted resume skills (e.g. 'Python', 'SQL', 'Excel', 'C++', 'ROS', 'Gazebo', 'Machine Learning')
 * to comprehensive industry requirement definitions (e.g. 'Python & Pandas', 'SQL & Advanced Query Optimization',
 * 'Data Visualization (Power BI / Tableau)', 'Modern C++ (C++17/20)', 'ROS / ROS2 (Robot Operating System)').
 */

// Normalized synonym map for multi-token and alias matching
const SYNONYMS: Record<string, string[]> = {
  'python': ['python', 'python 3', 'python3', 'python programming', 'pandas', 'numpy', 'scipy', 'python for analytics', 'python & pandas', 'python for robotics'],
  'sql': ['sql', 'sql queries', 'mysql', 'postgresql', 'postgres', 'sqlite', 'plsql', 'tsql', 'query optimization', 'sql query optimization', 'relational databases'],
  'excel': ['excel', 'ms excel', 'microsoft excel', 'advanced excel', 'spreadsheets', 'power query', 'vlookup', 'xlookup'],
  'power bi': ['power bi', 'powerbi', 'dax', 'power bi desktop', 'power bi & tableau'],
  'tableau': ['tableau', 'tableau desktop', 'tableau server', 'power bi & tableau'],
  'machine learning': ['machine learning', 'ml', 'scikit-learn', 'sklearn', 'supervised learning', 'unsupervised learning', 'xgboost', 'random forest'],
  'deep learning': ['deep learning', 'dl', 'pytorch', 'tensorflow', 'keras', 'neural networks', 'cnns', 'transformers'],
  'generative ai': ['generative ai', 'gen ai', 'genai', 'llm', 'llms', 'large language models', 'rag', 'langchain', 'prompt engineering', 'llama', 'gpt'],
  'computer vision': ['computer vision', 'cv', 'opencv', 'vision', 'yolo', 'image processing', 'cnn'],
  'c': ['c', 'c programming', 'ansi c', 'c language'],
  'c++': ['c++', 'cpp', 'c plus plus', 'modern c++', 'c++11', 'c++14', 'c++17', 'c++20'],
  'c#': ['c#', 'csharp', 'c sharp', '.net'],
  'embedded c': ['embedded c', 'embedded c programming', 'bare-metal c', 'bare metal', 'firmware c', 'firmware'],
  'rtos': ['rtos', 'freertos', 'real-time operating system', 'real-time operating systems', 'zephyr', 'vxworks'],
  'ros': ['ros', 'ros1', 'ros2', 'ros 2', 'robot operating system', 'ros / ros2', 'robotics middleware'],
  'ros2': ['ros2', 'ros 2', 'robot operating system 2', 'ros / ros2', 'dds'],
  'gazebo': ['gazebo', 'gazebo simulator', 'physics simulation', 'urdf', 'gazebo physics simulation & urdf'],
  'slam': ['slam', 'vslam', 'simultaneous localization and mapping', 'lidar slam', 'visual slam', 'slam & autonomous navigation'],
  'microcontrollers': ['microcontrollers', 'stm32', 'esp32', 'arduino', 'arm cortex', 'arm cortex-m', 'mcu', 'microcontroller'],
  'pcb design': ['pcb design', 'pcb', 'altium', 'altium designer', 'kicad', 'pcb layout', 'schematics', 'pcb schematics'],
  'kinematics': ['kinematics', 'dynamics', 'moveit', 'inverse kinematics', 'forward kinematics', 'trajectory planning'],
  'git': ['git', 'github', 'gitlab', 'version control'],
  'docker': ['docker', 'containerization', 'containers', 'docker compose'],
  'kubernetes': ['kubernetes', 'k8s', 'helm', 'kubeflow'],
  'aws': ['aws', 'amazon web services', 's3', 'ec2', 'lambda', 'sagemaker', 'cloud'],
  'gcp': ['gcp', 'google cloud', 'bigquery', 'vertex ai'],
  'azure': ['azure', 'microsoft azure'],
  'linux': ['linux', 'ubuntu', 'bash', 'shell scripting', 'unix'],
  'react': ['react', 'react.js', 'reactjs', 'next.js', 'nextjs', 'react / next.js'],
  'next.js': ['next.js', 'nextjs', 'react & next.js 15', 'next 15'],
  'node.js': ['node.js', 'nodejs', 'node', 'express', 'express.js', 'nest.js'],
  'typescript': ['typescript', 'ts'],
  'javascript': ['javascript', 'js', 'es6', 'esnext'],
  'product management': ['product management', 'product strategy', 'prd', 'roadmap', 'product discovery'],
  'agile': ['agile', 'scrum', 'kanban', 'jira', 'sprint planning'],
};

/**
 * Normalizes text to lowercase alphanumeric string with protected symbols (+, #)
 */
export function normalizeSkillText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\+\#]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Extracts distinct searchable sub-tokens / phrases from a compound requirement
 * e.g. "Data Visualization (Power BI / Tableau)" -> ['data visualization', 'power bi', 'tableau']
 */
export function extractSubPhrases(str: string): string[] {
  if (!str) return [];
  const raw = str.toLowerCase();

  // Split on delimiters: / , & and ( ) + • - ;
  const parts = raw
    .split(/[\/\,\&\;\|\(\)\•\+\-]+|\band\b/g)
    .map((p) => normalizeSkillText(p))
    .filter((p) => p.length > 0);

  const fullClean = normalizeSkillText(str);
  const results = new Set<string>();
  if (fullClean) results.add(fullClean);

  for (const part of parts) {
    if (part.length > 0) {
      results.add(part);
    }
  }

  return Array.from(results);
}

/**
 * Checks if candidateSkillName matches requirementSkillName safely and accurately.
 */
export function isSkillMatch(candidateSkillName: string, requirementSkillName: string): boolean {
  const cNorm = normalizeSkillText(candidateSkillName);
  const rNorm = normalizeSkillText(requirementSkillName);

  if (!cNorm || !rNorm) return false;

  // 1. Direct exact normalized match
  if (cNorm === rNorm) return true;

  // 2. Strict C vs C++ vs C# safety boundaries (prevent single letter false-positives)
  if (cNorm === 'c' && (rNorm.includes('c++') || rNorm.includes('cpp') || rNorm.includes('c#') || rNorm.includes('csharp'))) {
    return false;
  }
  if (rNorm === 'c' && (cNorm.includes('c++') || cNorm.includes('cpp') || cNorm.includes('c#') || cNorm.includes('csharp'))) {
    return false;
  }

  // 3. Synonym dictionary matching
  for (const [key, group] of Object.entries(SYNONYMS)) {
    const groupNorm = group.map(normalizeSkillText);
    const candidateMatches = groupNorm.includes(cNorm) || cNorm === key;

    if (candidateMatches) {
      // Check if requirement contains this key or any group phrase
      const rSubPhrases = extractSubPhrases(requirementSkillName);
      for (const phrase of rSubPhrases) {
        if (groupNorm.includes(phrase) || phrase === key) {
          return true;
        }
      }
      // Also check if rNorm contains whole word key
      const rWords = rNorm.split(' ');
      if (rWords.includes(key) || groupNorm.some((g) => rNorm.includes(g))) {
        // Double check not to match 'c' in random words
        if (key === 'c') {
          if (rWords.includes('c') || rNorm.includes('c programming') || rNorm.includes('c language')) return true;
          return false;
        }
        return true;
      }
    }
  }

  // 4. Sub-phrase bidirectional cross-matching
  const cSubPhrases = extractSubPhrases(candidateSkillName);
  const rSubPhrases = extractSubPhrases(requirementSkillName);

  for (const cP of cSubPhrases) {
    // Avoid single character matching anything unless exact (e.g. 'c' handled above)
    if (cP.length <= 1) continue;

    for (const rP of rSubPhrases) {
      if (rP.length <= 1) continue;

      if (cP === rP) return true;

      // Phrase containment (e.g. candidate 'machine learning' in requirement 'machine learning scikit learn')
      if (rP.includes(cP) && cP.length >= 3) {
        // Guard against short substring traps (e.g. 'art' in 'dart')
        const rTokens = rP.split(' ');
        const cTokens = cP.split(' ');
        if (cTokens.every((ct) => rTokens.includes(ct))) {
          return true;
        }
      }

      if (cP.includes(rP) && rP.length >= 3) {
        const rTokens = rP.split(' ');
        const cTokens = cP.split(' ');
        if (rTokens.every((rt) => cTokens.includes(rt))) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Searches a candidate's profile skills list for a matching skill item
 */
export function findMatchingCandidateSkill(
  candidateSkills: SkillItem[],
  requirementSkillName: string
): SkillItem | undefined {
  if (!candidateSkills || candidateSkills.length === 0) return undefined;
  return candidateSkills.find((sk) => isSkillMatch(sk.name, requirementSkillName));
}
