import { NextResponse } from 'next/server';
import { getStoredResources, replaceStoredResources } from '@/lib/resourceStore';

export const dynamic = 'force-dynamic';

function getStoredData(): any[] {
  return getStoredResources();
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const resources = getStoredData();
    const index = resources.findIndex((r) => r.id === id || r.slug === id);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let resources = getStoredData();
    const beforeCount = resources.length;
    resources = resources.filter((r) => r.id !== id && r.slug !== id);

    if (resources.length === beforeCount) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    replaceStoredResources(resources);
    return NextResponse.json({ status: 'success', message: 'Resource deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
