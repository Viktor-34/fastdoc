import { ProductForm } from "@/components/product-form";
import { getServerAuthSession } from "@/lib/auth";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-constants";

// Страница создания нового товара каталога.
export default async function CatalogNewPage() {
  // Используем активную рабочую область, чтобы привязать товар к ней.
  const session = await getServerAuthSession();
  const workspaceId = session?.user.workspaceId ?? DEFAULT_WORKSPACE_ID;

  return (
    <div className="w-full pb-12">
      {/* Показываем пустую форму, workspaceId нужен для API-запросов. */}
      <ProductForm workspaceId={workspaceId} />
    </div>
  );
}
