import { SkillItem } from '@/data/profile';

/**
 * Bulletproof Canonical Skill Matcher
 * Eliminates substring false-positives (e.g. matching 'C' to 'C++', 'C' to 'Perception', 'AI' to 'Email')
 */

// Normalized alias mappings for technical skills
const SKILL_ALIASES: Record<string, string[]> = {
  'c': ['c programming', 'ansi c', 'c language'],
  'c++': ['cpp', 'c plus plus', 'modern c++', 'c++11', 'c++14', 'c++17', 'c++20'],
  'c#': ['csharp', 'c sharp'],
  'ros / ros2': ['ros', 'ros2', 'robot operating system', 'ros 2'],
  'ros2': ['ros 2', 'robot operating system 2', 'ros / ros2'],
  'ros': ['ros1', 'robot operating system', 'ros / ros2'],
  'embedded c & rtos': ['embedded c', 'rtos', 'freertos', 'embedded c / rtos', 'real-time operating systems'],
  'embedded c': ['embedded c programming', 'bare-metal c', 'embedded c & rtos'],
  'rtos': ['freertos', 'zephyr', 'vxworks', 'real-time os', 'embedded c & rtos'],
  'slam & perception': ['slam', 'perception', 'lidar slam', 'simultaneous localization and mapping', 'visual slam'],
  'slam': ['simultaneous localization and mapping', 'lidar slam', 'vslam', 'slam & perception'],
  'gazebo & simulation': ['gazebo', 'robot simulation', 'urdf simulation', 'gazebo simulator'],
  'gazebo': ['gazebo simulator', 'gazebo & simulation'],
  'kinematics & dynamics': ['kinematics', 'dynamics', 'forward kinematics', 'inverse kinematics', 'moveit', 'trajectory planning'],
  'sensors & actuators': ['sensors', 'actuators', 'sensor interfacing', 'imu', 'encoders', 'servos', 'lidar'],
  'opencv': ['computer vision cv', 'opencv python', 'opencv c++'],
  'computer vision': ['vision', 'computer vision / nlp', 'cv'],
  'generative ai & llms': ['generative ai', 'gen ai', 'llms', 'large language models', 'rag'],
  'generative ai': ['gen ai', 'generative ai & llms'],
  'machine learning': ['ml', 'machine learning / ai'],
  'python & pandas': ['python', 'pandas', 'numpy'],
  'python': ['python 3', 'python programming', 'python for analytics', 'python & pandas'],
  'microcontrollers': ['microcontrollers (stm32/esp32)', 'stm32', 'esp32', 'arduino', 'arm cortex', 'mcu'],
  'pcb design': ['pcb design & schematics', 'altium', 'kicad', 'pcb routing'],
  'cuda & gpu acceleration': ['cuda', 'gpu programming', 'tensorrt', 'jetson'],
  'can bus & hardware telemetry': ['can bus', 'can protocol', 'hardware telemetry', 'uart', 'spi', 'i2c'],
};

// Normalize a single skill string for exact token-level comparison
export function cleanSkillString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\+\#\/\.\-]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Checks if candidateSkill matches requirementSkill strictly and safely.
 */
export function isSkillMatch(candidateSkillName: string, requirementSkillName: string): boolean {
  const cClean = cleanSkillString(candidateSkillName);
  const rClean = cleanSkillString(requirementSkillName);

  if (!cClean || !rClean) return false;

  // 1. Exact match
  if (cClean === rClean) return true;

  // 2. Strict C vs C++ vs C# safety guards
  if (cClean === 'c' && (rClean.includes('c++') || rClean.includes('cpp') || rClean.includes('c#') || rClean.includes('csharp'))) {
    return false;
  }
  if (rClean === 'c' && (cClean.includes('c++') || cClean.includes('cpp') || cClean.includes('c#') || cClean.includes('csharp'))) {
    return false;
  }

  // 3. Check registered alias mappings
  for (const [key, aliases] of Object.entries(SKILL_ALIASES)) {
    const keyClean = cleanSkillString(key);
    const allKeyForms = [keyClean, ...aliases.map(cleanSkillString)];

    const candidateMatchesKey = allKeyForms.includes(cClean);
    const requirementMatchesKey = allKeyForms.includes(rClean);

    if (candidateMatchesKey && requirementMatchesKey) {
      return true;
    }
  }

  // 4. Token-level slash & ampersand splits (e.g., 'ROS / ROS2' -> ['ros', 'ros2'])
  const rTokens = rClean.split(/[\/\&\,]+/).map((t) => t.trim()).filter((t) => t.length > 0);
  const cTokens = cClean.split(/[\/\&\,]+/).map((t) => t.trim()).filter((t) => t.length > 0);

  for (const cT of cTokens) {
    // Prevent single letter matches like 'c' matching 'perception' or 'mechanics'
    if (cT.length <= 1) {
      if (rTokens.includes(cT)) return true;
      continue;
    }

    for (const rT of rTokens) {
      if (rT.length <= 1) {
        if (cT === rT) return true;
        continue;
      }

      if (cT === rT) return true;

      // Check aliases for individual tokens
      const cAliases = SKILL_ALIASES[cT] ? [cT, ...SKILL_ALIASES[cT].map(cleanSkillString)] : [cT];
      const rAliases = SKILL_ALIASES[rT] ? [rT, ...SKILL_ALIASES[rT].map(cleanSkillString)] : [rT];
      
      const hasIntersection = cAliases.some((a) => rAliases.includes(a));
      if (hasIntersection) return true;
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
  return candidateSkills.find((sk) => isSkillMatch(sk.name, requirementSkillName));
}
