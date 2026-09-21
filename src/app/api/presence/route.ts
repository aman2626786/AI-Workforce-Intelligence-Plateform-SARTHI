import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PresenceSession {
  sessionId: string;
  userLabel: string;
  email?: string;
  activePage: string;
  device: string;
  location: string;
  lastPing: number;
}

// In-memory server presence registry for strictly real active connections
const globalPresenceMap = new Map<string, PresenceSession>();

let totalViews = 148;

export async function GET() {
  const now = Date.now();
  // Prune sessions older than 45 seconds
  for (const [id, sess] of globalPresenceMap.entries()) {
    if (now - sess.lastPing > 45 * 1000) {
      globalPresenceMap.delete(id);
    }
  }

  const activeServerSessions = Array.from(globalPresenceMap.values());
  return NextResponse.json({
    success: true,
    totalViews,
    liveCount: activeServerSessions.length,
    sessions: activeServerSessions,
    timestamp: now,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, userLabel, email, activePage, device, location, isNewPageView } = body;

    if (isNewPageView) {
      totalViews += 1;
    }

    if (sessionId) {
      globalPresenceMap.set(sessionId, {
        sessionId,
        userLabel: userLabel || 'Active Visitor',
        email: email || undefined,
        activePage: activePage || '/',
        device: device || 'Desktop',
        location: location || 'India',
        lastPing: Date.now(),
      });
    }

    const now = Date.now();
    for (const [id, sess] of globalPresenceMap.entries()) {
      if (now - sess.lastPing > 45 * 1000) {
        globalPresenceMap.delete(id);
      }
    }

    const activeSessions = Array.from(globalPresenceMap.values());

    return NextResponse.json({
      success: true,
      totalViews,
      liveCount: activeSessions.length,
      sessions: activeSessions,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to record presence' }, { status: 400 });
  }
}
