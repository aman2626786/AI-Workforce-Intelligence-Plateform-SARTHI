import React from 'react';
import ResourceDetailClient from './ResourceDetailClient';

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ResourceDetailClient slug={slug} />;
}

