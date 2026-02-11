import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/product-form";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-constants";

/* Пропсы страницы редактирования: динамический параметр id приходит через params. */
type CatalogEditPageProps = {
  params: Promise<{ id: string }>;
};

// Страница редактирования товара каталога.
export default async function CatalogEditPage({ params }: CatalogEditPageProps) {
  const { id } = await params;
  // Определяем рабочую область, чтобы не дать отредактировать чужие товары.
  const session = await getServerAuthSession();
  const workspaceId = session?.user.workspaceId ?? DEFAULT_WORKSPACE_ID;

  // Загружаем товар и его строки расшифровки.
  const product = await prisma.product.findFirst({
    where: { id, workspaceId },
    include: { PriceItem: { orderBy: { createdAt: "asc" } } },
  });

  if (!product) {
    return notFound();
  }

  const initialState = {
    name: product.name,
    sku: product.sku ?? "",
    description: product.description ?? "",
    currency: product.currency,
    basePrice: Number(product.basePrice),
    priceItems: product.PriceItem.map((item) => ({
      id: item.id,
      label: item.label,
      qty: item.qty,
      unitPrice: Number(item.unitPrice),
      discount: item.discount != null ? Number(item.discount) : 0,
    })),
  } as const;

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-white shadow-sm">
      <SiteHeader
        title="Редактирование товара"
        actions={
          <Button asChild variant="ghost" size="sm" className="text-sm text-neutral-500 hover:text-neutral-900">
            <Link href="/catalog">Назад</Link>
          </Button>
        }
      />
      <main className="mx-auto flex w-full flex-1 flex-col gap-6 bg-white px-4 pb-10 pt-6 md:px-6">
        <ProductForm productId={product.id} initialState={initialState} workspaceId={workspaceId} />
      </main>
    </div>
  );
}
