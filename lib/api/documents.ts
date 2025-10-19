import type { JSONContent } from '@tiptap/core';

// Что требуется при сохранении документа на сервере.
export interface SaveDocumentPayload {
  id?: string;
  title: string;
  json: JSONContent;
  publish?: boolean;
}

// Клиентский helper для POST /api/doc.
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
