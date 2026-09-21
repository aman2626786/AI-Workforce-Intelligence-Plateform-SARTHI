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
const FALLBACK_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'fallbackResources.json');

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

function updateResourceCommentCount(resourceId: string, delta: number): void {
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const raw = fs.readFileSync(FALLBACK_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.resources)) {
        let changed = false;
        data.resources = data.resources.map((r: any) => {
          if (r.id === resourceId || r.slug === resourceId) {
            const current = Number(r.comment_count) || 0;
            changed = true;
            return { ...r, comment_count: Math.max(0, current + delta), updated_at: new Date().toISOString() };
          }
          return r;
        });
        if (changed) {
          fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
        }
      }
    }
  } catch (err) {
    console.error('Error updating resource comment_count:', err);
  }
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
  const id = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newComment: CommentRecord = {
    id,
    resource_id: payload.resource_id,
    user_id: payload.user_id || 'student',
    user_name: payload.user_name || 'Student Contributor',
    email: payload.email,
    content: payload.content,
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
      content: payload.content,
    });
  } catch (err) {
    console.warn('Failed to add to resourceActivityStore:', err);
  }

  return newComment;
}

export function deleteCommentFromResource(commentId: string, resourceId?: string): boolean {
  const all = readCommentsFromDisk();
  const found = all.find((c) => c.id === commentId);
  if (!found) return false;

  const targetResourceId = resourceId || found.resource_id;
  const filtered = all.filter((c) => c.id !== commentId);
  writeCommentsToDisk(filtered);
  updateResourceCommentCount(targetResourceId, -1);

  try {
    removeResourceActivity(commentId);
  } catch {}

  return true;
}
