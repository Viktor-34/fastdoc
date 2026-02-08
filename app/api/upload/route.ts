import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import { getServerAuthSession } from '@/lib/auth';
import { getActiveWorkspaceId } from '@/lib/workspace';
import { apiError, apiSuccess } from '@/lib/api/response';

export const runtime = 'nodejs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Приводим строку к безопасному виду для имени папки/файла.
function sanitizeSegment(value: string) {
  return value.replace(/[^a-z0-9\-_.]/gi, '_');
}

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return apiError('Unauthorized', 401);
  }
  // Каждая рабочая область получает свою подпапку.
  const workspaceId = await getActiveWorkspaceId(session.user.workspaceId);
  const workspaceSegment = sanitizeSegment(workspaceId);
  const workspaceDir = path.join(UPLOAD_DIR, workspaceSegment);

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return apiError('No file provided', 400);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Создаём директорию при необходимости и сохраняем файл.
  await mkdir(workspaceDir, { recursive: true });
  const safeName = file.name.replace(/[^a-z0-9.\-_]+/gi, '_');
  const fileName = `${randomUUID()}_${safeName}`;
  const filePath = path.join(workspaceDir, fileName);

  await writeFile(filePath, buffer);

  const url = `/uploads/${workspaceSegment}/${fileName}`;
  return apiSuccess({ url, workspaceId });
}
