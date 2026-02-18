import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerAuthSession } from '@/lib/auth';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { sanitizeTemplateDefaults, sanitizeTemplateSections } from '@/lib/proposal-templates/mapping';

export const runtime = 'nodejs';

const nullableText = z.string().optional().nullable();

// Схема для создания шаблона
const createTemplateSchema = z.object({
  name: z.string().trim().min(1),
  description: nullableText,
  category: nullableText,
  defaults: z.record(z.string(), z.unknown()),
  sections: z.array(z.string()),
  isDefault: z.boolean().optional(),
});

// Схема для обновления шаблона
const updateTemplateSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).optional(),
  description: nullableText,
  category: nullableText,
  isDefault: z.boolean().optional(),
});

const toNullableText = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// GET /api/proposal-templates - получить все шаблоны
export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.proposalTemplate.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('GET /api/proposal-templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/proposal-templates - создать новый шаблон
export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, description, category, defaults, sections, isDefault } = parsed.data;
    const workspaceId = session.user.workspaceId;
    const sanitizedDefaults = sanitizeTemplateDefaults(defaults);
    const sanitizedSections = sanitizeTemplateSections(sections);

    const template = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.proposalTemplate.updateMany({
          where: { workspaceId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.proposalTemplate.create({
        data: {
          workspaceId,
          name,
          description: toNullableText(description),
          category: toNullableText(category),
          defaults: sanitizedDefaults as Prisma.InputJsonValue,
          sections: sanitizedSections as Prisma.InputJsonValue,
          isDefault: isDefault ?? false,
        },
      });
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('POST /api/proposal-templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/proposal-templates - обновить шаблон
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { id, name, description, category, isDefault } = parsed.data;

    // Проверяем, что шаблон принадлежит workspace
    const existing = await prisma.proposalTemplate.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const data: Prisma.ProposalTemplateUpdateInput = {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description: toNullableText(description) }),
      ...(category !== undefined && { category: toNullableText(category) }),
      ...(isDefault !== undefined && { isDefault }),
    };

    const workspaceId = session.user.workspaceId;
    const template = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.proposalTemplate.updateMany({
          where: { workspaceId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return tx.proposalTemplate.update({
        where: { id },
        data,
      });
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('PATCH /api/proposal-templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/proposal-templates - удалить шаблон
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Проверяем, что шаблон принадлежит workspace
    const existing = await prisma.proposalTemplate.findFirst({
      where: { id, workspaceId: session.user.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    await prisma.proposalTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/proposal-templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

