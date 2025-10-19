import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { getServerAuthSession } from '@/lib/auth';
import { DEFAULT_WORKSPACE_ID } from '@/lib/workspace-constants';

export const runtime = 'nodejs';

const TOKEN_BYTES = 10;

function generateToken() {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const session = await getServerAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const workspaceId = session.user.workspaceId ?? DEFAULT_WORKSPACE_ID;

  try {
    const document = await prisma.document.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    let share = await prisma.shareLink.findFirst({
      where: { documentId: id },
      orderBy: { createdAt: 'desc' },
    });

    if (!share) {
      share = await prisma.shareLink.create({
        data: {
          documentId: id,
          token: generateToken(),
          allowPdf: true,
        },
      });
    }

    return NextResponse.json({ token: share.token });
  } catch (error) {
    console.error('Failed to generate share link', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
