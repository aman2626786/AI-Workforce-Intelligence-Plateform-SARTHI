import fs from 'fs';
import path from 'path';
import { addResourceActivity, removeResourceActivity } from './resourceActivityStore';

export interface CommentRecord {
  id: string;
  resource_id: string;
  user_id: string;
  user_name: string;
  email?: string;
  content: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

const COMMENTS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'resourceComments.json');

function readCommentsFromDisk(): CommentRecord[] {
  try {
    if (fs.existsSync(COMMENTS_FILE_PATH)) {
      const raw = fs.readFileSync(COMMENTS_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error reading resourceComments.json:', err);
  }
  return [];
}

function writeCommentsToDisk(comments: CommentRecord[]): void {
  try {
    fs.writeFileSync(COMMENTS_FILE_PATH, JSON.stringify(comments, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing resourceComments.json:', err);
  }
}

function updateResourceCommentCount(_resourceId: string, _delta: number): void {
  // Counts are dynamically computed by API routes from getCommentsForResource
  // Disk writes to fallbackResources.json are omitted to avoid triggering Next.js Fast Refresh reload
}

export function getCommentsForResource(resourceIdOrSlug: string): CommentRecord[] {
  let all = readCommentsFromDisk();

  // Sync from resourceActivityStore if any comment was posted via activity
  try {
    const { getResourceActivity } = require('./resourceActivityStore');
    const activities = getResourceActivity();
    let added = false;
    for (const act of activities) {
      if (act.type === 'comment' && act.content) {
        const matchesThis =
          act.resource_id === resourceIdOrSlug ||
          act.resource_slug === resourceIdOrSlug ||
          act.resource_id?.toLowerCase() === resourceIdOrSlug.toLowerCase() ||
          act.resource_slug?.toLowerCase() === resourceIdOrSlug.toLowerCase();
        if (matchesThis && !all.some((c) => c.id === act.id || (c.content === act.content && c.user_name === act.user_name))) {
          all.unshift({
            id: act.id,
            resource_id: act.resource_id || resourceIdOrSlug,
            user_id: act.user_id || 'student',
            user_name: act.user_name || 'Student Contributor',
            email: act.email,
            content: act.content,
            status: 'APPROVED',
            created_at: act.created_at || new Date().toISOString(),
            updated_at: act.created_at || new Date().toISOString(),
          });
          added = true;
        }
      }
    }
    if (added) {
      writeCommentsToDisk(all);
      updateResourceCommentCount(resourceIdOrSlug, 1);
    }
  } catch {}

  return all
    .filter(
      (c) =>
        (c.resource_id === resourceIdOrSlug ||
          c.resource_id.toLowerCase() === resourceIdOrSlug.toLowerCase()) &&
        c.status === 'APPROVED'
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function addCommentToResource(payload: {
  resource_id: string;
  resource_title?: string;
  resource_slug?: string;
  user_id: string;
  user_name: string;
  email?: string;
  content: string;
}): CommentRecord {
  const all = readCommentsFromDisk();
  const trimmedContent = payload.content.trim();
  const normUser = (payload.user_name || payload.user_id || '').trim().toLowerCase();
  const resTarget = payload.resource_id.toLowerCase();
  const resSlugTarget = (payload.resource_slug || '').toLowerCase();

  // Deduplication check: return existing comment if exact same user commented identical content on this resource
  const existing = all.find((c) => {
    const matchesRes =
      c.resource_id.toLowerCase() === resTarget ||
      (resSlugTarget && c.resource_id.toLowerCase() === resSlugTarget);
    const matchesUser =
      (c.user_name && c.user_name.trim().toLowerCase() === normUser) ||
      (c.user_id && c.user_id === payload.user_id) ||
      (payload.email && c.email && c.email.toLowerCase() === payload.email.toLowerCase());
    const matchesContent = c.content.trim().toLowerCase() === trimmedContent.toLowerCase();
    return matchesRes && matchesUser && matchesContent;
  });

  if (existing) {
    return existing;
  }

  const id = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newComment: CommentRecord = {
    id,
    resource_id: payload.resource_id,
    user_id: payload.user_id || 'student',
    user_name: payload.user_name || 'Student Contributor',
    email: payload.email,
    content: trimmedContent,
    status: 'APPROVED',
    created_at: now,
    updated_at: now,
  };

  all.unshift(newComment);
  writeCommentsToDisk(all);
  updateResourceCommentCount(payload.resource_id, 1);

  // Also add to activity store for Admin Portal
  try {
    addResourceActivity({
      type: 'comment',
      user_id: payload.user_id || 'student',
      user_name: payload.user_name || 'Student Contributor',
      email: payload.email || 'student@matchskill.ai',
      resource_id: payload.resource_id,
      resource_title: payload.resource_title || 'Resource',
      resource_slug: payload.resource_slug || payload.resource_id,
      content: trimmedContent,
    });
  } catch (err) {
    console.warn('Failed to add to resourceActivityStore:', err);
  }

  // Add real-time Notification for Admin
  try {
    const { addNotification } = require('./notificationStore');
    const commentPreview = trimmedContent.length > 70 ? trimmedContent.slice(0, 70) + '...' : trimmedContent;
    addNotification({
      recipient_role: 'ADMIN',
      title: 'New Resource Comment',
      description: `${payload.user_name || 'Student'} commented on "${payload.resource_title || 'Resource'}": "${commentPreview}"`,
      type: 'resource',
      href: `/resources/${payload.resource_slug || payload.resource_id}`,
    });

    if (payload.user_id && payload.user_id !== 'anonymous') {
      addNotification({
        recipient_user_id: payload.user_id,
        recipient_role: 'STUDENT',
        title: 'Comment posted',
        description: `Your comment was posted on "${payload.resource_title || 'Resource'}".`,
        type: 'resource',
        href: `/resources/${payload.resource_slug || payload.resource_id}`,
      });
    }
  } catch (err) {
    console.warn('Failed to send comment notification:', err);
  }

  return newComment;
}

export function deleteCommentFromResource(commentId: string, resourceId?: string): boolean {
  const all = readCommentsFromDisk();
  const found = all.find((c) => c.id === commentId || (c.content && c.content === commentId));
  if (!found) return false;

  const targetResourceId = resourceId || found.resource_id;
  const filtered = all.filter((c) => c.id !== found.id);
  writeCommentsToDisk(filtered);
  updateResourceCommentCount(targetResourceId, -1);

  try {
    removeResourceActivity(found.id);
    if (found.content) {
      removeResourceActivity(found.content);
    }
  } catch {}

  return true;
}
