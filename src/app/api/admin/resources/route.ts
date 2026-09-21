import { NextResponse } from 'next/server';
import { getStoredResources, replaceStoredResources } from '@/lib/resourceStore';

export const dynamic = 'force-dynamic';

function getStoredData(): any[] {
  return getStoredResources();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const q = searchParams.get('q');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.max(1, parseInt(searchParams.get('page_size') || '20', 10));

    let list = getStoredData();

    if (status && status !== 'ALL') {
      list = list.filter((r) => r.status === status);
    }
    if (type && type !== 'ALL') {
      list = list.filter((r) => r.resource_type === type);
    }
    if (q) {
      const qLower = q.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(qLower) ||
          r.short_description?.toLowerCase().includes(qLower) ||
          r.tags?.some((t: string) => t.toLowerCase().includes(qLower))
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const resources = getStoredData();

    const title = payload.title || 'Untitled Resource';
    const slug =
      payload.slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
        '-' +
        Date.now().toString(36);

    const newResource = {
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

    const filtered = resources.filter((r) => r.id !== newResource.id && r.slug !== newResource.slug);
    filtered.unshift(newResource);
    replaceStoredResources(filtered);

    return NextResponse.json(newResource, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
