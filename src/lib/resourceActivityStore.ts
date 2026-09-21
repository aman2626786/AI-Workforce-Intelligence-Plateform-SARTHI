export interface ResourceActivityEvent {
  id: string;
  type: 'like' | 'save' | 'comment';
  user_id: string;
  user_name: string;
  email: string;
  resource_id: string;
  resource_title: string;
  resource_slug: string;
  content?: string | null;
  created_at: string;
}

let events: ResourceActivityEvent[] = [];

export function addResourceActivity(event: Omit<ResourceActivityEvent, 'id' | 'created_at'>): ResourceActivityEvent {
  const normContent = (event.content || '').trim().toLowerCase();
  const normUser = (event.user_name || event.user_id || '').trim().toLowerCase();
  const resId = (event.resource_id || '').toLowerCase();
  const resSlug = (event.resource_slug || '').toLowerCase();

  // Deduplication check: Do not record duplicate events for the same resource, user, and content
  const existing = events.find((e) => {
    if (e.type !== event.type) return false;
    const matchesResource =
      (e.resource_id && (e.resource_id.toLowerCase() === resId || e.resource_id.toLowerCase() === resSlug)) ||
      (e.resource_slug && (e.resource_slug.toLowerCase() === resId || e.resource_slug.toLowerCase() === resSlug));
    if (!matchesResource) return false;

    const matchesUser =
      (e.user_id && e.user_id === event.user_id) ||
      (e.user_name && e.user_name.trim().toLowerCase() === normUser) ||
      (e.email && event.email && e.email.toLowerCase() === event.email.toLowerCase());
    if (!matchesUser) return false;

    if (event.type === 'comment') {
      return (e.content || '').trim().toLowerCase() === normContent;
    }
    return true;
  });

  if (existing) {
    return existing;
  }

  const next: ResourceActivityEvent = {
    ...event,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  events = [next, ...events].slice(0, 500);
  return next;
}

export function getResourceActivity(): ResourceActivityEvent[] {
  // Deduplicate on retrieval to ensure no duplicates are presented to the admin
  const seen = new Set<string>();
  const unique: ResourceActivityEvent[] = [];

  for (const ev of events) {
    const normContent = (ev.content || '').trim().toLowerCase();
    const normUser = (ev.user_name || ev.user_id || ev.email || '').trim().toLowerCase();
    const resId = (ev.resource_id || ev.resource_slug || '').toLowerCase();
    const key = `${ev.type}::${resId}::${normUser}::${normContent}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(ev);
    }
  }

  return unique;
}

export function removeResourceActivity(idOrContent: string) {
  events = events.filter(
    (event) =>
      event.id !== idOrContent &&
      event.content !== idOrContent &&
      !(idOrContent && event.id.includes(idOrContent))
  );
}

export function resetResourceActivity(newEvents?: ResourceActivityEvent[]) {
  events = newEvents || [];
}
