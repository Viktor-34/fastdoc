"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductItem {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  currency: string;
  basePrice: number;
  updatedAt: string;
}

interface CatalogTableProps {
  initialProducts: ProductItem[];
}

export default function CatalogTable({ initialProducts }: CatalogTableProps) {
  const [query, setQuery] = useState("");
  const [products] = useState(initialProducts);

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
    <Card className="gap-0 p-0">
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Позиции каталога</CardTitle>
          <p className="text-sm text-neutral-500">
            Используйте поиск, чтобы быстро найти готовую позицию для таблицы цен.
          </p>
        </div>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по названию или SKU"
          className="w-full max-w-sm"
        />
      </CardHeader>
      <CardContent className="px-0 pb-6">
        <div className="px-4 md:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[35%]">Название</TableHead>
                <TableHead className="w-[15%]">SKU</TableHead>
                <TableHead className="w-[20%]">Цена</TableHead>
                <TableHead className="w-[20%]">Обновлено</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id} className="transition-colors">
                  <TableCell className="align-top">
                    <div className="font-medium text-neutral-900">{product.name}</div>
                    {product.description && (
                      <p className="mt-1 text-xs text-neutral-500">{product.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-xs text-neutral-500">
                    {product.sku ? <Badge variant="secondary">{product.sku}</Badge> : "—"}
                  </TableCell>
                  <TableCell className="align-top font-medium">
                    {new Intl.NumberFormat("ru-RU", {
                      style: "currency",
                      currency: product.currency,
                      maximumFractionDigits: 2,
                    }).format(product.basePrice)}
                  </TableCell>
                  <TableCell className="align-top text-xs text-neutral-500">
                    {new Date(product.updatedAt).toLocaleDateString("ru-RU")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filtered.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-neutral-500">
            Ничего не найдено. Попробуйте изменить запрос.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
