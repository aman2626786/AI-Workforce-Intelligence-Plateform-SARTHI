import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = process.cwd();
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'backend', 'scripts', 'job_admin_cli.py');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'stats';

  try {
    let args = [SCRIPT_PATH, action];

    if (action === 'runs') {
      const limit = searchParams.get('limit') || '15';
      args.push(limit);
    } else if (action === 'jobs') {
      const page = searchParams.get('page') || '1';
      const limit = searchParams.get('limit') || '20';
      const search = searchParams.get('search') || '';
      args.push(page, limit, search);
    }

    const { stdout, stderr } = await execFileAsync('python', args, {
      cwd: PROJECT_ROOT,
      timeout: 30000,
    });

    if (!stdout || stdout.trim().length === 0) {
      return NextResponse.json({ error: 'Bridge returned no output', stderr }, { status: 500 });
    }

    const data = JSON.parse(stdout.trim());
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal error calling job admin bridge' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sources = body.sources ? (Array.isArray(body.sources) ? body.sources.join(',') : body.sources) : 'all';
    const roles = body.roles ? (Array.isArray(body.roles) ? body.roles.join(',') : body.roles) : 'all';

    const args = [SCRIPT_PATH, 'trigger', sources, roles];

    const { stdout, stderr } = await execFileAsync('python', args, {
      cwd: PROJECT_ROOT,
      timeout: 60000,
    });

    if (!stdout || stdout.trim().length === 0) {
      return NextResponse.json({ error: 'Crawler execution returned empty response', stderr }, { status: 500 });
    }

    const data = JSON.parse(stdout.trim());
    return NextResponse.json({
      message: 'Job collection cycle completed successfully',
      result: data
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to trigger collection cycle' },
      { status: 500 }
    );
  }
}
