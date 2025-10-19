"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* Карточка товара для таблицы. */
interface ProductItem {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  currency: string;
  basePrice: number;
  updatedAt: string;
}

/* Пропсы таблицы каталога. */
interface CatalogTableProps {
  initialProducts: ProductItem[];
}

// Таблица каталога: поиск по товарам и список с возможностью редактировать.
export default function CatalogTable({ initialProducts }: CatalogTableProps) {
  const [query, setQuery] = useState("");
  const [products] = useState(initialProducts);

  // Фильтруем товары по названию, SKU или описанию.
  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    if (!lower) return products;
    return products.filter((product) =>
      [product.name, product.sku ?? "", product.description ?? ""].some((field) =>
        field.toLowerCase().includes(lower),
      ),
    );
  }, [products, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Поле поиска по товарам. */}
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по названию или SKU"
          className="w-full max-w-sm rounded-xl border-neutral-200 bg-white text-sm"
        />
        {/* Переход к созданию нового товара. */}
        <Button asChild className="h-9 rounded-xl px-4 text-sm font-medium">
          <Link href="/catalog/new">+ Добавить товар</Link>
        </Button>
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_0.8fr] border-b border-neutral-100 bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-800 md:px-6">
          <span>Название</span>
          <span className="text-center md:text-left">SKU</span>
          <span className="text-center md:text-left">Цена</span>
          <span className="text-center md:text-left">Обновлено</span>
          <span className="text-right">Действия</span>
        </div>

        <div className="bg-white">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_0.8fr] items-center gap-4 border-b border-neutral-100 px-4 py-3 text-sm transition hover:bg-neutral-50 md:px-6"
            >
              <div className="pr-4">
                <Link href={`/catalog/${product.id}`} className="font-medium text-neutral-900">
                  {product.name}
                </Link>
              </div>
              <div className="flex justify-center md:justify-start">
                {/* Показываем SKU бейджем, если он задан. */}
                {product.sku ? (
                  <Badge
                    variant="secondary"
                    className="inline-flex rounded-full bg-neutral-100 px-3 text-neutral-700"
                  >
                    {product.sku}
                  </Badge>
                ) : (
                  <span className="text-xs text-neutral-400">—</span>
                )}
              </div>
              <div className="text-neutral-900">
                {/* Форматируем цену с учётом валюты. */}
                {new Intl.NumberFormat("ru-RU", {
                  style: "currency",
                  currency: product.currency,
                  maximumFractionDigits: 2,
                }).format(product.basePrice)}
              </div>
              <div className="text-xs text-neutral-500">
                {/* Дата последнего обновления товара. */}
                {new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(
                  new Date(product.updatedAt),
                )}
              </div>
              <div className="text-right">
                {/* Кнопка перехода к редактированию записи. */}
                <Button asChild variant="ghost" size="icon" className="text-neutral-600 hover:text-neutral-900">
                  <Link href={`/catalog/${product.id}`} aria-label="Редактировать">
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-neutral-500">
            Ничего не найдено. Попробуйте изменить запрос.
          </div>
        )}
      </section>
    </div>
  );
}
