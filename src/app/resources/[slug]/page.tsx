import React from 'react';
import ResourceDetailClient from './ResourceDetailClient';

import fallbackData from '@/data/fallbackResources.json';

export function generateStaticParams() {
  const slugs: Array<{ slug: string }> = [{ slug: 'explore' }];
  try {
    const list = (fallbackData as any)?.resources || [];
    for (const r of list) {
      if (r?.slug && r.slug !== 'explore') {
        slugs.push({ slug: r.slug });
      }
    }
  } catch {}
  return slugs;
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ResourceDetailClient slug={slug} />;
}


