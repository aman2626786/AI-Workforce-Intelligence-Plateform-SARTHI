import { NextResponse } from 'next/server';
import { getResourceActivity } from '@/lib/resourceActivityStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const limit = Number(searchParams.get('limit') || 100);
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
  const to = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
  const activity = getResourceActivity().filter((event) => {
    const timestamp = new Date(event.created_at).getTime();
    return (!type || type === 'ALL' || event.type === type) &&
      (from === null || timestamp >= from) &&
      (to === null || timestamp <= to);
  }).slice(0, limit);
  return NextResponse.json({ total: activity.length, activity });
}
