import { NextResponse } from 'next/server';
import { removeResourceActivity } from '@/lib/resourceActivityStore';
import { deleteCommentFromResource } from '@/lib/resourceCommentStore';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  removeResourceActivity(commentId);
  deleteCommentFromResource(commentId);
  return NextResponse.json({ status: 'success', comment_id: commentId });
}