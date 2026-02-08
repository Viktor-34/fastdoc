import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { WORKSPACE_COOKIE, WORKSPACE_HEADER } from '@/lib/workspace-constants';
import type { Prisma } from '@prisma/client';
import { apiError, apiSuccess } from '@/lib/api/response';

type TrackBody = { token: string; event: string; uid: string; meta?: Prisma.InputJsonValue; ref?: string };

function mergeMeta(meta: Prisma.InputJsonValue | undefined, workspaceId: string): Prisma.InputJsonValue {
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    return { ...(meta as Record<string, unknown>), workspaceId };
  }
  return { workspaceId, value: meta ?? null };
}

export async function POST(req: NextRequest) {
  let body: TrackBody;
  try {
    body = (await req.json()) as TrackBody;
  } catch {
    return apiError('Bad', 400);
  }

  const { token, event, uid, meta, ref } = body;
  if (!token || !event || !uid) return apiError('Bad', 400);
  
  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: { 
      Proposal: { select: { workspaceId: true } },
    },
  });
  
  if (!shareLink) return apiError('Not found', 404);

  const workspaceId = shareLink.Proposal?.workspaceId;
  if (!workspaceId) return apiError('No workspace', 400);
  
  const explicitWorkspace =
    req.headers.get(WORKSPACE_HEADER)?.trim() ??
    req.cookies.get(WORKSPACE_COOKIE)?.value?.trim() ??
    null;
  if (explicitWorkspace && explicitWorkspace !== workspaceId) {
    return apiError('Forbidden', 403);
  }

  await prisma.events.create({
    data: {
      token,
      event,
      uid,
      meta: mergeMeta(meta, workspaceId),
      ref,
    },
  });
  return apiSuccess({ ok: true });
}
