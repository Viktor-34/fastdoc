import Link from "next/link";

import { ProductForm } from "@/components/product-form";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getServerAuthSession } from "@/lib/auth";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-constants";

// Страница создания нового товара каталога.
export default async function CatalogNewPage() {
  // Используем активную рабочую область, чтобы привязать товар к ней.
  const session = await getServerAuthSession();
  const workspaceId = session?.user.workspaceId ?? DEFAULT_WORKSPACE_ID;

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-white shadow-sm">
      <SiteHeader
        title="Новый товар"
        actions={
          <Button asChild variant="ghost" size="sm" className="text-sm text-neutral-500 hover:text-neutral-900">
            <Link href="/catalog">Назад</Link>
          </Button>
        }
      />
      <main className="mx-auto flex w-full flex-1 flex-col gap-6 bg-white px-4 pb-10 pt-6 md:px-6">
        <ProductForm workspaceId={workspaceId} />
      </main>
    </div>
  );
}
