import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateHTML } from '@tiptap/html';
import { createServerExtensions } from '@/lib/tiptap/extensions';
import type { JSONContent } from '@tiptap/core';

export const runtime = 'nodejs';

type DocBody = {
  id?: string;
  title: string;
  json: unknown;
  publish?: boolean;
  workspaceId?: string;
  userId?: string;
};

export async function POST(req: NextRequest) {
  const { id, title, json, publish = false, workspaceId = 'default', userId = 'system' } = (await req.json()) as DocBody;
  if (!json || !title) return new Response('Bad', { status: 400 });

  const html = generateHTML(json as JSONContent, createServerExtensions() as unknown as []);

  if (id) {
    try {
      const doc = await prisma.$transaction(async (tx) => {
        const existing = await tx.document.findUnique({ where: { id } });
        if (!existing) throw new Error('NOT_FOUND');

        const data = {
          title,
          json,
          html,
          updatedBy: userId,
        } as const;

        if (!publish) {
          return tx.document.update({ where: { id }, data });
        }

        const nextVersion = existing.version + 1;
        const updated = await tx.document.update({
          where: { id },
          data: { ...data, version: nextVersion },
        });
        await tx.documentVersion.create({
          data: {
            documentId: id,
            version: nextVersion,
            json,
            html,
          },
        });
        return updated;
      });

      return Response.json({ id: doc.id, version: doc.version });
    } catch (error) {
      if (error instanceof Error && error.message === 'NOT_FOUND') {
        return new Response('Not found', { status: 404 });
      }
      console.error('Failed to save document', error);
      return new Response('Server error', { status: 500 });
    }
  }

  try {
    const doc = await prisma.document.create({
      data: {
        title,
        json,
        html,
        workspaceId,
        createdBy: userId,
        updatedBy: userId,
        version: publish ? 1 : 0,
      },
    });

    if (publish) {
      await prisma.documentVersion.create({
        data: {
          documentId: doc.id,
          version: doc.version,
          json,
          html,
        },
      });
    }

    return Response.json({ id: doc.id, version: doc.version });
  } catch (error) {
    console.error('Failed to create document', error);
    return new Response('Server error', { status: 500 });
  }
}
