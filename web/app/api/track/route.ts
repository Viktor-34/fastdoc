import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

type TrackBody = { token: string; event: string; uid: string; meta?: Prisma.InputJsonValue; ref?: string };

export async function POST(req: NextRequest) {
  const { token, event, uid, meta, ref } = (await req.json()) as TrackBody;
  if (!token || !event || !uid) return new Response('Bad', { status: 400 });
  await prisma.events.create({ data: { token, event, uid, meta, ref } });
  return new Response('ok');
}


