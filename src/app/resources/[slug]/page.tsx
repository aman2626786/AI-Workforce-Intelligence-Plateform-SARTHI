import React from 'react';
import ResourceDetailClient from './ResourceDetailClient';

export function generateStaticParams() {
  return [{ slug: 'explore' }];
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ResourceDetailClient slug={slug} />;
}


