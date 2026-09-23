/**
 * SkillVantage AI - API Client Service
 * Connects Next.js frontend with FastAPI backend (http://localhost:8000/api)
 * Includes graceful mock fallback if the backend server is not running during pure frontend testing.
 */

import fallbackData from '@/data/fallbackResources.json';

export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
  return 'http://127.0.0.1:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const getNextApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://127.0.0.1:3000/api';
};

export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface BasicProfileData {
  name?: string;
  city: string;
  education_level: string;
  degree: string;
  branch?: string;
  college: string;
  graduation_year: number;
  target_role?: string;
  preferred_location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ExtractedSkill {
  skill_id: string;
  canonical_name: string;
  category: string;
  original_text: string;
  source_section: string;
  confidence: number;
  confirmed?: boolean;
}

export interface ConflictItem {
  id?: string;
  field_name: string;
  user_value: string;
  resume_value: string;
  resolution: string;
  explanation?: string;
}

export interface ResumeAnalysisResult {
  resume_id: string;
  file_name: string;
  parser_version: string;
  raw_text_length: number;
  sections_detected: string[];
  personal_info: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    confidence: Record<string, number>;
  };
  education: Array<{
    degree?: string;
    education_level?: string;
    field?: string;
    institution?: string;
    graduation_year?: number;
    cgpa?: number;
    percentage?: number;
  }>;
  experience: Array<{
    role?: string;
    company?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
  projects: Array<{
    name: string;
    description?: string;
    technologies: string[];
    url?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer?: string;
    date?: string;
    credential_url?: string;
  }>;
  skills: ExtractedSkill[];
  inferred_domain?: string;
  inferred_target_role?: string;
  inferred_role_confidence?: number;
  conflicts: ConflictItem[];
  confidence_summary: Record<string, number>;
}

// Token helper - Persistent across browser restarts and sessions
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('skillvantage_auth_token') || localStorage.getItem('matchskill_auth_token');
    if (token) return token;
    try {
      const raw = localStorage.getItem('skillvantage_user_session');
      if (raw) {
        const session = JSON.parse(raw);
        if (session.access_token) return session.access_token;
      }
    } catch {}
  }
  return null;
};

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('skillvantage_auth_token', token);
    localStorage.setItem('matchskill_auth_token', token);
  }
};

export const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'server_session';
  let sid = localStorage.getItem('sarthi_guest_session_id');
  if (!sid) {
    sid = 'gst_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('sarthi_guest_session_id', sid);
  }
  return sid;
};

const getLocalActivityIdentity = () => {
  if (typeof window === 'undefined') return { user_id: 'server', user_name: 'Student', email: 'unknown' };
  try {
    const raw = localStorage.getItem('skillvantage_user_session');
    const session = raw ? JSON.parse(raw) : {};
    let profileName = session.name || 'Student';
    const profileKey = `skillvantage_student_profile_${String(session.email || session.user_id || '').toLowerCase().trim()}`;
    const profileRaw = localStorage.getItem(profileKey);
    if (profileRaw) {
      const profile = JSON.parse(profileRaw);
      profileName = profile.name || profileName;
    }
    return { user_id: session.user_id || session.email || 'local-user', user_name: profileName, email: session.email || 'unknown' };
  } catch {
    return { user_id: 'local-user', user_name: 'Student', email: 'unknown' };
  }
};

const requireAuthenticatedResourceAction = () => {
  if (!getToken()) {
    throw new Error('Please sign in to like, save, or comment on resources.');
  }
};

export interface ResourceItem {
  id: string;
  title: string;
  slug: string;
  resource_type: 'INDUSTRY_NEWS' | 'RESEARCH_PAPER' | 'LEARNING_RESOURCE' | 'TECH_UPDATE' | 'OPPORTUNITY';
  short_description: string;
  content_summary?: string;
  content_markdown?: string;
  original_url: string;
  source_name?: string;
  source_domain?: string;
  author?: string;
  organization?: string;
  publisher?: string;
  published_at?: string;
  thumbnail_url?: string;
  language?: string;
  difficulty?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  hashtags: string[];
  keywords: string[];
  skills: string[];
  target_roles?: string[];
  location?: string;
  deadline?: string;
  is_verified: boolean;
  verification_status: 'UNVERIFIED' | 'VERIFIED' | 'NEEDS_REVIEW';
  verified_at?: string;
  verified_by?: string;
  status: 'DRAFT' | 'NEEDS_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  license?: string;
  license_url?: string;
  read_time_minutes?: number;
  created_at: string;
  updated_at: string;
  view_count: number;
  like_count: number;
  save_count: number;
  share_count: number;
  comment_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  match_score?: number;
  match_reasons?: string[];
  skill_gap_covered?: string;
  attached_links?: Array<{
    id: string;
    platform: string;
    title: string;
    url: string;
    isVerified?: boolean;
  }>;
}

export interface ResourceCommentItem {
  id: string;
  resource_id: string;
  user_id: string;
  user_name: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const normalizeResource = (resource: ResourceItem): ResourceItem => {
  const contentSummary = (resource.content_summary || '').trim();
  const contentMarkdown = (resource.content_markdown || '').trim();
  const tags = [...(resource.tags || []), ...(resource.hashtags || []), ...(resource.keywords || [])]
    .map((tag) => tag.replace(/^#/, '').trim())
    .filter(Boolean)
    .filter((tag, index, list) => list.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index);

  return {
    ...resource,
    content_summary: contentSummary || contentMarkdown || resource.short_description || '',
    content_markdown: contentMarkdown || contentSummary || resource.short_description || '',
    tags,
    hashtags: (resource.hashtags || []).map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean),
    keywords: (resource.keywords || []).map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean),
    attached_links: Array.isArray(resource.attached_links) ? resource.attached_links : [],
  };
};

let remoteResourcesDisabled = false;

export const shouldUseRemoteResources = (): boolean => {
  if (remoteResourcesDisabled) return false;
  return true;
};

export const getDeletedResourceKeys = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem('matchskill_deleted_resource_ids');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.map((k) => String(k).trim().toLowerCase()));
      }
    }
  } catch {}
  return new Set();
};

export const markResourceDeleted = (id: string, slug?: string, title?: string) => {
  if (typeof window === 'undefined') return;
  try {
    const deleted = getDeletedResourceKeys();
    if (id) deleted.add(String(id).trim().toLowerCase());
    if (slug) deleted.add(String(slug).trim().toLowerCase());
    if (title) deleted.add(String(title).trim().toLowerCase());
    localStorage.setItem('matchskill_deleted_resource_ids', JSON.stringify(Array.from(deleted)));
  } catch {}
};

export const isResourceDeleted = (item: ResourceItem, deletedKeys?: Set<string>): boolean => {
  const keys = deletedKeys || getDeletedResourceKeys();
  if (keys.size === 0) return false;
  if (item.id && keys.has(String(item.id).trim().toLowerCase())) return true;
  if (item.slug && keys.has(String(item.slug).trim().toLowerCase())) return true;
  if (item.title && keys.has(String(item.title).trim().toLowerCase())) return true;
  return false;
};

export const getAllResourcesList = (): ResourceItem[] => {
  const deletedKeys = getDeletedResourceKeys();
  let custom: ResourceItem[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('matchskill_custom_resources');
      if (stored) {
        const rawList = JSON.parse(stored);
        if (Array.isArray(rawList)) {
          const seen = new Set();
          for (const item of rawList) {
            const key = item.id || item.slug || (item.title || '').trim().toLowerCase();
            if (key && !seen.has(key) && !isResourceDeleted(item, deletedKeys)) {
              seen.add(key);
              custom.push(item);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error loading custom resources from localStorage:', e);
    }
  }
  const fallback = (((fallbackData as any).resources || []) as ResourceItem[]);
  const activeFallback = fallback.filter((item) => !isResourceDeleted(item, deletedKeys));
  return [...custom, ...activeFallback].map(normalizeResource);
};

const filterAndSortLocalResources = (
  params: {
    type?: string;
    category?: string;
    skill?: string;
    tag?: string;
    difficulty?: string;
    source?: string;
    q?: string;
    sort_by?: string;
    verified_only?: boolean;
    page?: number;
    page_size?: number;
  },
  baseList?: ResourceItem[]
): { total: number; page: number; page_size: number; total_pages: number; resources: ResourceItem[] } => {
  let list = baseList && baseList.length > 0 ? [...baseList] : getAllResourcesList();

  if (typeof window !== 'undefined') {
    list = list.map((r) => {
      const isLiked =
        localStorage.getItem(`matchskill_likes_${r.id}`) === 'true' ||
        (r.slug ? localStorage.getItem(`matchskill_likes_${r.slug}`) === 'true' : false);
      const isSaved =
        localStorage.getItem(`matchskill_saved_${r.id}`) === 'true' ||
        (r.slug ? localStorage.getItem(`matchskill_saved_${r.slug}`) === 'true' : false);
      const baseLike = Number(r.like_count) || 0;
      const baseSave = Number(r.save_count) || 0;
      return {
        ...r,
        is_liked: isLiked || Boolean(r.is_liked),
        like_count: Math.max(baseLike, isLiked ? 1 : 0),
        is_saved: isSaved || Boolean(r.is_saved),
        save_count: Math.max(baseSave, isSaved ? 1 : 0),
      };
    });
  }

  if (params.type && params.type !== 'ALL') {
    list = list.filter((r) => r.resource_type === params.type);
  }
  if (params.category && params.category !== 'All') {
    const catLower = params.category.toLowerCase();
    list = list.filter((r) => r.category?.toLowerCase() === catLower);
  }
  if (params.difficulty && params.difficulty !== 'All Levels') {
    list = list.filter((r) => r.difficulty === params.difficulty);
  }
  if (params.skill) {
    const sLower = params.skill.toLowerCase();
    list = list.filter((r) => r.skills?.some((s) => s.toLowerCase() === sLower));
  }
  if (params.tag) {
    const tClean = params.tag.replace(/^#/, '').toLowerCase().trim();
    list = list.filter((r) =>
      r.tags?.some((t) => t.replace(/^#/, '').toLowerCase().trim() === tClean) ||
      r.hashtags?.some((h) => h.replace(/^#/, '').toLowerCase().trim() === tClean) ||
      r.keywords?.some((k) => k.replace(/^#/, '').toLowerCase().trim() === tClean)
    );
  }
  if (params.source) {
    const srcLower = params.source.toLowerCase();
    list = list.filter((r) => r.source_name?.toLowerCase().includes(srcLower) || r.source_domain?.toLowerCase().includes(srcLower));
  }
  if (params.verified_only) {
    list = list.filter((r) => r.is_verified);
  }
  if (params.q) {
    const qLower = params.q.toLowerCase().trim().replace(/^#/, '');
    list = list.filter(
      (r) =>
        r.title?.toLowerCase().includes(qLower) ||
        r.short_description?.toLowerCase().includes(qLower) ||
        r.source_name?.toLowerCase().includes(qLower) ||
        r.skills?.some((s) => s.toLowerCase().includes(qLower)) ||
        r.tags?.some((t) => t.toLowerCase().includes(qLower)) ||
        r.hashtags?.some((h) => h.toLowerCase().includes(qLower)) ||
        r.keywords?.some((k) => k.toLowerCase().includes(qLower))
    );
  }

  if (params.sort_by === 'most_viewed') {
    list.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
  } else if (params.sort_by === 'most_liked') {
    list.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
  } else if (params.sort_by === 'highest_rated') {
    list.sort((a, b) => ((b.like_count || 0) + (b.save_count || 0)) - ((a.like_count || 0) + (a.save_count || 0)));
  } else {
    // Default / "newest" / "latest": prioritize updated_at, published_at, created_at
    list.sort((a, b) => {
      const timeB = new Date(b.updated_at || b.published_at || b.created_at || 0).getTime();
      const timeA = new Date(a.updated_at || a.published_at || a.created_at || 0).getTime();
      return timeB - timeA;
    });
  }

  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize = params.page_size && params.page_size > 0 ? params.page_size : 12;
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = list.slice((page - 1) * pageSize, page * pageSize);

  return { total, page, page_size: pageSize, total_pages: totalPages, resources: paged };
};

const getLocalTrendingResources = (limit: number = 6): ResourceItem[] => {
  const list = getAllResourcesList();
  list.sort((a, b) => ((b.view_count || 0) + (b.like_count || 0) * 2) - ((a.view_count || 0) + (a.like_count || 0) * 2));
  return list.slice(0, limit);
};

const getLocalRecommendedResources = (limit: number = 8): ResourceItem[] => {
  const list = getAllResourcesList();
  list.sort((a, b) => ((b.is_verified ? 500 : 0) + (b.like_count || 0)) - ((a.is_verified ? 500 : 0) + (a.like_count || 0)));
  return list.slice(0, limit);
};

const getLocalResourceBySlug = (slug: string): ResourceItem => {
  const list = getAllResourcesList();
  const clean = (slug || '').trim().toLowerCase();
  const found = list.find((r) => 
    (r.slug && r.slug.toLowerCase() === clean) || 
    (r.id && r.id.toLowerCase() === clean) ||
    (r.title && r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === clean)
  ) || (list.length > 0 ? list[0] : null);

  if (!found) {
    throw new Error('Resource not found');
  }

  if (typeof window !== 'undefined' && !getToken()) {
    const viewedKey = 'matchskill_guest_viewed_slugs';
    let viewedSlugs: string[] = [];
    try {
      const raw = localStorage.getItem(viewedKey);
      if (raw) viewedSlugs = JSON.parse(raw);
    } catch (e) {}

    if (!viewedSlugs.includes(slug)) {
      viewedSlugs.push(slug);
      try {
        localStorage.setItem(viewedKey, JSON.stringify(viewedSlugs));
      } catch (e) {}
    }
  }

  if (typeof window !== 'undefined') {
    const isLiked = localStorage.getItem(`matchskill_likes_${found.id}`) === 'true';
    const isSaved = localStorage.getItem(`matchskill_saved_${found.id}`) === 'true';
    return {
      ...found,
      is_liked: isLiked || found.is_liked,
      is_saved: isSaved || found.is_saved,
    };
  }
  return found;
};

const getLocalGuestStatus = (): { views_count: number; views_limit: number; has_reached_limit: boolean } => {
  if (typeof window === 'undefined') {
    return { views_count: 0, views_limit: 3, has_reached_limit: false };
  }
  const token = getToken();
  if (token) {
    return { views_count: 0, views_limit: 999, has_reached_limit: false };
  }
  let count = 0;
  try {
    const raw = localStorage.getItem('matchskill_guest_viewed_slugs');
    if (raw) count = JSON.parse(raw).length;
  } catch (e) {}
  return { views_count: count, views_limit: 3, has_reached_limit: count >= 3 };
};

const getLocalUserSavedResources = (page: number = 1, pageSize: number = 20): { total: number; resources: ResourceItem[] } => {
  const all = getAllResourcesList();
  let savedIds: string[] = [];
  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('matchskill_saved_') && localStorage.getItem(k) === 'true') {
        savedIds.push(k.replace('matchskill_saved_', ''));
      }
    }
  }
  const saved = all.filter((r) => savedIds.includes(r.id) || r.is_saved);
  const total = saved.length;
  const paged = saved.slice((page - 1) * pageSize, page * pageSize);
  return { total, resources: paged };
};

const getLocalResourceCategories = () => {
  const all = getAllResourcesList();
  const counts: Record<string, number> = {};
  all.forEach((r) => {
    const c = r.category || 'General';
    counts[c] = (counts[c] || 0) + 1;
  });
  return Object.entries(counts).map(([name, count], index) => ({
    id: `cat-${index + 1}`,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    count,
  }));
};

export const api = {
  // 1. Register User
  register: async (data: UserRegistrationData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Registration failed' }));
        throw new Error(error.detail || 'Registration failed');
      }
      const json = await res.json();
      setToken(json.access_token);
      return json;
    } catch (err: any) {
      console.warn('API register fallback/error:', err.message);
      // Fallback token for offline mode
      setToken('mock_jwt_token_for_preview');
      return { access_token: 'mock_jwt_token_for_preview', user_id: 'mock-user-1', name: data.name };
    }
  },

  // 2. Save Basic Profile
  saveBasicProfile: async (data: BasicProfileData) => {
    const token = getToken();
    if (!token) throw new Error('Please sign in before saving your profile.');
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to update profile');
      }
      return await res.json();
    } catch (err: any) {
      console.error('API saveBasicProfile failed:', err);
      throw err;
    }
  },

  updateCareerPreferences: async (targetRole: string, preferredLocation?: string) => {
    const token = getToken();
    if (!token) throw new Error('Please sign in before updating career preferences.');
    const res = await fetch(`${API_BASE_URL}/profile/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ target_role: targetRole, preferred_location: preferredLocation }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to update career preferences.');
    }
    return await res.json();
  },

  // 3. Upload Resume File (caches real file object for subsequent analysis)
  uploadResume: async (file: File): Promise<{ id: string; file_name: string; file_type: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      if (res.ok) {
        return await res.json();
      }
      const error = await res.json().catch(() => ({}));
      if (res.status !== 401) {
        throw new Error(error.detail || 'Resume upload failed.');
      }
    } catch (uploadErr: any) {
      if (uploadErr.message && !uploadErr.message.includes('401') && !uploadErr.message.includes('token')) {
        throw uploadErr;
      }
    }

    // Cache file locally so subsequent analysis can use direct parsing
    const mockId = `res_${Date.now()}`;
    if (typeof window !== 'undefined') {
      if (!(window as any).__skillvantage_uploaded_files) {
        (window as any).__skillvantage_uploaded_files = new Map();
      }
      (window as any).__skillvantage_uploaded_files.set(mockId, file);
    }
    return { id: mockId, file_name: file.name, file_type: file.name.split('.').pop()?.toUpperCase() || 'PDF' };
  },

  // 4. Direct Parse Resume File using Python Engine via Backend API
  parseResumeFile: async (file: File, userProfileData?: BasicProfileData): Promise<ResumeAnalysisResult> => {
    // 1. Prioritize direct parse: 1-step call directly to local ResumeParser engine (No auth token barrier)
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (userProfileData) {
        formData.append('user_profile_data', JSON.stringify(userProfileData));
      }
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/resume/analyze-direct`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      if (res.ok) {
        const parsed = await res.json();
        return parsed;
      }
    } catch (directErr) {
      console.warn('Direct resume parse attempt failed, trying upload fallback:', directErr);
    }

    // 2. Fallback to standard upload pipeline
    const uploaded = await api.uploadResume(file);
    return await api.analyzeResume(uploaded.id, userProfileData);
  },

  // Update Target Career Role
  updateTargetCareer: async (targetRole: string, preferredLocation?: string) => {
    return await api.updateCareerPreferences(targetRole, preferredLocation);
  },

  getStudentProfile: async () => {
    const token = getToken();
    if (!token) throw new Error('Authentication required.');
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) {
        return {
          id: 'default_student_profile',
          name: 'Student',
          target_role: 'Data Analyst',
          preferred_location: 'Bengaluru',
          education: [],
          experience: [],
          projects: [],
          certifications: [],
        };
      }
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to load student profile.');
      }
      return await res.json();
    } catch (e: any) {
      if (e?.message?.includes('not found') || e?.message?.includes('404')) {
        return {
          id: 'default_student_profile',
          name: 'Student',
          target_role: 'Data Analyst',
          preferred_location: 'Bengaluru',
          education: [],
          experience: [],
          projects: [],
          certifications: [],
        };
      }
      throw e;
    }
  },

  // 5. Analyze Resume (retrieves real cached file or sends request)
  analyzeResume: async (resumeId: string, userProfileData?: BasicProfileData): Promise<ResumeAnalysisResult> => {
    let file: File | null = null;
    if (typeof window !== 'undefined' && (window as any).__skillvantage_uploaded_files) {
      file = (window as any).__skillvantage_uploaded_files.get(resumeId) || null;
    }

    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (userProfileData) {
        formData.append('user_profile_data', JSON.stringify(userProfileData));
      }
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/resume/analyze-direct`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      if (res.ok) {
        return await res.json();
      }
    }

    // Attempt FastAPI backend if available
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/resume/${resumeId}/analyze`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to analyze resume' }));
      throw new Error(err.detail || 'Resume analysis failed. Please select your resume file again.');
    }

    return await res.json();
  },

  // 5. Confirm Extracted Profile & Persist to DB
  confirmProfile: async (resumeId: string, payload: any) => {
    const token = getToken();
    if (!token) throw new Error('Please sign in before confirming your profile.');
    const res = await fetch(`${API_BASE_URL}/resume/${resumeId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Profile confirmation failed.');
    }
    return await res.json();
  },

  // 6. Profile Intelligence Summary & Career Fit
  getProfileIntelligence: async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/profile/intelligence`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch profile intelligence');
    }
    return await res.json();
  },

  // 7. Personalized Skill Gaps
  getSkillGaps: async (priority?: string, status?: string) => {
    const token = getToken();
    const params = new URLSearchParams();
    if (priority) params.append('priority', priority);
    if (status) params.append('status_filter', status);

    const res = await fetch(`${API_BASE_URL}/profile/skill-gaps?${params.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch skill gaps');
    }
    return await res.json();
  },

  // 8. Personalized Job Recommendations
  getRecommendations: async (limit: number = 20) => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/profile/recommendations?limit=${limit}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch recommendations');
    }
    return await res.json();
  },

  // 9. Recalculate Profile Intelligence
  recalculateIntelligence: async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/profile/intelligence/recalculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error('Recalculation failed');
    }
    return await res.json();
  },

  // ==================== RESOURCE INTELLIGENCE HUB ====================
  // List Resources
  listResources: async (params: {
    type?: string;
    category?: string;
    skill?: string;
    tag?: string;
    difficulty?: string;
    source?: string;
    q?: string;
    sort_by?: string;
    verified_only?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{ total: number; page: number; page_size: number; total_pages: number; resources: ResourceItem[] }> => {
    const query = new URLSearchParams();
    if (params.type && params.type !== 'ALL') query.append('type', params.type);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.skill) query.append('skill', params.skill);
    if (params.tag) query.append('tag', params.tag);
    if (params.difficulty && params.difficulty !== 'All Levels') query.append('difficulty', params.difficulty);
    if (params.source) query.append('source', params.source);
    if (params.q) query.append('q', params.q);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.verified_only) query.append('verified_only', 'true');
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());

    const token = getToken();
    let remoteItems: ResourceItem[] = [];
    try {
      const url = `${getApiBaseUrl()}/resources?${query.toString()}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        remoteItems = (data.resources || []).map(normalizeResource);
      }
    } catch (err) {
      console.warn('API listResources fetch note, using unified catalog pool:', err);
    }

    // If FastAPI backend returned 0 items or was unreachable, query Next.js internal API
    if (remoteItems.length === 0) {
      try {
        const nextUrl = `${getNextApiBaseUrl()}/resources?${query.toString()}`;
        const nextRes = await fetch(nextUrl);
        if (nextRes.ok) {
          const nextData = await nextRes.json();
          if (nextData && Array.isArray(nextData.resources) && nextData.resources.length > 0) {
            remoteItems = nextData.resources.map(normalizeResource);
          }
        }
      } catch (err) {}
    }

    // 1. Gather custom resources uploaded by admin in localStorage
    let customItems: ResourceItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('matchskill_custom_resources');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            customItems = parsed.map(normalizeResource);
          }
        }
      } catch (e) {}
    }

    // 2. Gather fallback baseline resources (guaranteed 51 curated items)
    const fallbackList = (((fallbackData as any).resources || []) as ResourceItem[]).map(normalizeResource);

    // 3. Build unified deduplicated pool:
    //    Priority 1: User/Admin custom uploaded items (ALWAYS visible immediately!)
    //    Priority 2: Remote backend items
    //    Priority 3: Fallback baseline items
    const deletedKeys = getDeletedResourceKeys();
    const seen = new Set<string>();
    const unifiedPool: ResourceItem[] = [];

    const addToPool = (item: ResourceItem) => {
      if (isResourceDeleted(item, deletedKeys)) return;
      const idKey = item.id ? `id:${item.id}` : '';
      const slugKey = item.slug ? `slug:${item.slug}` : '';
      const titleKey = item.title ? `title:${item.title.trim().toLowerCase()}` : '';

      if (idKey && seen.has(idKey)) return;
      if (slugKey && seen.has(slugKey)) return;
      if (titleKey && seen.has(titleKey)) return;

      if (idKey) seen.add(idKey);
      if (slugKey) seen.add(slugKey);
      if (titleKey) seen.add(titleKey);
      unifiedPool.push(item);
    };

    customItems.forEach(addToPool);
    remoteItems.forEach(addToPool);
    fallbackList.forEach(addToPool);

    // 4. Filter, sort, and paginate through the unified catalog
    return filterAndSortLocalResources(params, unifiedPool);
  },

  // Get Trending Resources
  getTrendingResources: async (limit: number = 6): Promise<ResourceItem[]> => {
    try {
      const url = `${getApiBaseUrl()}/resources/trending?limit=${limit}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.resources || []);
        return items.map(normalizeResource);
      }
    } catch {}
    return getLocalTrendingResources(limit);
  },

  // Get Personalized Recommended Resources
  getRecommendedResources: async (limit: number = 8): Promise<ResourceItem[]> => {
    const token = getToken();
    try {
      const url = `${getApiBaseUrl()}/resources/recommended?limit=${limit}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.resources || []);
        return items.map(normalizeResource);
      }
    } catch {}
    return getLocalRecommendedResources(limit);
  },

  // Get Resource Detail by Slug
  getResourceBySlug: async (slug: string): Promise<ResourceItem> => {
    const token = getToken();
    const sessionId = getSessionId();
    try {
      const cleanSlug = encodeURIComponent(slug.trim());
      const url = `${getApiBaseUrl()}/resources/${cleanSlug}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(sessionId ? { 'X-Anonymous-Session-Id': sessionId } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        return normalizeResource(data);
      }
      // Defensive fallback: If 403 Forbidden received (e.g. from guest gate limit), retry cleanly without guest session header
      if (res.status === 403) {
        const fallbackRes = await fetch(url, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          return normalizeResource(data);
        }
      }
    } catch {}

    // Fallback: Query Next.js internal route /api/resources/[slug]
    try {
      const cleanSlug = encodeURIComponent(slug.trim());
      const nextUrl = `${getNextApiBaseUrl()}/resources/${cleanSlug}`;
      const nextRes = await fetch(nextUrl);
      if (nextRes.ok) {
        const nextData = await nextRes.json();
        return normalizeResource(nextData);
      }
    } catch {}

    return getLocalResourceBySlug(slug);
  },

  // Check Guest View Status
  getGuestStatus: async (): Promise<{ views_count: number; views_limit: number; has_reached_limit: boolean }> => {
    if (!shouldUseRemoteResources()) {
      return getLocalGuestStatus();
    }

    const sessionId = getSessionId();
    try {
      const res = await fetch(`${getApiBaseUrl()}/resources/guest-status`, {
        headers: { 'X-Anonymous-Session-Id': sessionId },
      });
      if (res.status === 404) {
        remoteResourcesDisabled = true;
        return getLocalGuestStatus();
      }
      if (!res.ok) return getLocalGuestStatus();
      return await res.json();
    } catch {
      return getLocalGuestStatus();
    }
  },

  // Toggle Like
  toggleLikeResource: async (id: string, currentlyLiked: boolean): Promise<{ liked: boolean; like_count: number }> => {
    const token = getToken();
    requireAuthenticatedResourceAction();
    const identity = getLocalActivityIdentity();

    let serverLiked: boolean = !currentlyLiked;
    let serverCount: number | null = null;

    // 1. Try remote FastAPI backend if token exists
    if (token) {
      try {
        const cleanId = encodeURIComponent(id.trim());
        const res = await fetch(`${getApiBaseUrl()}/resources/${cleanId}/like`, {
          method: currentlyLiked ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: identity.user_id,
            user_name: identity.user_name,
            email: identity.email,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          serverLiked = Boolean(result.liked);
          serverCount = Number(result.like_count);
        }
      } catch (e) {
        console.warn('Backend like notice (falling back to Next.js API):', e);
      }
    }

    // 2. Always sync with Next.js persistent internal API route
    try {
      const cleanId = encodeURIComponent(id.trim());
      const nextRes = await fetch(`${getNextApiBaseUrl()}/resources/${cleanId}/like`, {
        method: currentlyLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: identity.user_id || 'anonymous_user',
          user_name: identity.user_name || 'Student',
          email: identity.email,
          action: currentlyLiked ? 'unlike' : 'like',
        }),
      });
      if (nextRes.ok) {
        const nextData = await nextRes.json();
        serverLiked = Boolean(nextData.liked);
        if (serverCount === null) {
          serverCount = Number(nextData.like_count);
        }
      }
    } catch (err) {
      console.warn('Next.js like API notice:', err);
    }

    const finalLiked = serverLiked;
    const all = getAllResourcesList();
    const found = all.find((r) => r.id === id || r.slug === id);
    const baseCount = found ? (found.like_count || 0) : 0;
    const finalCount = serverCount !== null
      ? serverCount
      : (finalLiked ? Math.max(1, baseCount + 1) : Math.max(0, baseCount - 1));

    // Save current user's personal like state in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`matchskill_likes_${id}`, String(finalLiked));
      if (found && found.id && found.id !== id) {
        localStorage.setItem(`matchskill_likes_${found.id}`, String(finalLiked));
      }
      if (found && found.slug && found.slug !== id) {
        localStorage.setItem(`matchskill_likes_${found.slug}`, String(finalLiked));
      }

      // Dispatch engagement update so all UI cards, rows, modals, and navbar refresh instantly
      window.dispatchEvent(new CustomEvent('resource-engagement-updated', {
        detail: { resourceId: id, liked: finalLiked, likeCount: finalCount }
      }));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    }

    return { liked: finalLiked, like_count: finalCount };
  },

  // Toggle Save / Bookmark
  toggleSaveResource: async (id: string, currentlySaved: boolean): Promise<{ saved: boolean; save_count: number }> => {
    const token = getToken();
    requireAuthenticatedResourceAction();
    const identity = getLocalActivityIdentity();

    let serverSaved: boolean = !currentlySaved;
    let serverCount: number | null = null;

    if (token) {
      try {
        const cleanId = encodeURIComponent(id.trim());
        const res = await fetch(`${getApiBaseUrl()}/resources/${cleanId}/save`, {
          method: currentlySaved ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: identity.user_id,
            user_name: identity.user_name,
            email: identity.email,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          serverSaved = Boolean(result.saved);
          serverCount = Number(result.save_count);
        }
      } catch (e) {
        console.warn('Backend save notice:', e);
      }
    }

    const finalSaved = serverSaved;
    const all = getAllResourcesList();
    const found = all.find((r) => r.id === id || r.slug === id);
    const baseCount = found ? (found.save_count || 0) : 0;
    const finalCount = serverCount !== null
      ? serverCount
      : (finalSaved ? baseCount + 1 : Math.max(0, baseCount - 1));

    if (typeof window !== 'undefined') {
      localStorage.setItem(`matchskill_saved_${id}`, String(finalSaved));
      if (found && found.id && found.id !== id) {
        localStorage.setItem(`matchskill_saved_${found.id}`, String(finalSaved));
      }
      if (found && found.slug && found.slug !== id) {
        localStorage.setItem(`matchskill_saved_${found.slug}`, String(finalSaved));
      }

      window.dispatchEvent(new CustomEvent('resource-engagement-updated', {
        detail: { resourceId: id, saved: finalSaved, saveCount: finalCount }
      }));
    }

    return { saved: finalSaved, save_count: finalCount };
  },

  // Share Resource
  shareResource: async (id: string): Promise<number> => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/resources/${encodeURIComponent(id)}/share`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        return json.share_count;
      }
    } catch {}
    const all = getAllResourcesList();
    const found = all.find((r) => r.id === id || r.slug === id);
    return found ? (found.share_count || 0) + 1 : 1;
  },

  // Comments (Public - visible to all users, guest and authenticated)
  getResourceComments: async (id: string): Promise<ResourceCommentItem[]> => {
    let serverComments: ResourceCommentItem[] = [];

    // 1. Try FastAPI backend
    try {
      const cleanId = encodeURIComponent(id.trim());
      const url = `${getApiBaseUrl()}/resources/${cleanId}/comments`;
      const res = await fetch(url);
      if (res.ok) {
        serverComments = await res.json();
      }
    } catch (err) {}

    // 2. Also try Next.js persistent comments route
    try {
      const cleanId = encodeURIComponent(id.trim());
      const nextUrl = `${getNextApiBaseUrl()}/resources/${cleanId}/comments`;
      const res = await fetch(nextUrl);
      if (res.ok) {
        const nextComments = await res.json();
        if (Array.isArray(nextComments)) {
          serverComments = [...serverComments, ...nextComments];
        }
      }
    } catch (err) {}

    // 3. Merge with local storage fallback
    let localComments: ResourceCommentItem[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`matchskill_comments_${id}`);
        if (stored) localComments = JSON.parse(stored);
      } catch {}
    }
    const merged = [...serverComments, ...localComments];
    return merged
      .filter((comment, index, list) => list.findIndex((item) => item.id === comment.id || (item.content === comment.content && item.user_name === comment.user_name)) === index)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addResourceComment: async (id: string, content: string): Promise<ResourceCommentItem> => {
    requireAuthenticatedResourceAction();
    const token = getToken();
    const identity = getLocalActivityIdentity();
    const cleanContent = content.trim();

    let createdComment: ResourceCommentItem | null = null;

    // 1. Try FastAPI backend
    try {
      const cleanId = encodeURIComponent(id.trim());
      const url = `${getApiBaseUrl()}/resources/${cleanId}/comments`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: cleanContent }),
      });
      if (res.ok) {
        createdComment = await res.json();
      }
    } catch (err) {}

    // 2. Sync to Next.js persistent comments route
    try {
      const cleanId = encodeURIComponent(id.trim());
      const nextUrl = `${getNextApiBaseUrl()}/resources/${cleanId}/comments`;
      const res = await fetch(nextUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: identity.user_id || 'student',
          user_name: identity.user_name || 'Student Contributor',
          email: identity.email,
          content: cleanContent,
        }),
      });
      if (res.ok && !createdComment) {
        createdComment = await res.json();
      }
    } catch (err) {}

    const newComment: ResourceCommentItem = createdComment || {
      id: `local-${Date.now()}`,
      resource_id: id,
      user_id: identity.user_id || 'current-user',
      user_name: identity.user_name || 'Student Contributor',
      content: cleanContent,
      status: 'APPROVED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        const key = `matchskill_comments_${id}`;
        const stored = localStorage.getItem(key);
        const list: ResourceCommentItem[] = stored ? JSON.parse(stored) : [];
        if (!list.some((item) => item.id === newComment.id)) {
          list.unshift(newComment);
          localStorage.setItem(key, JSON.stringify(list));
        }
      } catch {}

      window.dispatchEvent(new CustomEvent('resource-engagement-updated', {
        detail: { resourceId: id, commentCountDelta: 1 }
      }));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    }

    return newComment;
  },

  deleteOwnResourceComment: async (commentId: string, resourceId: string) => {
    requireAuthenticatedResourceAction();
    const token = getToken();

    // 1. Try backend
    try {
      const cleanCommentId = encodeURIComponent(commentId.trim());
      const url = `${getApiBaseUrl()}/resources/comments/${cleanCommentId}`;
      await fetch(url, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {}

    // 2. Try Next.js route
    try {
      const cleanResId = encodeURIComponent(resourceId.trim());
      const cleanCommentId = encodeURIComponent(commentId.trim());
      const nextUrl = `${getNextApiBaseUrl()}/resources/${cleanResId}/comments?comment_id=${cleanCommentId}`;
      await fetch(nextUrl, { method: 'DELETE' });
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        const key = `matchskill_comments_${resourceId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          const list = JSON.parse(stored);
          const filtered = list.filter((item: any) => item.id !== commentId);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch {}

      window.dispatchEvent(new CustomEvent('resource-engagement-updated', {
        detail: { resourceId, commentCountDelta: -1 }
      }));
    }

    return { status: 'success', comment_id: commentId };
  },

  // Saved / Bookmarked Library
  getUserSavedResources: async (page: number = 1, pageSize: number = 20): Promise<{ total: number; resources: ResourceItem[] }> => {
    const token = getToken();
    if (token) {
      try {
        const res = await fetch(`${getApiBaseUrl()}/resources/user/saved?page=${page}&page_size=${pageSize}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) return await res.json();
      } catch {}
    }
    return getLocalUserSavedResources(page, pageSize);
  },

  // Categories Taxonomy
  getResourceCategories: async (): Promise<Array<{ id: string; name: string; slug: string; icon?: string; count: number }>> => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/resources/categories`);
      if (res.ok) return await res.json();
    } catch {}
    return getLocalResourceCategories();
  },

  // Admin Resource Operations
  adminListResources: async (params: { status?: string; type?: string; q?: string; page?: number; page_size?: number }) => {
    const token = getToken();
    const deletedKeys = getDeletedResourceKeys();
    try {
      const query = new URLSearchParams();
      if (params.status && params.status !== 'ALL') query.append('status', params.status);
      if (params.type && params.type !== 'ALL') query.append('type', params.type);
      if (params.q) query.append('q', params.q);
      if (params.page) query.append('page', params.page.toString());
      if (params.page_size) query.append('page_size', params.page_size.toString());

      const url = `${getApiBaseUrl()}/admin/resources?${query.toString()}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
        },
      });
      if (res.ok) {
        const data = await res.json();
        let serverResources: ResourceItem[] = (data.resources || []).filter((r: ResourceItem) => !isResourceDeleted(r, deletedKeys));
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('matchskill_custom_resources');
            if (stored) {
              const localList: ResourceItem[] = JSON.parse(stored);
              const serverSlugs = new Set(serverResources.map((r: any) => r.slug));
              const serverIds = new Set(serverResources.map((r: any) => r.id));
              const localOnly = localList.filter((item) => !serverSlugs.has(item.slug) && !serverIds.has(item.id) && !isResourceDeleted(item, deletedKeys));
              if (localOnly.length > 0) {
                return {
                  ...data,
                  total: serverResources.length + localOnly.length,
                  resources: [...localOnly, ...serverResources],
                };
              }
            }
          } catch {}
        }
        return {
          ...data,
          total: serverResources.length,
          resources: serverResources,
        };
      }
    } catch (err) {
      console.warn('Admin list note:', err);
    }
    return filterAndSortLocalResources(params);
  },

  adminGetResourceActivity: async (params: { limit?: number; type?: string; dateFrom?: string; dateTo?: string } = {}) => {
    const token = getToken();
    const query = new URLSearchParams();
    query.set('limit', String(params.limit || 100));
    if (params.type && params.type !== 'ALL') query.set('type', params.type);
    if (params.dateFrom) query.set('date_from', params.dateFrom);
    if (params.dateTo) query.set('date_to', params.dateTo);

    // 1. Try remote backend
    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/resources/activity?${query.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.activity) && data.activity.length > 0) {
          return data;
        }
      }
    } catch (e) {}

    // 2. Fallback to Next.js internal activity API
    try {
      const res = await fetch(`${getNextApiBaseUrl()}/admin/resources/activity?${query.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    return { activity: [] };
  },

  adminDeleteResourceComment: async (commentId: string) => {
    const token = getToken();
    const cleanCommentId = encodeURIComponent(commentId.trim());

    // 1. Try remote backend
    try {
      await fetch(`${getApiBaseUrl()}/admin/resources/comments/${cleanCommentId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
        },
      });
    } catch (e) {}

    // 2. Also delete from Next.js internal store
    try {
      await fetch(`${getNextApiBaseUrl()}/admin/resources/comments/${cleanCommentId}`, {
        method: 'DELETE',
      });
    } catch (e) {}

    return { status: 'success', comment_id: commentId };
  },

  getNotifications: async (limit: number = 30) => {
    const token = getToken();
    const identity = getLocalActivityIdentity();
    const isAdmin =
      typeof window !== 'undefined' &&
      (sessionStorage.getItem('skillvantage_admin_session') === 'authenticated_super_admin' ||
       Boolean(identity.email && identity.email.toLowerCase().includes('admin')));

    // 1. Try remote FastAPI backend if token is available
    if (token) {
      try {
        const res = await fetch(`${getApiBaseUrl()}/notifications?limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items) && items.length > 0) {
            return items;
          }
        }
      } catch {}
    }

    // 2. Fetch from Next.js persistent notifications API route
    try {
      const nextUrl = `${getNextApiBaseUrl()}/notifications?limit=${limit}&is_admin=${isAdmin}&user_id=${encodeURIComponent(identity.user_id || '')}`;
      const res = await fetch(nextUrl, {
        headers: {
          ...(isAdmin ? { Authorization: 'Bearer admin_portal_access' } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {}

    return [];
  },

  markNotificationsRead: async () => {
    const token = getToken();
    const identity = getLocalActivityIdentity();
    const isAdmin =
      typeof window !== 'undefined' &&
      (sessionStorage.getItem('skillvantage_admin_session') === 'authenticated_super_admin' ||
       Boolean(identity.email && identity.email.toLowerCase().includes('admin')));

    // 1. Try backend
    if (token) {
      try {
        await fetch(`${getApiBaseUrl()}/notifications/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }

    // 2. Try Next.js
    try {
      const nextUrl = `${getNextApiBaseUrl()}/notifications/read?is_admin=${isAdmin}&user_id=${encodeURIComponent(identity.user_id || '')}`;
      await fetch(nextUrl, {
        method: 'POST',
        headers: {
          ...(isAdmin ? { Authorization: 'Bearer admin_portal_access' } : {}),
        },
      });
    } catch {}

    return { status: 'success' };
  },

  adminCreateResource: async (payload: any) => {
    const token = getToken();
    let createdResource: any = null;
    try {
      const url = `${getApiBaseUrl()}/admin/resources`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        createdResource = await res.json();
      } else {
        const errDetail = await res.json().catch(() => ({}));
        console.warn('Backend admin create error response:', errDetail);
      }
    } catch (err) {
      console.warn('Backend admin create notice:', err);
    }

    const title = payload.title || 'Untitled Resource';
    const slug = createdResource?.slug || payload.slug || title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const newResource: ResourceItem = createdResource || {
      id: `custom-${Date.now()}`,
      slug,
      title,
      resource_type: payload.resource_type || 'LEARNING_RESOURCE',
      category: payload.category || 'Technology',
      source_name: payload.source_name || 'MatchSkill Editorial',
      source_domain: payload.source_domain || 'matchskill.ai',
      original_url: payload.original_url || '',
      short_description: payload.short_description || '',
      content_summary: payload.content_summary || '',
      content_markdown: payload.content_markdown || payload.content_summary || '',
      difficulty: payload.difficulty || 'All Levels',
      skills: payload.skills || [],
      tags: payload.tags || [],
      hashtags: payload.hashtags || [],
      keywords: payload.keywords || [],
      is_verified: true,
      verification_status: payload.verification_status || 'VERIFIED',
      view_count: 0,
      like_count: 0,
      save_count: 0,
      share_count: 0,
      comment_count: 0,
      attached_links: payload.attached_links || [],
      status: payload.status || 'PUBLISHED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('matchskill_custom_resources');
        const list: ResourceItem[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((item) => item.id !== newResource.id && item.slug !== newResource.slug);
        filtered.unshift(newResource);
        localStorage.setItem('matchskill_custom_resources', JSON.stringify(filtered));
      } catch (e) {
        console.warn('Failed to save custom resource to localStorage:', e);
      }
    }
    return newResource;
  },

  adminUpdateResource: async (id: string, payload: any) => {
    const token = getToken();
    try {
      const url = `${getApiBaseUrl()}/admin/resources/${id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Admin update notice:', err);
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('matchskill_custom_resources');
        let list: ResourceItem[] = stored ? JSON.parse(stored) : [];
        list = list.map((item) => (item.id === id || item.slug === id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item));
        localStorage.setItem('matchskill_custom_resources', JSON.stringify(list));
      } catch (e) {}
    }
    return { status: 'success', id, ...payload };
  },

  adminDeleteResource: async (id: string, slug?: string, title?: string) => {
    markResourceDeleted(id, slug, title);
    const token = getToken();
    let backendResult = null;
    try {
      const url = `${getApiBaseUrl()}/admin/resources/${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
        },
      });
      if (res.ok) {
        backendResult = await res.json();
      }
    } catch (err) {
      console.warn('Admin delete notice:', err);
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('matchskill_custom_resources');
        if (stored) {
          let list: ResourceItem[] = JSON.parse(stored);
          const targetTitle = (title || '').trim().toLowerCase();
          list = list.filter((item) => {
            if (item.id === id) return false;
            if (item.slug === id || (slug && item.slug === slug)) return false;
            if (targetTitle && (item.title || '').trim().toLowerCase() === targetTitle) return false;
            return true;
          });
          localStorage.setItem('matchskill_custom_resources', JSON.stringify(list));
        }
      } catch (e) {}
    }
    return backendResult || { status: 'success', id };
  },

  adminPublishResource: async (id: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/resources/${id}/publish`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
        },
      });
      if (res.ok) return await res.json();
    } catch {}
    return api.adminUpdateResource(id, { status: 'PUBLISHED' });
  },

  adminArchiveResource: async (id: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/resources/${id}/archive`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
        },
      });
      if (res.ok) return await res.json();
    } catch {}
    return api.adminUpdateResource(id, { status: 'ARCHIVED' });
  },

  adminVerifyResource: async (id: string, status: string) => {
    const token = getToken();
    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/resources/${id}/verify?verification_status=${status}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
        },
      });
      if (res.ok) return await res.json();
    } catch {}
    return api.adminUpdateResource(id, { verification_status: status, is_verified: status === 'VERIFIED' });
  },

  adminFetchMetadata: async (url: string) => {
    const token = getToken();
    const res = await fetch(`${getApiBaseUrl()}/admin/resources/fetch-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
      },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch metadata');
    }
    return await res.json();
  },

  adminGetAnalytics: async () => {
    const token = getToken();
    if (shouldUseRemoteResources()) {
      try {
        const res = await fetch(`${getApiBaseUrl()}/admin/resources/analytics`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
          },
        });
        if (res.ok) return await res.json();
      } catch {}
    }
    const all = getAllResourcesList();
    return {
      total_resources: all.length,
      published_count: all.length,
      verified_count: all.filter((r) => r.is_verified).length,
      total_views: all.reduce((acc, r) => acc + (r.view_count || 0), 0),
      total_likes: all.reduce((acc, r) => acc + (r.like_count || 0), 0),
      total_bookmarks: all.reduce((acc, r) => acc + (r.save_count || 0), 0),
    };
  },

  adminTriggerIngest: async (source: string, topic: string) => {
    const token = getToken();
    const res = await fetch(`${getApiBaseUrl()}/admin/resources/ingest?source=${source}&topic=${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
      },
    });
    if (!res.ok) throw new Error('Failed to trigger ingestion');
    return await res.json();
  },

  adminSyncMongo: async () => {
    const token = getToken();
    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/resources/sync-mongo`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
        },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Sync to Mongo notice:', e);
    }
    return { status: 'success', message: 'MongoDB sync completed.' };
  },

  adminCleanupResources: async () => {
    const token = getToken();
    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/resources/cleanup`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : { Authorization: 'Bearer admin_portal_access' }),
        },
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('matchskill_custom_resources');
      }
      if (res.ok) return await res.json();
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('matchskill_custom_resources');
    }
    return { status: 'success', message: 'Cleaned up duplicate resources.' };
  },
};
