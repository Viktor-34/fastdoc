import { NextRequest } from 'next/server';
import { generateHTML } from '@tiptap/html';
import { prisma } from '@/lib/db/prisma';
import { createServerExtensions } from '@/lib/tiptap/extensions';
import { getServerAuthSession } from '@/lib/auth';
import { getActiveWorkspaceId } from '@/lib/workspace';
import type { JSONContent } from '@tiptap/core';

export const runtime = 'nodejs';

type DocBody = {
  id?: string;
  title: string;
  json: unknown;
  publish?: boolean;
  workspaceId?: string;
};

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const actorId = session.user.id;
  // Забираем тело запроса и нормализуем значения.
  const {
    id,
    title,
    json,
    publish = false,
    workspaceId: workspaceOverride,
  } = (await req.json()) as DocBody;
  // Выбираем рабочую область: либо переданную явно, либо из заголовков/куки.
  const workspaceId = await getActiveWorkspaceId(workspaceOverride ?? session.user.workspaceId);
  if (!json || !title) return new Response('Bad', { status: 400 });

  // В любом случае пересобираем HTML на сервере, чтобы хранить актуальную версию.
  const html = generateHTML(json as JSONContent, createServerExtensions() as unknown as []);

  if (id) {
    try {
      // Обновление существующего документа делаем транзакцией, чтобы версия и история были согласованы.
      const doc = await prisma.$transaction(async (tx) => {
        const existing = await tx.document.findFirst({ where: { id, workspaceId } });
        if (!existing) throw new Error('NOT_FOUND');

        const data = {
          title,
          json,
          html,
          updatedBy: actorId,
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
      // Для отсутствующего документа возвращаем 404, остальные ошибки логируем.
      if (error instanceof Error && error.message === 'NOT_FOUND') {
        return new Response('Not found', { status: 404 });
      }
      console.error('Failed to save document', error);
      return new Response('Server error', { status: 500 });
    }
  }

  try {
    // Создание нового документа: сразу фиксируем workspace и авторов.
    const doc = await prisma.document.create({
      data: {
        title,
        json,
        html,
        workspaceId,
        createdBy: actorId,
        updatedBy: actorId,
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
    // При неожиданных ошибках шлём 500 и логируем для отладки.
    console.error('Failed to create document', error);
    return new Response('Server error', { status: 500 });
  }
}
