import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

import { getServerAuthSession } from '@/lib/auth';
import { getActiveWorkspaceId } from '@/lib/workspace';
import { apiError, apiSuccess } from '@/lib/api/response';
import { isS3Configured, uploadToS3 } from '@/lib/s3';
import { createRateLimiter } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const checkRate = createRateLimiter('upload', { limit: 20, windowMs: 60_000 });

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

// Приводим строку к безопасному виду для имени папки/файла.
function sanitizeSegment(value: string) {
  return value.replace(/[^a-z0-9\-_.]/gi, '_');
}

// Проверяем magic bytes файла.
function startsWithBytes(buffer: Buffer, bytes: number[]) {
  return bytes.every((value, index) => buffer[index] === value);
}

function detectImageFormat(buffer: Buffer): 'jpg' | 'png' | 'gif' | 'webp' | null {
  if (buffer.length < 12) return null;
  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47])) return 'png';
  if (startsWithBytes(buffer, [0x47, 0x49, 0x46])) return 'gif';
  if (
    startsWithBytes(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export async function POST(request: NextRequest) {
  const blocked = checkRate(request);
  if (blocked) return blocked;

  const session = await getServerAuthSession();
  if (!session?.user) {
    return apiError('Unauthorized', 401);
  }

  try {
    // Каждая рабочая область получает свою подпапку.
    const workspaceId = await getActiveWorkspaceId(session.user.workspaceId);
    const workspaceSegment = sanitizeSegment(workspaceId);

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return apiError('No file provided', 400);
    }

    // Проверка расширения.
    const extension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return apiError('Unsupported file type. Allowed: JPG, PNG, WEBP, GIF', 400);
    }

    // Проверка MIME-типа.
    if (!file.type.startsWith('image/')) {
      return apiError('File must be an image', 400);
    }

    // Проверка размера (макс 5MB).
    if (file.size > MAX_FILE_SIZE) {
      return apiError('File size must not exceed 5MB', 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Проверка magic bytes — защита от подмены расширения.
    const format = detectImageFormat(buffer);
    if (!format) {
      return apiError('Invalid image file', 400);
    }

    const safeName = file.name.replace(/[^a-z0-9.\-_]+/gi, '_');
    const fileName = `${randomUUID()}_${safeName}`;

    let url: string;

    if (isS3Configured()) {
      // Загружаем в S3.
      const key = `uploads/${workspaceSegment}/${fileName}`;
      const contentType = file.type || MIME_MAP[extension] || 'application/octet-stream';
      url = await uploadToS3({ key, body: buffer, contentType });
    } else {
      // Локальное сохранение (dev-режим).
      const workspaceDir = path.join(UPLOAD_DIR, workspaceSegment);
      await mkdir(workspaceDir, { recursive: true });
      const filePath = path.join(workspaceDir, fileName);
      await writeFile(filePath, buffer);
      url = `/uploads/${workspaceSegment}/${fileName}`;
    }

    return apiSuccess({ url, workspaceId });
  } catch (error) {
    console.error('[upload] failed to save file', error);
    return apiError('Failed to upload file', 500);
  }
}
