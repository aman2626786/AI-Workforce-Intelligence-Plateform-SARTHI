import { NextResponse } from 'next/server';
import { getStoredResources, replaceStoredResources } from '@/lib/resourceStore';
import { getLikesForResource } from '@/lib/resourceLikeStore';
import { getCommentsForResource } from '@/lib/resourceCommentStore';

export const dynamic = 'force-dynamic';

export interface StoredResource {
  id: string;
  title: string;
  slug: string;
  resource_type: string;
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
  verification_status: string;
  status: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  like_count: number;
  save_count: number;
  share_count: number;
  comment_count: number;
  attached_links?: Array<{
    id: string;
    platform: string;
    title: string;
    url: string;
  }>;
}

function getStoredData(): { total: number; resources: StoredResource[] } {
  const resources = getStoredResources() as StoredResource[];
  return { total: resources.length, resources };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const skill = searchParams.get('skill');
    const tag = searchParams.get('tag');
    const difficulty = searchParams.get('difficulty');
    const source = searchParams.get('source');
    const q = searchParams.get('q');
    const sortBy = searchParams.get('sort_by') || 'latest';
    const verifiedOnly = searchParams.get('verified_only') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(searchParams.get('page_size') || '12', 10));

    const { resources: allResources } = getStoredData();
    let list = allResources.map((r) => {
      const likes = getLikesForResource(r.id);
      const comments = getCommentsForResource(r.id);
      return {
        ...r,
        like_count: Math.max(Number(r.like_count) || 0, likes.total),
        comment_count: Math.max(Number(r.comment_count) || 0, comments.length),
      };
    });

    // Filter by type
    if (type && type !== 'ALL') {
      list = list.filter((r) => r.resource_type === type);
    }

    // Filter by category
    if (category && category !== 'All') {
      const catLower = category.toLowerCase();
      list = list.filter((r) => r.category?.toLowerCase() === catLower);
    }

    // Filter by difficulty
    if (difficulty && difficulty !== 'All Levels') {
      list = list.filter((r) => r.difficulty === difficulty);
    }

    // Filter by skill
    if (skill) {
      const sLower = skill.toLowerCase();
      list = list.filter((r) => r.skills?.some((s) => s.toLowerCase() === sLower));
    }

    // Filter by tag
    if (tag) {
      const tClean = tag.replace(/^#/, '').toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.tags?.some((t) => t.replace(/^#/, '').toLowerCase().trim() === tClean) ||
          r.hashtags?.some((h) => h.replace(/^#/, '').toLowerCase().trim() === tClean) ||
          r.keywords?.some((k) => k.toLowerCase().includes(tClean))
      );
    }

    // Filter by source
    if (source) {
      const srcLower = source.toLowerCase();
      list = list.filter(
        (r) =>
          r.source_name?.toLowerCase().includes(srcLower) ||
          r.source_domain?.toLowerCase().includes(srcLower)
      );
    }

    // Filter verified
    if (verifiedOnly) {
      list = list.filter((r) => r.is_verified);
    }

    // Search query
    if (q) {
      const qLower = q.toLowerCase().trim().replace(/^#/, '');
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

    // Sort
    if (sortBy === 'most_viewed') {
      list.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    } else if (sortBy === 'most_liked') {
      list.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
    } else if (sortBy === 'highest_rated') {
      list.sort((a, b) => (b.like_count || 0) + (b.save_count || 0) - ((a.like_count || 0) + (a.save_count || 0)));
    } else {
      // Default: latest / newest
      list.sort(
        (a, b) =>
          new Date(b.published_at || b.created_at || 0).getTime() -
          new Date(a.published_at || a.created_at || 0).getTime()
      );
    }

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const paged = list.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
      resources: paged,
    });
  } catch (err: any) {
    console.error('GET /api/resources error:', err);
    return NextResponse.json({ total: 0, page: 1, page_size: 12, total_pages: 1, resources: [] });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { resources } = getStoredData();

    const title = payload.title || 'Untitled Resource';
    const slug =
      payload.slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
        '-' +
        Date.now().toString(36);

    const newResource: StoredResource = {
      id: payload.id || `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      slug,
      resource_type: payload.resource_type || 'LEARNING_RESOURCE',
      category: payload.category || 'Technology',
      subcategory: payload.subcategory || '',
      source_name: payload.source_name || 'MatchSkill Editorial',
      source_domain: payload.source_domain || 'matchskill.ai',
      original_url: payload.original_url || '',
      short_description: payload.short_description || '',
      content_summary: payload.content_summary || payload.short_description || '',
      content_markdown: payload.content_markdown || payload.content_summary || payload.short_description || '',
      difficulty: payload.difficulty || 'All Levels',
      skills: Array.isArray(payload.skills) ? payload.skills : [],
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      hashtags: Array.isArray(payload.hashtags) ? payload.hashtags : [],
      keywords: Array.isArray(payload.keywords) ? payload.keywords : [],
      target_roles: Array.isArray(payload.target_roles) ? payload.target_roles : [],
      is_verified: payload.is_verified !== false,
      verification_status: payload.verification_status || 'VERIFIED',
      status: payload.status || 'PUBLISHED',
      view_count: payload.view_count || 0,
      like_count: payload.like_count || 0,
      save_count: payload.save_count || 0,
      share_count: payload.share_count || 0,
      comment_count: payload.comment_count || 0,
      attached_links: Array.isArray(payload.attached_links) ? payload.attached_links : [],
      thumbnail_url: payload.thumbnail_url || undefined,
      created_at: payload.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: payload.published_at || new Date().toISOString(),
    };

    // Remove existing if matching id or slug
    const filtered = resources.filter((r) => r.id !== newResource.id && r.slug !== newResource.slug);
    filtered.unshift(newResource);

    replaceStoredResources(filtered);

    return NextResponse.json(newResource, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/resources error:', err);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}
