import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const S3_BUCKET = process.env.S3_BUCKET ?? "";
const S3_REGION = process.env.S3_REGION ?? "ru-1";
const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY ?? "";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY ?? "";

// Публичный URL для доступа к файлам (CDN или прямой endpoint).
const S3_PUBLIC_URL =
  process.env.S3_PUBLIC_URL ??
  (S3_ENDPOINT ? `${S3_ENDPOINT}/${S3_BUCKET}` : "");

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;

  _client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    },
    forcePathStyle: true, // Timeweb Cloud / MinIO совместимость
  });

  return _client;
}

/**
 * Проверяет, сконфигурировано ли S3-хранилище.
 * Если нет — загрузки будут сохраняться на локальный диск (dev-режим).
 */
export function isS3Configured(): boolean {
  return Boolean(S3_BUCKET && S3_ENDPOINT && S3_ACCESS_KEY && S3_SECRET_KEY);
}

interface UploadOptions {
  /** Ключ (путь) файла в бакете, например: "uploads/workspace123/file.png" */
  key: string;
  /** Содержимое файла */
  body: Buffer;
  /** MIME-тип файла */
  contentType: string;
}

/**
 * Загружает файл в S3 и возвращает публичный URL.
 */
export async function uploadToS3({ key, body, contentType }: UploadOptions): Promise<string> {
  const client = getClient();

  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
    }),
  );

  return `${S3_PUBLIC_URL}/${key}`;
}
