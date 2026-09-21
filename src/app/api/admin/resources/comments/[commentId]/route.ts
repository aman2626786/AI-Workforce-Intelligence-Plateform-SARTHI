import { NextResponse } from 'next/server';
import { removeResourceActivity } from '@/lib/resourceActivityStore';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await params;
  removeResourceActivity(commentId);
  return NextResponse.json({ status: 'success', comment_id: commentId });
}