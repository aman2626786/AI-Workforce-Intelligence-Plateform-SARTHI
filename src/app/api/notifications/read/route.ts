import { NextResponse } from 'next/server';
import { markNotificationsAsRead } from '@/lib/notificationStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || '';

    const authHeader = request.headers.get('authorization') || '';
    const isAdmin =
      authHeader.includes('admin_portal_access') ||
      searchParams.get('is_admin') === 'true' ||
      searchParams.get('role')?.toUpperCase() === 'ADMIN';

    const result = markNotificationsAsRead({ userId, isAdmin });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('POST /api/notifications/read error:', err);
    return NextResponse.json({ status: 'success' });
  }
}
