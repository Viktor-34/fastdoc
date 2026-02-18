"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { withWorkspaceHeader } from "@/lib/workspace-client";
import { DEFAULT_WORKSPACE_ID } from "@/lib/workspace-constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Состояние одной строки расшифровки цены.
type PriceItemState = {
  id?: string;
  label: string;
  qty: number;
  unitPrice: number;
  discount: number;
};

// Полное состояние формы товара.
type ProductFormState = {
  name: string;
  sku: string;
  description: string;
  currency: string;
  basePrice: number;
  priceItems: PriceItemState[];
};

// Пропсы формы: можно передать ID товара и начальные значения.
type ProductFormProps = {
  productId?: string;
  initialState?: Partial<ProductFormState>;
  workspaceId?: string;
};

type FieldErrors = Partial<Record<Exclude<keyof ProductFormState, "priceItems">, string>> & {
  priceItems?: string[];
};

const currencyOptions = ["RUB", "USD", "EUR"] as const;
const FIELD_BORDER_COLOR = "hsl(30deg 3.3% 11.8% / 15%)";
const LABEL_COLOR = "#3d3d3a";
const MUTED_COLOR = "#73726c";

const emptyPriceItem: PriceItemState = {
  label: "",
  qty: 1,
  unitPrice: 0,
  discount: 0,
};

// Форма создания/редактирования товара с расшифровкой стоимости.
export function ProductForm({ productId, initialState, workspaceId = DEFAULT_WORKSPACE_ID }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Собираем стартовое состояние: подставляем значения из пропсов и нормализуем строки расшифровки.
  const [state, setState] = useState<ProductFormState>(() => ({
    name: "",
    sku: "",
    description: "",
    currency: "RUB",
    basePrice: 0,
    ...initialState,
    priceItems: initialState?.priceItems?.map((item) => ({
      ...emptyPriceItem,
      ...item,
      qty: item.qty ?? 1,
      unitPrice: item.unitPrice ?? 0,
      discount: item.discount ?? 0,
    })) ?? initialState?.priceItems ?? [],
  }));

  // Считаем итог по расшифровке, чтобы показать пользователю сумму.
  const totals = useMemo(() => {
    return state.priceItems.reduce((acc, item) => {
      const qty = Number.isFinite(item.qty) ? item.qty : 0;
      const price = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;
      const discount = Number.isFinite(item.discount) ? item.discount : 0;
      const discounted = price * (1 - discount / 100);
      return acc + qty * Math.max(discounted, 0);
    }, 0);
  }, [state.priceItems]);

  // Проверка полей формы: возвращаем объект ошибок для отображения подсказок.
  const findErrors = (next: ProductFormState): FieldErrors => {
    const nextErrors: FieldErrors = {};
    if (!next.name || next.name.trim().length < 3) {
      nextErrors.name = "Введите название (минимум 3 символа).";
    }
    if (next.name.trim().length > 120) {
      nextErrors.name = "Максимальная длина — 120 символов.";
    }
    if (next.sku && !/^[A-Za-z0-9-_]+$/.test(next.sku)) {
      nextErrors.sku = "Разрешены латиница, цифры, дефис и подчёркивание.";
    }
    if (next.sku && next.sku.length > 32) {
      nextErrors.sku = "Максимальная длина — 32 символа.";
    }
    if (next.description && next.description.length > 500) {
      nextErrors.description = "Максимальная длина — 500 символов.";
    }
    if (!next.currency) {
      nextErrors.currency = "Выберите валюту.";
    }
    if (!Number.isFinite(next.basePrice) || next.basePrice < 0) {
      nextErrors.basePrice = "Цена должна быть неотрицательным числом.";
    }

    if (next.priceItems.length) {
      nextErrors.priceItems = next.priceItems.map((item) => {
        if (!item.label || item.label.trim().length < 2) {
          return "Название строки должно содержать минимум 2 символа.";
        }
        if (!Number.isFinite(item.qty) || item.qty < 1) {
          return "Количество должно быть больше нуля.";
        }
        if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
          return "Цена строки должна быть неотрицательной.";
        }
        if (!Number.isFinite(item.discount) || item.discount < 0 || item.discount > 100) {
          return "Скидка должна быть от 0 до 100.";
        }
        return "";
      });

      if (nextErrors.priceItems.every((value) => value === "")) {
        delete nextErrors.priceItems;
      }
    }

    return nextErrors;
  };

  // Универсальный обработчик для текстовых полей.
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setState((prev) => ({
      ...prev,
      [name]: name === "basePrice" ? Number(value) : value,
    }));
  };

  // Сохранение товара через API с повторной загрузкой каталога.
  const handleSubmit = async () => {
    const validation = findErrors(state);
    setErrors(validation);
    if (Object.keys(validation).length) {
      toast.error("Проверьте заполненные поля");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: state.name.trim(),
        sku: state.sku.trim() || null,
        description: state.description.trim() || null,
        currency: state.currency,
        basePrice: Number(state.basePrice),
        workspaceId,
        priceItems: state.priceItems.map((item) => ({
          id: item.id,
          label: item.label.trim(),
          qty: Number(item.qty) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          discount: Number(item.discount) || 0,
        })),
      };

      const method = productId ? "PUT" : "POST";
      const response = await fetch(
        "/api/products",
        withWorkspaceHeader({
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            productId
              ? {
                  id: productId,
                  ...payload,
                }
              : payload,
          ),
        }),
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Не удалось сохранить товар");
      }

      toast.success(productId ? "Товар обновлён" : "Товар создан");
      router.push("/catalog");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  // Удаление товара (доступно только при редактировании).
  const handleDelete = async () => {
    if (!productId) return;
    if (!window.confirm("Удалить товар? Действие нельзя отменить.")) {
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch(
        "/api/products",
        withWorkspaceHeader({
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: productId }),
        }),
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Не удалось удалить товар");
      }

      toast.success("Товар удалён");
      router.push("/catalog");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  };

  // Обновляем отдельное поле строки расшифровки.
  const updatePriceItem = (index: number, patch: Partial<PriceItemState>) => {
    setState((prev) => {
      const next = [...prev.priceItems];
      next[index] = { ...next[index], ...patch };
      return { ...prev, priceItems: next };
    });
  };

  // Удаляем строку расшифровки по индексу.
  const removePriceItem = (index: number) => {
    setState((prev) => {
      const next = [...prev.priceItems];
      next.splice(index, 1);
      return { ...prev, priceItems: next };
    });
  };

  return (
    <Card
      className="w-full rounded-[0.75rem] border-0 bg-white px-0 py-0 shadow-none"
      style={{
        boxShadow: "0 1px 1px 0 rgba(0, 0, 0, 0.06), 0 0 1px 0 rgba(0, 0, 0, 0.3)",
      }}
    >
      <CardContent className="space-y-6 px-4 py-6 md:px-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>
              Название *
            </Label>
            <Input
              id="name"
              name="name"
              autoComplete="off"
              placeholder="Например, Тариф ‘Старт’"
              value={state.name}
              onChange={handleChange}
            />
            {errors.name && <p className="mt-2 text-sm text-rose-600">{errors.name}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto]">
            <div>
              <Label htmlFor="sku" className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>
                SKU
              </Label>
              <Input
                id="sku"
                name="sku"
                autoComplete="off"
                placeholder="A-100-BASE"
                value={state.sku ?? ""}
                onChange={handleChange}
              />
              <p className="mt-1.5 text-xs" style={{ color: MUTED_COLOR }}>
                Технический идентификатор для поиска и интеграций.
              </p>
              {errors.sku && <p className="mt-2 text-sm text-rose-600">{errors.sku}</p>}
            </div>
            <div>
              <Label htmlFor="basePrice" className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>
                Базовая цена *
              </Label>
              <Input
                id="basePrice"
                name="basePrice"
                type="number"
                min="0"
                step="0.01"
                value={Number.isFinite(state.basePrice) ? state.basePrice : 0}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, basePrice: Number(event.target.value) }))
                }
              />
              {errors.basePrice && <p className="mt-2 text-sm text-rose-600">{errors.basePrice}</p>}
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>Валюта *</Label>
              <Select
                value={state.currency}
                onValueChange={(value) => setState((prev) => ({ ...prev, currency: value }))}
              >
                <SelectTrigger className="w-full" style={{ borderColor: FIELD_BORDER_COLOR }}>
                  <SelectValue placeholder="Выберите валюту" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && <p className="mt-2 text-sm text-rose-600">{errors.currency}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-base font-semibold" style={{ color: LABEL_COLOR }}>Расшифровка (опционально)</p>
              <p className="text-sm" style={{ color: MUTED_COLOR }}>
                Строки подтягиваются в блок «Таблица цен». Итоговая сумма:{" "}
                <span className="font-medium" style={{ color: LABEL_COLOR }}>
                  {new Intl.NumberFormat("ru-RU", {
                    style: "currency",
                    currency: state.currency || "RUB",
                  }).format(totals)}
                </span>
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setState((prev) => ({
                ...prev,
                priceItems: [...prev.priceItems, { ...emptyPriceItem }],
              }))}
            >
              <Plus className="mr-2 h-4 w-4" /> Добавить позицию
            </Button>
          </div>

          {state.priceItems.length === 0 ? (
            <div
              className="rounded-lg border border-dashed px-4 py-6 text-sm"
              style={{
                borderColor: FIELD_BORDER_COLOR,
                color: MUTED_COLOR,
                backgroundColor: "rgb(243, 242, 240)",
              }}
            >
              Позиции отсутствуют. Добавьте строки, если хотите детализировать стоимость.
            </div>
          ) : (
            <div className="space-y-4">
              {state.priceItems.map((item, index) => {
                const itemError = errors.priceItems?.[index];
                return (
                  <div
                    key={index}
                    className="grid gap-4 rounded-xl border p-4 md:grid-cols-[1.5fr_repeat(3,1fr)_auto]"
                    style={{ borderColor: FIELD_BORDER_COLOR }}
                  >
                    <div>
                      <Label className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>Название</Label>
                      <Input
                        value={item.label}
                        onChange={(event) => updatePriceItem(index, { label: event.target.value })}
                        placeholder="Например, Внедрение"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>Кол-во</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(event) => updatePriceItem(index, { qty: Number(event.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>Цена</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) => updatePriceItem(index, { unitPrice: Number(event.target.value) })}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block text-sm font-medium" style={{ color: LABEL_COLOR }}>Скидка %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.discount}
                        onChange={(event) => updatePriceItem(index, { discount: Number(event.target.value) })}
                      />
                    </div>
                    <div className="flex items-start justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePriceItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                    {itemError && (
                      <p className="md:col-span-5 text-sm text-rose-600">{itemError}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
      <Separator style={{ backgroundColor: FIELD_BORDER_COLOR }} />
      <CardFooter className="flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm" style={{ color: MUTED_COLOR }}>
          Убедитесь, что все данные актуальны. Изменения сразу появятся в редакторе документов.
        </p>
        <div className="flex gap-2">
          {productId && (
            <Button
              type="button"
              variant="ghost"
              className={cn("text-rose-600 hover:bg-rose-50", deleting && "pointer-events-none opacity-70")}
              onClick={handleDelete}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Удалить
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {productId ? "Сохранить" : "Создать"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
