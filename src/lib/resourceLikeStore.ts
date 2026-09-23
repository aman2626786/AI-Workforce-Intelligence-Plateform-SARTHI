import fs from 'fs';
import path from 'path';
import { addResourceActivity } from './resourceActivityStore';
import { addNotification } from './notificationStore';

export interface LikeRecord {
  id: string;
  resource_id: string;
  resource_slug?: string;
  resource_title?: string;
  user_id: string;
  user_name?: string;
  email?: string;
  created_at: string;
}

const LIKES_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'resourceLikes.json');

function readLikesFromDisk(): LikeRecord[] {
  try {
    if (fs.existsSync(LIKES_FILE_PATH)) {
      const raw = fs.readFileSync(LIKES_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error reading resourceLikes.json:', err);
  }
  return [];
}

function writeLikesToDisk(likes: LikeRecord[]): void {
  try {
    fs.writeFileSync(LIKES_FILE_PATH, JSON.stringify(likes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing resourceLikes.json:', err);
  }
}

function matchesResource(like: LikeRecord, target: string): boolean {
  if (!target) return false;
  const cleanTarget = target.toLowerCase().trim();
  const resId = (like.resource_id || '').toLowerCase().trim();
  const resSlug = (like.resource_slug || '').toLowerCase().trim();
  return resId === cleanTarget || resSlug === cleanTarget;
}

export function getAllResourceLikes(): LikeRecord[] {
  return readLikesFromDisk();
}

export function getLikesForResource(resourceIdOrSlug: string): { total: number; userLiked: boolean } {
  const all = readLikesFromDisk();
  const matching = all.filter((l) => matchesResource(l, resourceIdOrSlug));
  return { total: matching.length, userLiked: false };
}

export function checkUserLiked(resourceIdOrSlug: string, userId: string): boolean {
  if (!userId) return false;
  const cleanUserId = userId.toLowerCase().trim();
  const all = readLikesFromDisk();
  return all.some(
    (l) => matchesResource(l, resourceIdOrSlug) && (l.user_id || '').toLowerCase().trim() === cleanUserId
  );
}

export function toggleLikeForResource(payload: {
  resource_id: string;
  resource_title?: string;
  resource_slug?: string;
  user_id: string;
  user_name?: string;
  email?: string;
  forceAction?: 'like' | 'unlike';
}): { liked: boolean; like_count: number } {
  const all = readLikesFromDisk();
  const targetId = payload.resource_id;
  const targetSlug = payload.resource_slug || payload.resource_id;
  const targetTitle = payload.resource_title || 'Resource';
  const userId = payload.user_id || 'anonymous_user';
  const userName = payload.user_name || 'Student';
  const cleanUserId = userId.toLowerCase().trim();

  const existingIndex = all.findIndex(
    (l) => (matchesResource(l, targetId) || matchesResource(l, targetSlug)) &&
           (l.user_id || '').toLowerCase().trim() === cleanUserId
  );

  let liked = false;

  if (payload.forceAction === 'unlike' || (existingIndex !== -1 && payload.forceAction !== 'like')) {
    // Unlike
    if (existingIndex !== -1) {
      all.splice(existingIndex, 1);
    }
    liked = false;
  } else {
    // Like
    if (existingIndex === -1) {
      const newLike: LikeRecord = {
        id: `like_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        resource_id: targetId,
        resource_slug: targetSlug,
        resource_title: targetTitle,
        user_id: userId,
        user_name: userName,
        email: payload.email,
        created_at: new Date().toISOString(),
      };
      all.unshift(newLike);
      liked = true;

      // 1. Add activity event for Admin Dashboard Activity stream
      try {
        addResourceActivity({
          type: 'like',
          user_id: userId,
          user_name: userName,
          email: payload.email || 'student@matchskill.ai',
          resource_id: targetId,
          resource_title: targetTitle,
          resource_slug: targetSlug,
        });
      } catch (err) {
        console.warn('Failed to add resource activity:', err);
      }

      // 2. Add real-time Notification for Admin
      try {
        addNotification({
          recipient_role: 'ADMIN',
          title: 'New Resource Like',
          description: `${userName} liked "${targetTitle}".`,
          type: 'resource',
          href: `/resources/${targetSlug}`,
        });
      } catch (err) {
        console.warn('Failed to send admin like notification:', err);
      }

      // 3. Add personal notification for the liking user
      try {
        if (userId && userId !== 'anonymous_user') {
          addNotification({
            recipient_user_id: userId,
            recipient_role: 'STUDENT',
            title: 'Resource liked',
            description: `You liked "${targetTitle}".`,
            type: 'resource',
            href: `/resources/${targetSlug}`,
          });
        }
      } catch {}
    } else {
      liked = true;
    }
  }

  writeLikesToDisk(all);

  const totalLikes = all.filter((l) => matchesResource(l, targetId) || matchesResource(l, targetSlug)).length;

  return { liked, like_count: totalLikes };
}
