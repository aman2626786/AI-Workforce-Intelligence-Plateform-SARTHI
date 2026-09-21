import { NextResponse } from 'next/server';
import { getCommentsForResource, addCommentToResource, deleteCommentFromResource } from '@/lib/resourceCommentStore';
import { getStoredResources } from '@/lib/resourceStore';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const resources = getStoredResources();
    const resource = resources.find(
      (r: any) => r.slug === slug || r.id === slug || (r.slug && slug && (r.slug.startsWith(slug) || slug.startsWith(r.slug)))
    );
    const targetId = resource ? resource.id : slug;

    const comments = getCommentsForResource(targetId);
    // Also check by slug if ID yielded 0
    if (comments.length === 0 && resource && resource.slug !== targetId) {
      const bySlug = getCommentsForResource(resource.slug);
      if (bySlug.length > 0) return NextResponse.json(bySlug);
    }
    return NextResponse.json(comments);
  } catch (err: any) {
    console.error('GET comments error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const resources = getStoredResources();
    const resource = resources.find(
      (r: any) => r.slug === slug || r.id === slug || (r.slug && slug && (r.slug.startsWith(slug) || slug.startsWith(r.slug)))
    );
    const targetId = resource ? resource.id : slug;

    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const comment = addCommentToResource({
      resource_id: targetId,
      resource_title: resource?.title || 'Resource',
      resource_slug: resource?.slug || slug,
      user_id: body.user_id || 'student',
      user_name: body.user_name || 'Student Contributor',
      email: body.email,
      content: body.content.trim(),
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err: any) {
    console.error('POST comment error:', err);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('comment_id');

    if (!commentId) {
      return NextResponse.json({ error: 'comment_id is required' }, { status: 400 });
    }

    const resources = getStoredResources();
    const resource = resources.find((r: any) => r.slug === slug || r.id === slug);
    const targetId = resource ? resource.id : slug;

    const success = deleteCommentFromResource(commentId, targetId);
    if (!success) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 'success', comment_id: commentId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
