import { prisma } from '@/lib/db/prisma';
import { NextRequest } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { DEFAULT_WORKSPACE_ID } from '@/lib/workspace-constants';

export const runtime = 'nodejs';

// Возвращает документ по ID (JSON + HTML), используется редактором.
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return new Response('Bad request', { status: 400 });

  const session = await getServerAuthSession();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const workspaceId = session.user.workspaceId ?? DEFAULT_WORKSPACE_ID;

  try {
    const doc = await prisma.document.findFirst({ where: { id, workspaceId } });
    if (!doc) return new Response('Not found', { status: 404 });
    return Response.json({
      id: doc.id,
      title: doc.title,
      json: doc.json,
      html: doc.html,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    console.error('Failed to fetch document', error);
    return new Response('Server error', { status: 500 });
  }
}

// Полное удаление документа вместе с версией и шаринг-ссылками.
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return new Response('Bad request', { status: 400 });

  const session = await getServerAuthSession();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const workspaceId = session.user.workspaceId ?? DEFAULT_WORKSPACE_ID;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.document.findFirst({ where: { id, workspaceId } });
      if (!existing) {
        throw new Error('NOT_FOUND');
      }
      await tx.shareLink.deleteMany({ where: { documentId: id } });
      await tx.documentVersion.deleteMany({ where: { documentId: id } });
      await tx.document.delete({ where: { id } });
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return new Response('Not found', { status: 404 });
    }
    console.error('Failed to delete document', error);
    return new Response('Server error', { status: 500 });
  }
}
