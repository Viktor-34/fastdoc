import { NextRequest } from 'next/server';
import { generateHTML } from '@tiptap/html';
import { prisma } from '@/lib/db/prisma';
import { createServerExtensions } from '@/lib/tiptap/extensions';
import { getServerAuthSession } from '@/lib/auth';
import { getActiveWorkspaceId } from '@/lib/workspace';
import type { Prisma } from '@prisma/client';
import type { JSONContent } from '@tiptap/core';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  // Шаблоны всегда привязаны к рабочей области.
  const workspaceId = await getActiveWorkspaceId(
    req.nextUrl.searchParams.get('workspaceId') ?? session.user.workspaceId,
  );
  const templates = await prisma.template.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json({ templates });
}

type TemplateCreateBody = {
  action?: 'create' | 'apply';
  name?: string;
  templateId?: string;
  documentId?: string;
  json?: Prisma.JsonValue;
  workspaceId?: string;
  title?: string;
};

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const actorId = session.user.id;
  const body = (await req.json()) as TemplateCreateBody;
  const action = body.action ?? (body.templateId ? 'apply' : 'create');
  const workspaceId = await getActiveWorkspaceId(body.workspaceId ?? session.user.workspaceId);

  if (action === 'apply') {
    if (!body.templateId) return new Response('templateId required', { status: 400 });
    // Находим шаблон и создаём по нему документ.
    const template = await prisma.template.findFirst({
      where: { id: body.templateId, workspaceId },
    });
    if (!template) return new Response('Template not found', { status: 404 });

    const targetWorkspaceId = await getActiveWorkspaceId(body.workspaceId ?? template.workspaceId);
    const document = await prisma.document.create({
      data: {
        title: body.title ?? template.name,
        json: template.json,
        html: template.html,
        workspaceId: targetWorkspaceId,
        createdBy: actorId,
        updatedBy: actorId,
        version: 0,
      },
    });
    return Response.json({ document });
  }

  if (!body.name) return new Response('name required', { status: 400 });

  if (!body.documentId && body.json == null) {
    return new Response('json or documentId required', { status: 400 });
  }

  let json: Prisma.JsonValue | undefined = body.json;
  let html: string;
  if (body.documentId) {
    const document = await prisma.document.findFirst({
      where: { id: body.documentId, workspaceId },
    });
    if (!document) return new Response('Document not found', { status: 404 });
    json = document.json;
    html = document.html;
  } else {
    // Если передали JSON напрямую, пересобираем HTML на сервере.
    html = generateHTML(json as JSONContent, createServerExtensions() as unknown as []);
  }

  const template = await prisma.template.create({
    data: {
      name: body.name,
      workspaceId,
      json: json!,
      html,
    },
  });

  return Response.json({ template });
}

type TemplateUpdateBody = {
  id?: string;
  name?: string;
  json?: Prisma.JsonValue;
};

export async function PUT(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { id, name, json } = (await req.json()) as TemplateUpdateBody;
  if (!id) return new Response('id required', { status: 400 });

  const workspaceId = await getActiveWorkspaceId(session.user.workspaceId);
  // Не даём вмешиваться в чужие шаблоны.
  const existing = await prisma.template.findFirst({ where: { id, workspaceId } });
  if (!existing) return new Response('Template not found', { status: 404 });

  const data: Prisma.TemplateUpdateInput = {};
  if (typeof name === 'string') data.name = name;
  if (json !== undefined) {
    data.json = json;
    data.html = generateHTML(json as JSONContent, createServerExtensions() as unknown as []);
  }

  if (Object.keys(data).length === 0) {
    return new Response('Nothing to update', { status: 400 });
  }

  const template = await prisma.template.update({ where: { id }, data });
  return Response.json({ template });
}

type TemplateDeleteBody = {
  id?: string;
};

export async function DELETE(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { id } = (await req.json()) as TemplateDeleteBody;
  if (!id) return new Response('id required', { status: 400 });
  const workspaceId = await getActiveWorkspaceId(session.user.workspaceId);
  // Удалять можно только внутри своей рабочей области.
  const existing = await prisma.template.findFirst({ where: { id, workspaceId } });
  if (!existing) return new Response('Template not found', { status: 404 });
  await prisma.template.delete({ where: { id } });
  return new Response('ok');
}
