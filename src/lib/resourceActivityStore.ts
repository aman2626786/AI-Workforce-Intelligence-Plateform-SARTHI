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

export function addResourceActivity(event: Omit<ResourceActivityEvent, 'id' | 'created_at'>) {
  const next = { ...event, id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, created_at: new Date().toISOString() };
  events = [next, ...events].slice(0, 500);
  return next;
}

export function getResourceActivity() {
  return [...events];
}

export function removeResourceActivity(id: string) {
  events = events.filter((event) => event.id !== id);
}
