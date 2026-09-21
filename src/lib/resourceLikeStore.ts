import fs from 'fs';
import path from 'path';
import { addResourceActivity } from './resourceActivityStore';

export interface LikeRecord {
  id: string;
  resource_id: string;
  user_id: string;
  user_name?: string;
  email?: string;
  created_at: string;
}

const LIKES_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'resourceLikes.json');
const FALLBACK_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'fallbackResources.json');

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

function updateResourceLikeCount(resourceId: string, count: number): void {
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const raw = fs.readFileSync(FALLBACK_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.resources)) {
        let changed = false;
        data.resources = data.resources.map((r: any) => {
          if (r.id === resourceId || r.slug === resourceId) {
            changed = true;
            return { ...r, like_count: count, updated_at: new Date().toISOString() };
          }
          return r;
        });
        if (changed) {
          fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
        }
      }
    }
  } catch (err) {
    console.error('Error updating resource like_count:', err);
  }
}

export function getLikesForResource(resourceIdOrSlug: string): { total: number; userLiked: boolean } {
  const all = readLikesFromDisk();
  const matching = all.filter((l) => l.resource_id === resourceIdOrSlug || l.resource_id.toLowerCase() === resourceIdOrSlug.toLowerCase());
  return { total: matching.length, userLiked: false };
}

export function checkUserLiked(resourceIdOrSlug: string, userId: string): boolean {
  if (!userId) return false;
  const all = readLikesFromDisk();
  return all.some(
    (l) =>
      (l.resource_id === resourceIdOrSlug || l.resource_id.toLowerCase() === resourceIdOrSlug.toLowerCase()) &&
      l.user_id.toLowerCase() === userId.toLowerCase()
  );
}

export function toggleLikeForResource(payload: {
  resource_id: string;
  resource_title?: string;
  resource_slug?: string;
  user_id: string;
  user_name?: string;
  email?: string;
}): { liked: boolean; like_count: number } {
  const all = readLikesFromDisk();
  const targetId = payload.resource_id;
  const userId = payload.user_id || 'anonymous_user';

  const existingIndex = all.findIndex(
    (l) =>
      (l.resource_id === targetId || l.resource_id.toLowerCase() === targetId.toLowerCase()) &&
      l.user_id.toLowerCase() === userId.toLowerCase()
  );

  let liked = false;
  if (existingIndex !== -1) {
    // Unlike
    all.splice(existingIndex, 1);
    liked = false;
  } else {
    // Like
    const newLike: LikeRecord = {
      id: `like_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      resource_id: targetId,
      user_id: userId,
      user_name: payload.user_name || 'Student',
      email: payload.email,
      created_at: new Date().toISOString(),
    };
    all.unshift(newLike);
    liked = true;

    // Add activity event for Admin
    try {
      addResourceActivity({
        type: 'like',
        user_id: userId,
        user_name: payload.user_name || 'Student',
        email: payload.email || 'student@matchskill.ai',
        resource_id: targetId,
        resource_title: payload.resource_title || 'Resource',
        resource_slug: payload.resource_slug || targetId,
      });
    } catch {}
  }

  writeLikesToDisk(all);

  const totalLikesForThisResource = all.filter(
    (l) => l.resource_id === targetId || l.resource_id.toLowerCase() === targetId.toLowerCase()
  ).length;

  updateResourceLikeCount(targetId, totalLikesForThisResource);

  return { liked, like_count: totalLikesForThisResource };
}
