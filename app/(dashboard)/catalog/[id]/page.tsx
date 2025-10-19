import { notFound } from "next/navigation";

import { ProductForm } from "@/components/product-form";
import { prisma } from "@/lib/db/prisma";
import { getActiveWorkspaceId } from "@/lib/workspace";

/* Пропсы страницы редактирования: динамический параметр id приходит через params. */
type CatalogEditPageProps = {
  params: Promise<{ id: string }>;
};

// Страница редактирования товара каталога.
export default async function CatalogEditPage({ params }: CatalogEditPageProps) {
  const { id } = await params;
  // Определяем рабочую область, чтобы не дать отредактировать чужие товары.
  const workspaceId = await getActiveWorkspaceId();

  // Загружаем товар и его строки расшифровки.
  const product = await prisma.product.findFirst({
    where: { id, workspaceId },
    include: { priceItems: { orderBy: { createdAt: "asc" } } },
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
    priceItems: product.priceItems.map((item) => ({
      id: item.id,
      label: item.label,
      qty: item.qty,
      unitPrice: Number(item.unitPrice),
      discount: item.discount != null ? Number(item.discount) : 0,
    })),
  } as const;

  return (
    <div className="w-full pb-12">
      {/* Заполняем форму начальными значениями для редактирования. */}
      <ProductForm productId={product.id} initialState={initialState} workspaceId={workspaceId} />
    </div>
  );
}
