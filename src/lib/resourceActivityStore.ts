import fs from 'fs';
import path from 'path';

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

const ACTIVITIES_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'resourceActivities.json');

function readActivitiesFromDisk(): ResourceActivityEvent[] {
  try {
    if (fs.existsSync(ACTIVITIES_FILE_PATH)) {
      const raw = fs.readFileSync(ACTIVITIES_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error reading resourceActivities.json:', err);
  }
  return [];
}

function writeActivitiesToDisk(items: ResourceActivityEvent[]): void {
  try {
    fs.writeFileSync(ACTIVITIES_FILE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing resourceActivities.json:', err);
  }
}

export function addResourceActivity(event: Omit<ResourceActivityEvent, 'id' | 'created_at'>): ResourceActivityEvent {
  const events = readActivitiesFromDisk();
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

  const updated = [next, ...events].slice(0, 500);
  writeActivitiesToDisk(updated);
  return next;
}

export function getResourceActivity(): ResourceActivityEvent[] {
  const events = readActivitiesFromDisk();
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
  const events = readActivitiesFromDisk();
  const filtered = events.filter(
    (event) =>
      event.id !== idOrContent &&
      event.content !== idOrContent &&
      !(idOrContent && event.id.includes(idOrContent))
  );
  writeActivitiesToDisk(filtered);
}

export function resetResourceActivity(newEvents?: ResourceActivityEvent[]) {
  writeActivitiesToDisk(newEvents || []);
}
