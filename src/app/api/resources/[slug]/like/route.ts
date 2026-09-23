import { NextResponse } from 'next/server';
import { getLikesForResource, checkUserLiked, toggleLikeForResource } from '@/lib/resourceLikeStore';
import { getStoredResources } from '@/lib/resourceStore';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || '';

    const resources = getStoredResources();
    const resource = resources.find(
      (r: any) => r.slug === slug || r.id === slug || (r.slug && slug && (r.slug.startsWith(slug) || slug.startsWith(r.slug)))
    );
    const targetId = resource ? resource.id : slug;
    const targetSlug = resource?.slug || slug;

    const { total } = getLikesForResource(targetId);
    const userLiked = userId ? (checkUserLiked(targetId, userId) || checkUserLiked(targetSlug, userId)) : false;

    return NextResponse.json({
      liked: userLiked,
      like_count: Math.max(total, resource?.like_count || 0),
    });
  } catch (err: any) {
    return NextResponse.json({ liked: false, like_count: 0 }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => ({}));
    const resources = getStoredResources();
    const resource = resources.find(
      (r: any) => r.slug === slug || r.id === slug || (r.slug && slug && (r.slug.startsWith(slug) || slug.startsWith(r.slug)))
    );
    const targetId = resource ? resource.id : slug;

    const result = toggleLikeForResource({
      resource_id: targetId,
      resource_title: resource?.title || 'Resource',
      resource_slug: resource?.slug || slug,
      user_id: body.user_id || 'anonymous_user',
      user_name: body.user_name || 'Student',
      email: body.email,
      forceAction: body.action || undefined,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const userId = body.user_id || searchParams.get('user_id') || 'anonymous_user';

    const resources = getStoredResources();
    const resource = resources.find(
      (r: any) => r.slug === slug || r.id === slug || (r.slug && slug && (r.slug.startsWith(slug) || slug.startsWith(r.slug)))
    );
    const targetId = resource ? resource.id : slug;

    const result = toggleLikeForResource({
      resource_id: targetId,
      resource_title: resource?.title || 'Resource',
      resource_slug: resource?.slug || slug,
      user_id: userId,
      user_name: body.user_name || 'Student',
      email: body.email,
      forceAction: 'unlike',
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to unlike resource' }, { status: 500 });
  }
}
