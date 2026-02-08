import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerAuthSession } from '@/lib/auth';
import { getActiveWorkspaceId } from '@/lib/workspace';
import type { Prisma } from '@prisma/client';
import { apiError, apiSuccess } from '@/lib/api/response';

export const runtime = 'nodejs';

// Приводим числовые поля Prisma к обычным number и сериализуем позиции.
function serializeProduct(product: Prisma.ProductGetPayload<{ include: { PriceItem: true } }>) {
  return {
    ...product,
    basePrice: Number(product.basePrice),
    priceItems: product.PriceItem.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      discount: item.discount != null ? Number(item.discount) : null,
    })),
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return apiError('Unauthorized', 401);
  }
  // Подмешиваем активную рабочую область (из запроса или куки).
  const workspaceId = await getActiveWorkspaceId(
    req.nextUrl.searchParams.get('workspaceId') ?? session.user.workspaceId,
  );
  const products = await prisma.product.findMany({
    where: { workspaceId },
    include: { PriceItem: true },
    orderBy: { name: 'asc' },
  });
  return apiSuccess({ products: products.map(serializeProduct) });
}

type ProductCreateBody = {
  name: string;
  sku?: string | null;
  description?: string | null;
  currency?: string;
  basePrice: number;
  priceItems?: Array<{
    label: string;
    qty?: number;
    unitPrice: number;
    discount?: number | null;
  }>;
  workspaceId?: string;
};

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return apiError('Unauthorized', 401);
  }
  const body = (await req.json()) as ProductCreateBody;
  const workspaceId = await getActiveWorkspaceId(body.workspaceId ?? session.user.workspaceId);
  if (!body?.name || typeof body.basePrice !== 'number') {
    return apiError('name and basePrice required', 400);
  }

  try {
    const product = await prisma.product.create({
      data: {
        name: body.name,
        sku: body.sku ?? null,
        description: body.description ?? null,
        currency: body.currency ?? 'RUB',
        basePrice: body.basePrice,
        workspaceId,
        PriceItem: body.priceItems?.length
          ? {
              create: body.priceItems.map((item) => ({
                label: item.label,
                qty: item.qty ?? 1,
                unitPrice: item.unitPrice,
                discount: item.discount ?? undefined,
              })),
            }
          : undefined,
      },
      include: { PriceItem: true },
    });

    return apiSuccess({ product: serializeProduct(product) });
  } catch (error) {
    console.error('Failed to create product:', error);
    return apiError(
      error instanceof Error ? error.message : 'Failed to create product',
      500,
    );
  }
}

type ProductUpdateBody = {
  id?: string;
  name?: string;
  description?: string | null;
  sku?: string | null;
  currency?: string;
  basePrice?: number;
  priceItems?: Array<{
    id?: string;
    label: string;
    qty?: number;
    unitPrice: number;
    discount?: number | null;
  }>;
  workspaceId?: string;
};

export async function PUT(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return apiError('Unauthorized', 401);
  }
  const { id, priceItems, workspaceId: workspaceOverride, ...rest } =
    (await req.json()) as ProductUpdateBody;
  if (!id) return apiError('id required', 400);

  // Убеждаемся, что пользователь работает в рамках своей рабочей области.
  const workspaceId = await getActiveWorkspaceId(workspaceOverride ?? session.user.workspaceId);

  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct || existingProduct.workspaceId !== workspaceId) {
    return apiError('not found', 404);
  }

  const data: Prisma.ProductUpdateInput = {};
  if (rest.name !== undefined) data.name = rest.name;
  if (rest.description !== undefined) data.description = rest.description;
  if (rest.sku !== undefined) data.sku = rest.sku;
  if (rest.currency !== undefined) data.currency = rest.currency;
  if (rest.basePrice !== undefined) data.basePrice = rest.basePrice;

  const txResult = await prisma.$transaction(async (tx) => {
    if (priceItems) {
      const existing = await tx.priceItem.findMany({ where: { productId: id } });
      const keepIds = priceItems.map((item) => item.id).filter(Boolean) as string[];
      const deleteIds = existing
        .map((item) => item.id)
        .filter((existingId) => !keepIds.includes(existingId));
      if (deleteIds.length) {
        await tx.priceItem.deleteMany({ where: { id: { in: deleteIds } } });
      }
      // Обновляем или создаём позиции по списку, синхронизируя таблицу.
      for (const item of priceItems) {
        if (item.id) {
          await tx.priceItem.update({
            where: { id: item.id },
            data: {
              label: item.label,
              qty: item.qty ?? 1,
              unitPrice: item.unitPrice,
              discount: item.discount ?? undefined,
            },
          });
        } else {
          await tx.priceItem.create({
            data: {
              productId: id,
              label: item.label,
              qty: item.qty ?? 1,
              unitPrice: item.unitPrice,
              discount: item.discount ?? undefined,
            },
          });
        }
      }
    }

    return tx.product.update({
      where: { id },
      data,
      include: { PriceItem: true },
    });
  });

  return apiSuccess({ product: serializeProduct(txResult) });
}

type ProductDeleteBody = { id?: string };

export async function DELETE(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return apiError('Unauthorized', 401);
  }
  const { id } = (await req.json()) as ProductDeleteBody;
  if (!id) return apiError('id required', 400);

  // Проверяем принадлежность записи текущему workspace перед удалением.
  const workspaceId = await getActiveWorkspaceId(session.user.workspaceId);
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.workspaceId !== workspaceId) {
    return apiError('not found', 404);
  }

  await prisma.product.delete({ where: { id } });
  return apiSuccess({ ok: true });
}
