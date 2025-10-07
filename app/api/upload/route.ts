import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import { getActiveWorkspaceId } from '@/lib/workspace';

export const runtime = 'nodejs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function sanitizeSegment(value: string) {
  return value.replace(/[^a-z0-9\-_.]/gi, '_');
}

export async function POST(request: NextRequest) {
  const workspaceId = getActiveWorkspaceId();
  const workspaceSegment = sanitizeSegment(workspaceId);
  const workspaceDir = path.join(UPLOAD_DIR, workspaceSegment);

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return new Response('No file provided', { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await mkdir(workspaceDir, { recursive: true });
  const safeName = file.name.replace(/[^a-z0-9.\-_]+/gi, '_');
  const fileName = `${randomUUID()}_${safeName}`;
  const filePath = path.join(workspaceDir, fileName);

  await writeFile(filePath, buffer);

  const url = `/uploads/${workspaceSegment}/${fileName}`;
  return Response.json({ url, workspaceId });
}
