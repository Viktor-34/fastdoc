import { ProductForm } from "@/components/product-form";
import { getActiveWorkspaceId } from "@/lib/workspace";

// Страница создания нового товара каталога.
export default async function CatalogNewPage() {
  // Используем активную рабочую область, чтобы привязать товар к ней.
  const workspaceId = await getActiveWorkspaceId();

  return (
    <div className="w-full pb-12">
      {/* Показываем пустую форму, workspaceId нужен для API-запросов. */}
      <ProductForm workspaceId={workspaceId} />
    </div>
  );
}
