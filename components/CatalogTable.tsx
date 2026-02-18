"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";

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

const TABLE_BORDER_COLOR = "hsl(30deg 3.3% 11.8% / 15%)";
const TABLE_HEADER_BG = "rgb(243, 242, 240)";
const TABLE_TEXT_PRIMARY = "#3d3d3a";
const TABLE_TEXT_MUTED = "#73726c";

// Таблица каталога: поиск по товарам и список с возможностью редактировать.
export default function CatalogTable({ initialProducts }: CatalogTableProps) {
  const [query, setQuery] = useState("");
  const [products] = useState(initialProducts);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Вычисляем пагинацию
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filtered.slice(startIndex, endIndex);

  // Сбрасываем на первую страницу при изменении фильтра
  useMemo(() => {
    setCurrentPage(1);
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Поле поиска по товарам. */}
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Посик по названию или артиклу"
          className="w-full max-w-sm"
        />
        {/* Переход к созданию нового товара. */}
        <Button
          asChild
          className="h-9 rounded-xl bg-[#C6613F] px-4 text-sm font-medium text-[#FAFAFA] shadow-[0px_1px_2px_0px_rgba(10,10,10,0.06)] hover:bg-[#A04F33]"
        >
          <Link href="/catalog/new">Добавить товар</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: TABLE_BORDER_COLOR }}>
        <div className="overflow-x-auto">
          <div className="min-w-[920px]">
            {/* Заголовок таблицы */}
            <div
              className="flex h-10 items-center gap-8 border-b"
              style={{ borderColor: TABLE_BORDER_COLOR, backgroundColor: TABLE_HEADER_BG }}
            >
              <div className="min-w-[220px] flex-1 px-[10px] pl-[26px]">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>Название</span>
              </div>
              <div className="w-[180px] shrink-0 px-2">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>SKU</span>
              </div>
              <div className="w-[180px] shrink-0 px-2">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>Цена</span>
              </div>
              <div className="w-[220px] shrink-0 px-2 pl-6">
                <span className="text-[12px] font-medium tracking-tight" style={{ color: TABLE_TEXT_PRIMARY }}>Обновлено</span>
              </div>
              <div className="w-[120px] shrink-0 px-2"></div>
            </div>

            {/* Тело таблицы */}
            <div className="bg-white">
              {paginatedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-8 border-b transition-colors hover:bg-neutral-50"
                  style={{ borderColor: TABLE_BORDER_COLOR }}
                >
                  {/* Название */}
                  <div className="min-w-[220px] flex-1 px-[10px] py-2 pl-[26px]">
                    <Link
                      href={`/catalog/${product.id}`}
                      className="block truncate text-[14px] font-medium tracking-tight transition-colors hover:text-neutral-700"
                      style={{ color: TABLE_TEXT_PRIMARY }}
                    >
                      {product.name}
                    </Link>
                  </div>

                  {/* SKU */}
                  <div className="flex w-[180px] shrink-0 items-center px-2 py-2">
                    {product.sku ? (
                      <div
                        className="flex h-[22px] items-center justify-center rounded-full border px-[10px]"
                        style={{ backgroundColor: "#F3F2F0", borderColor: TABLE_BORDER_COLOR }}
                      >
                        <span className="max-w-[150px] truncate text-[12px] font-medium" style={{ color: TABLE_TEXT_PRIMARY }}>
                          {product.sku}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </div>

                  {/* Цена */}
                  <div className="w-[180px] shrink-0 px-2 py-2 text-sm font-medium" style={{ color: TABLE_TEXT_PRIMARY }}>
                    {new Intl.NumberFormat("ru-RU", {
                      style: "currency",
                      currency: product.currency,
                      maximumFractionDigits: 2,
                    }).format(product.basePrice)}
                  </div>

                  {/* Обновлено */}
                  <div className="flex w-[220px] shrink-0 items-center px-2 py-2 pl-6">
                    <span className="whitespace-nowrap text-[12px] font-medium" style={{ color: TABLE_TEXT_PRIMARY }}>
                      {new Intl.DateTimeFormat("ru-RU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }).format(new Date(product.updatedAt))}{" "}
                      {new Intl.DateTimeFormat("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit"
                      }).format(new Date(product.updatedAt))}
                    </span>
                  </div>

                  {/* Действия */}
                  <div className="flex w-[120px] shrink-0 items-center px-2">
                    <Link
                      href={`/catalog/${product.id}`}
                      className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                      style={{ color: TABLE_TEXT_MUTED }}
                      aria-label="Редактировать"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="bg-white px-6 py-10 text-center text-sm text-neutral-500">
            Ничего не найдено. Попробуйте изменить запрос.
          </div>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          {/* Левая часть - выбор количества элементов */}
          <div className="flex items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-9 rounded-lg border border-[var(--field-border)] bg-white px-[13px] py-[9px] text-xs shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
              style={{ color: TABLE_TEXT_PRIMARY }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Правая часть - кнопки навигации */}
          <div className="flex items-center gap-2">
            <span className="mr-8 text-sm" style={{ color: TABLE_TEXT_MUTED }}>
              {startIndex + 1}-{Math.min(endIndex, filtered.length)} из {filtered.length}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex size-8 items-center justify-center rounded-lg border bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: TABLE_BORDER_COLOR, color: TABLE_TEXT_MUTED }}
              title="Предыдущая страница"
            >
              <ChevronLeft className="size-4" />
            </button>

            {/* Номера страниц */}
            {Array.from({ length: Math.min(6, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 6) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex size-8 items-center justify-center rounded-lg text-sm transition-colors ${
                    currentPage === pageNum
                      ? "bg-[#C6613F] text-white"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex size-8 items-center justify-center rounded-lg border bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: TABLE_BORDER_COLOR, color: TABLE_TEXT_MUTED }}
              title="Следующая страница"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
