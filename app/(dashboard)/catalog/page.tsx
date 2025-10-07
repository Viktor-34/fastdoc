import Link from "next/link";
import { Box, Clock, Layers, TrendingUp } from "lucide-react";

import CatalogTable from "@/components/CatalogTable";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { getActiveWorkspaceId } from "@/lib/workspace";

export default async function CatalogPage() {
  const workspaceId = getActiveWorkspaceId();

  const products = await prisma.product.findMany({
    where: { workspaceId },
    include: { priceItems: true },
    orderBy: { updatedAt: "desc" },
  });

  const serialized = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    currency: product.currency,
    basePrice: product.basePrice.toNumber(),
    updatedAt: product.updatedAt.toISOString(),
  }));

  const now = Date.now();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const updatedLast7Days = serialized.filter(
    (product) => now - new Date(product.updatedAt).getTime() <= 7 * MS_PER_DAY,
  ).length;
  const currencies = new Set(serialized.map((product) => product.currency)).size;
  const pricedProducts = serialized.filter((product) => product.basePrice > 0).length;
  const latestProduct = serialized[0];
  const latestUpdatedAt = latestProduct ? new Date(latestProduct.updatedAt) : null;

  const statsCards = [
    {
      title: "Всего товаров",
      value: serialized.length.toString(),
      badge:
        updatedLast7Days > 0
          ? { label: `+${updatedLast7Days} за 7 дней`, icon: TrendingUp }
          : undefined,
    },
    {
      title: "С ценой",
      value: pricedProducts.toString(),
      badge: pricedProducts > 0 ? { label: "Готовы к вставке", icon: Box } : undefined,
    },
    {
      title: "Валюты",
      value: currencies.toString(),
      badge: currencies > 1 ? { label: "Несколько валют", icon: Layers } : undefined,
    },
    {
      title: "Последнее обновление",
      value: latestUpdatedAt
        ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(latestUpdatedAt)
        : "—",
      badge: latestUpdatedAt
        ? {
            label: new Intl.DateTimeFormat("ru-RU", { timeStyle: "short" }).format(latestUpdatedAt),
            icon: Clock,
          }
        : undefined,
    },
  ];

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-white shadow-sm">
      <SiteHeader
        label="Каталог"
        title="Каталог товаров"
        description="Используйте готовые позиции для блока «Таблица цен»."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/catalog/new">Добавить товар</Link>
          </Button>
        }
      />
      <main className="mx-auto flex w-full flex-1 flex-col gap-6 bg-white px-4 pb-10 pt-6 md:px-6">
        <SectionCards cards={statsCards} />
        <CatalogTable initialProducts={serialized} />
      </main>
    </div>
  );
}
