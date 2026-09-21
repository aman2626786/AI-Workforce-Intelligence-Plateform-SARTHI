import { NextResponse } from 'next/server';
import { getStoredResources, replaceStoredResources } from '@/lib/resourceStore';
import { getLikesForResource } from '@/lib/resourceLikeStore';
import { getCommentsForResource } from '@/lib/resourceCommentStore';

export const dynamic = 'force-dynamic';

function getStoredData(): any[] {
  return getStoredResources();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const resources = getStoredData();
    const found = resources.find(
      (r) => r.slug === slug || r.id === slug || (r.slug && slug && (r.slug.startsWith(slug) || slug.startsWith(r.slug)))
    );
    if (!found) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }
    const likes = getLikesForResource(found.id);
    const comments = getCommentsForResource(found.id);
    const enriched = {
      ...found,
      like_count: Math.max(Number(found.like_count) || 0, likes.total),
      comment_count: Math.max(Number(found.comment_count) || 0, comments.length),
    };
    return NextResponse.json(enriched);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const updates = await request.json();
    const resources = getStoredData();
    const index = resources.findIndex((r) => r.slug === slug || r.id === slug);

    if (index === -1) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const updatedResource = {
      ...resources[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    resources[index] = updatedResource;
    replaceStoredResources(resources);

    return NextResponse.json(updatedResource);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    let resources = getStoredData();
    const beforeCount = resources.length;
    resources = resources.filter((r) => r.slug !== slug && r.id !== slug);

    if (resources.length === beforeCount) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    replaceStoredResources(resources);
    return NextResponse.json({ status: 'success', message: 'Resource deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
