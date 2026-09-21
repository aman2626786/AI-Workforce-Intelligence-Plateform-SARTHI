export interface AttachedPlatformLink {
  id: string;
  platform: string; // 'leetcode' | 'huggingface' | 'kaggle' | 'github' | 'web' | 'docs'
  title: string;
  url: string;
  isVerified?: boolean;
}

export const PLATFORM_CONFIG: Record<
  string,
  {
    name: string;
    label: string;
    logoUrl?: string;
    isBrowser?: boolean;
    color: string;
    bgColor: string;
    borderColor: string;
    badgeBg: string;
    badgeText: string;
    icon: string;
  }
> = {
  leetcode: {
    name: 'LeetCode',
    label: 'LeetCode Practice',
    logoUrl: '/logos/leetcode.png',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    icon: '💡',
  },
  huggingface: {
    name: 'Hugging Face',
    label: 'Hugging Face Hub',
    logoUrl: '/logos/huggingface.png',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-800',
    icon: '🤗',
  },
  kaggle: {
    name: 'Kaggle',
    label: 'Kaggle Platform',
    logoUrl: '/logos/kaggle.png',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    icon: '📊',
  },
  github: {
    name: 'GitHub',
    label: 'GitHub Repository',
    logoUrl: '/logos/Github.png',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    icon: '🐙',
  },
  docs: {
    name: 'Official Docs / Web',
    label: 'Web Browser / Official Docs',
    isBrowser: true,
    color: 'text-sky-700',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    icon: '🌐',
  },
  web: {
    name: 'Official Docs / Web',
    label: 'Web Browser / Official Docs',
    isBrowser: true,
    color: 'text-sky-700',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    icon: '🌐',
  },
};

export function detectPlatform(url: string): string {
  const u = (url || '').toLowerCase();
  if (u.includes('leetcode.com')) return 'leetcode';
  if (u.includes('huggingface.co')) return 'huggingface';
  if (u.includes('kaggle.com')) return 'kaggle';
  if (u.includes('github.com')) return 'github';
  return 'docs';
}
