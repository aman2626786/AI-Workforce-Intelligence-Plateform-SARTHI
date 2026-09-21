import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FEEDBACK_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'feedbacks.json');

export interface FeedbackEntry {
  id: string;
  category: string;
  rating: number;
  name?: string;
  email?: string;
  message: string;
  page_url?: string;
  created_at: string;
}

function readFeedbacksFromDisk(): FeedbackEntry[] {
  try {
    if (fs.existsSync(FEEDBACK_FILE_PATH)) {
      const raw = fs.readFileSync(FEEDBACK_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error reading feedbacks.json:', err);
  }
  return [];
}

function writeFeedbacksToDisk(feedbacks: FeedbackEntry[]): void {
  try {
    fs.writeFileSync(FEEDBACK_FILE_PATH, JSON.stringify(feedbacks, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing feedbacks.json:', err);
  }
}

export async function GET() {
  const all = readFeedbacksFromDisk();
  return NextResponse.json({ total: all.length, feedbacks: all });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, rating, name, email, message, page_url } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Feedback message is required' }, { status: 400 });
    }

    const entry: FeedbackEntry = {
      id: `fbk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      category: category || 'General Feedback',
      rating: Number(rating) || 5,
      name: name?.trim() || 'Anonymous User',
      email: email?.trim() || '',
      message: message.trim(),
      page_url: page_url || '',
      created_at: new Date().toISOString(),
    };

    const feedbacks = readFeedbacksFromDisk();
    feedbacks.unshift(entry);
    writeFeedbacksToDisk(feedbacks);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully. Thank you for your insights!',
      data: entry,
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST feedback error:', err);
    return NextResponse.json({ error: 'Failed to process feedback submission.' }, { status: 500 });
  }
}
