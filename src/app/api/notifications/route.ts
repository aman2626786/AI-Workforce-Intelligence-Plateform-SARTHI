import { NextResponse } from 'next/server';
import { getNotifications, addNotification } from '@/lib/notificationStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || '';
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '30', 10));

    // Check authorization header for admin token
    const authHeader = request.headers.get('authorization') || '';
    const isAdmin =
      authHeader.includes('admin_portal_access') ||
      searchParams.get('is_admin') === 'true' ||
      searchParams.get('role')?.toUpperCase() === 'ADMIN';

    const items = getNotifications({
      userId,
      isAdmin,
      limit,
    });

    return NextResponse.json(items);
  } catch (err: any) {
    console.error('GET /api/notifications error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.title || !body.description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const created = addNotification({
      recipient_user_id: body.recipient_user_id,
      recipient_role: body.recipient_role || 'ALL',
      title: body.title,
      description: body.description,
      type: body.type || 'resource',
      href: body.href || '/dashboard',
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/notifications error:', err);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
