import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

const TOKEN_BYTES = 10;

function generateToken() {
  return randomBytes(TOKEN_BYTES).toString('hex');
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  try {
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
