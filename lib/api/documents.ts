import type { JSONContent } from '@tiptap/core';

export interface SaveDocumentPayload {
  id?: string;
  title: string;
  json: JSONContent;
  publish?: boolean;
}

export async function saveDocument(payload: SaveDocumentPayload) {
  const response = await fetch('/api/doc', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<{ id: string; version?: number }>;
}
