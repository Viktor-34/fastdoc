import { prisma } from '@/lib/db/prisma';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Возвращает документ по ID (JSON + HTML), используется редактором.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) return new Response('Bad request', { status: 400 });

  try {
    const doc = await prisma.document.findUnique({ where: { id } });
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
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) return new Response('Bad request', { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.shareLink.deleteMany({ where: { documentId: id } });
      await tx.documentVersion.deleteMany({ where: { documentId: id } });
      await tx.document.delete({ where: { id } });
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete document', error);
    return new Response('Server error', { status: 500 });
  }
}
