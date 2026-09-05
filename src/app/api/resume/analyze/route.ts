import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(file.name) || '.pdf';
    const tempFileName = `resume_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    await fs.writeFile(tempFilePath, buffer);

    const projectRoot = process.cwd();
    const scriptPath = path.join(projectRoot, 'backend', 'scripts', 'parse_cli.py');

    try {
      const { stdout, stderr } = await execFileAsync('python', [scriptPath, tempFilePath], {
        cwd: projectRoot,
        timeout: 25000,
        maxBuffer: 10 * 1024 * 1024,
      });

      // Cleanup temp file
      await fs.unlink(tempFilePath).catch(() => {});

      if (!stdout || stdout.trim().length === 0) {
        return NextResponse.json(
          { error: 'Parser did not return any output: ' + (stderr || '') },
          { status: 500 }
        );
      }

      const parsedData = JSON.parse(stdout.trim());

      if (parsedData.error) {
        return NextResponse.json({ error: parsedData.error }, { status: 500 });
      }

      return NextResponse.json(parsedData);
    } catch (execErr: any) {
      await fs.unlink(tempFilePath).catch(() => {});
      console.error('Python parser execution error:', execErr);
      return NextResponse.json(
        { error: `Python parser execution failed: ${execErr.message}` },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('API route error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
