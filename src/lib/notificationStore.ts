import fs from 'fs';
import path from 'path';

export interface StoredNotification {
  id: string;
  recipient_user_id?: string;
  recipient_role?: 'ADMIN' | 'STUDENT' | 'ALL';
  title: string;
  description: string;
  type: string;
  href: string;
  unread: boolean;
  created_at: string;
}

const NOTIFICATIONS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'notifications.json');

const BASELINE_NOTIFICATIONS: StoredNotification[] = [
  {
    id: 'base-notif-1',
    recipient_role: 'ALL',
    title: 'Emerging Skill Signal',
    description: 'Demand for LangChain & Agentic AI rose +34% in Bengaluru tech hiring this week.',
    type: 'signal',
    href: '/dashboard/industry-skills',
    unread: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'base-notif-2',
    recipient_role: 'ALL',
    title: 'Readiness Score Updated',
    description: 'Your verified skills boosted your Data Scientist role readiness to 78%.',
    type: 'readiness',
    href: '/dashboard',
    unread: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

function readNotificationsFromDisk(): StoredNotification[] {
  try {
    if (fs.existsSync(NOTIFICATIONS_FILE_PATH)) {
      const raw = fs.readFileSync(NOTIFICATIONS_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.error('Error reading notifications.json:', err);
  }
  return [...BASELINE_NOTIFICATIONS];
}

function writeNotificationsToDisk(items: StoredNotification[]): void {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing notifications.json:', err);
  }
}

export function getNotifications(params: {
  userId?: string;
  isAdmin?: boolean;
  limit?: number;
}): StoredNotification[] {
  const all = readNotificationsFromDisk();
  const limit = Math.max(1, params.limit || 30);
  const uid = (params.userId || '').toLowerCase().trim();
  const isAdmin = Boolean(params.isAdmin);

  const filtered = all.filter((n) => {
    // If targeted to ALL
    if (!n.recipient_role || n.recipient_role === 'ALL') return true;

    // If recipient is ADMIN
    if (n.recipient_role === 'ADMIN') {
      return isAdmin;
    }

    // If targeted to specific user
    if (n.recipient_user_id) {
      return n.recipient_user_id.toLowerCase().trim() === uid;
    }

    // If targeted to STUDENT
    if (n.recipient_role === 'STUDENT') {
      return !isAdmin;
    }

    return true;
  });

  return filtered
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function addNotification(payload: {
  recipient_user_id?: string;
  recipient_role?: 'ADMIN' | 'STUDENT' | 'ALL';
  title: string;
  description: string;
  type?: string;
  href?: string;
}): StoredNotification {
  const all = readNotificationsFromDisk();
  const newNotif: StoredNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    recipient_user_id: payload.recipient_user_id,
    recipient_role: payload.recipient_role || 'ALL',
    title: payload.title,
    description: payload.description,
    type: payload.type || 'resource',
    href: payload.href || '/dashboard',
    unread: true,
    created_at: new Date().toISOString(),
  };

  // Avoid spamming duplicate notifications within 30 seconds
  const isDuplicate = all.some(
    (n) =>
      n.title === newNotif.title &&
      n.description === newNotif.description &&
      Math.abs(new Date(n.created_at).getTime() - new Date(newNotif.created_at).getTime()) < 30000
  );

  if (!isDuplicate) {
    all.unshift(newNotif);
    // Keep max 200 notifications
    writeNotificationsToDisk(all.slice(0, 200));
  }

  return newNotif;
}

export function markNotificationsAsRead(params: {
  userId?: string;
  isAdmin?: boolean;
}): { status: string; updatedCount: number } {
  const all = readNotificationsFromDisk();
  const uid = (params.userId || '').toLowerCase().trim();
  const isAdmin = Boolean(params.isAdmin);

  let updatedCount = 0;
  const updated = all.map((n) => {
    let applies = false;
    if (!n.recipient_role || n.recipient_role === 'ALL') applies = true;
    else if (n.recipient_role === 'ADMIN' && isAdmin) applies = true;
    else if (n.recipient_user_id && n.recipient_user_id.toLowerCase().trim() === uid) applies = true;
    else if (n.recipient_role === 'STUDENT' && !isAdmin) applies = true;

    if (applies && n.unread) {
      updatedCount++;
      return { ...n, unread: false };
    }
    return n;
  });

  writeNotificationsToDisk(updated);
  return { status: 'success', updatedCount };
}
