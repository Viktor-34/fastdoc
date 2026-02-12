import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { getServerAuthSession } from "@/lib/auth";
import { getActiveWorkspaceId } from "@/lib/workspace";
import { isS3Configured, uploadToS3 } from "@/lib/s3";
import { createRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

const checkRate = createRateLimiter("workspace-upload", { limit: 20, windowMs: 60_000 });

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function startsWithBytes(buffer: Buffer, bytes: number[]) {
  return bytes.every((value, index) => buffer[index] === value);
}

function detectImageFormat(buffer: Buffer): "jpg" | "png" | "gif" | "webp" | null {
  if (buffer.length < 12) {
    return null;
  }
  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) {
    return "jpg";
  }
  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47])) {
    return "png";
  }
  if (startsWithBytes(buffer, [0x47, 0x49, 0x46])) {
    return "gif";
  }
  if (
    startsWithBytes(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

function sanitizeSegment(value: string) {
  return value.replace(/[^a-z0-9\-_.]/gi, "_");
}

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function POST(request: NextRequest) {
  const blocked = checkRate(request);
  if (blocked) return blocked;

  try {
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getActiveWorkspaceId(session.user.workspaceId);
    const workspaceSegment = sanitizeSegment(workspaceId);

    const formData = await request.formData();
    const file = formData.get("file");
    const field = formData.get("field"); // logoUrl | signatureUrl | stampUrl

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const extension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json({ error: "Unsupported file extension" }, { status: 400 });
    }

    // Проверка типа файла
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Проверка размера (макс 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must not exceed 5MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const format = detectImageFormat(buffer);

    if (!format) {
      return NextResponse.json({ error: "Invalid image signature" }, { status: 400 });
    }

    if (extension === ".jpg" || extension === ".jpeg") {
      if (format !== "jpg") {
        return NextResponse.json({ error: "Invalid image signature" }, { status: 400 });
      }
    } else if (extension === ".png") {
      if (format !== "png") {
        return NextResponse.json({ error: "Invalid image signature" }, { status: 400 });
      }
    } else if (extension === ".gif") {
      if (format !== "gif") {
        return NextResponse.json({ error: "Invalid image signature" }, { status: 400 });
      }
    } else if (extension === ".webp" && format !== "webp") {
      return NextResponse.json({ error: "Invalid image signature" }, { status: 400 });
    }

    // Генерируем имя файла с префиксом для идентификации
    const prefix = field ? `${field}_` : "";
    const safeName = file.name.replace(/[^a-z0-9.\-_]+/gi, "_");
    const fileName = `${prefix}${randomUUID()}_${safeName}`;

    let url: string;

    if (isS3Configured()) {
      // Загружаем в S3.
      const key = `uploads/${workspaceSegment}/${fileName}`;
      const contentType = file.type || MIME_MAP[extension] || "application/octet-stream";
      url = await uploadToS3({ key, body: buffer, contentType });
    } else {
      // Локальное сохранение (dev-режим).
      const workspaceDir = path.join(UPLOAD_DIR, workspaceSegment);
      await mkdir(workspaceDir, { recursive: true });
      const filePath = path.join(workspaceDir, fileName);
      await writeFile(filePath, buffer);
      url = `/uploads/${workspaceSegment}/${fileName}`;
    }

    return NextResponse.json({ url, workspaceId });
  } catch (error) {
    console.error("POST /api/workspace/upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
