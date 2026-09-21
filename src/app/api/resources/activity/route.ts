import { NextResponse } from 'next/server';
import { getStoredResources } from '@/lib/resourceStore';
import { addResourceActivity } from '@/lib/resourceActivityStore';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resources = getStoredResources();
    const resource = resources.find((item: any) => item.id === body.resource_id || item.slug === body.resource_id);
    if (!resource) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    const event = addResourceActivity({
      type: body.type,
      user_id: body.user_id || 'anonymous',
      user_name: body.user_name || 'Student',
      email: body.email || 'unknown',
      resource_id: resource.id,
      resource_title: resource.title,
      resource_slug: resource.slug,
      content: body.content || null,
    });
    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid activity payload' }, { status: 400 });
  }
}
