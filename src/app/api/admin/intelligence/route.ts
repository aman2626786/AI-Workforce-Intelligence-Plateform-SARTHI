import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = process.cwd();
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'backend', 'scripts', 'intelligence_cli.py');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'status';

  try {
    let args = [SCRIPT_PATH, action];

    if (action === 'role_skills') {
      const roleId = searchParams.get('role_id') || 'ROL_DATA_SCIENTIST';
      args.push(roleId);
    } else if (action === 'candidates') {
      const status = searchParams.get('status') || 'PENDING';
      args.push(status);
    } else if (action === 'skills') {
      const query = searchParams.get('query') || '';
      const category = searchParams.get('category') || '';
      args.push(query, category);
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
    console.error('Error in intelligence CLI bridge GET:', error);
    return NextResponse.json(
      { error: error.message || 'Internal bridge execution error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'process';

  try {
    const body = await req.json().catch(() => ({}));
    let args = [SCRIPT_PATH, action];

    if (action === 'candidate_action') {
      const candidateId = searchParams.get('candidate_id') || body.candidate_id;
      if (!candidateId) {
        return NextResponse.json({ error: 'candidate_id is required' }, { status: 400 });
      }
      const act = body.action || 'MAP';
      const targetSkillId = body.canonical_skill_id || 'null';
      const category = body.category || 'null';
      args = [SCRIPT_PATH, 'candidate_action', candidateId, act, targetSkillId, category];
    } else if (action === 'process') {
      const limit = searchParams.get('limit') || body.limit || '50';
      args.push(limit);
    }

    const { stdout, stderr } = await execFileAsync('python', args, {
      cwd: PROJECT_ROOT,
      timeout: 60000,
    });

    if (!stdout || stdout.trim().length === 0) {
      return NextResponse.json({ error: 'Bridge returned empty response', stderr }, { status: 500 });
    }

    const data = JSON.parse(stdout.trim());
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in intelligence CLI bridge POST:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute intelligence action' },
      { status: 500 }
    );
  }
}
