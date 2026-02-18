'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type {
  ProductVariant,
  ProductVariantItemRow,
  ProductVariantRow,
  Proposal,
  ProposalItem,
} from '@/lib/types/proposal';
import { calculateItemTotal, calculateProposalSubtotal, calculateProposalTotal, calculateVatAmount } from '@/lib/types/proposal';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Check,
  FolderPlus,
  GripVertical,
  Loader2,
  Package,
  Percent,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CatalogProduct {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  currency: string;
  basePrice: number;
}

interface ProductsSectionProps {
  proposal: Proposal;
  onUpdate: <K extends keyof Proposal>(field: K, value: Proposal[K]) => void;
}

const FIELD_BORDER_COLOR = 'var(--field-border)';
const TEXT_PRIMARY = '#3d3d3a';
const TEXT_MUTED = '#73726c';

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const isItemRow = (row: ProductVariantRow): row is ProductVariantItemRow => row.type === 'item';

const toLegacyItem = (row: ProductVariantItemRow): ProposalItem => ({
  id: row.id,
  productId: row.productId,
  name: row.name,
  description: row.description,
  qty: row.qty,
  price: row.price,
  discount: row.discount,
  unit: row.unit,
});

const createVariant = (name: string, isRecommended = false): ProductVariant => ({
  id: createId('variant'),
  name,
  description: '',
  isRecommended,
  rows: [],
});

const createItemRow = (patch: Partial<ProductVariantItemRow> = {}): ProductVariantItemRow => ({
  type: 'item',
  id: createId('item'),
  name: patch.name ?? '',
  description: patch.description ?? '',
  qty: Number.isFinite(patch.qty) ? Number(patch.qty) : 1,
  price: Number.isFinite(patch.price) ? Number(patch.price) : 0,
  discount: Number.isFinite(patch.discount) ? Number(patch.discount) : 0,
  unit: patch.unit ?? 'шт',
  productId: patch.productId,
  groupId: patch.groupId,
});

const toVariantRowsFromItems = (items: ProposalItem[]): ProductVariantRow[] =>
  items.map((item) =>
    createItemRow({
      id: item.id || createId('item'),
      productId: item.productId,
      name: item.name,
      description: item.description,
      qty: item.qty,
      price: item.price,
      discount: item.discount,
      unit: item.unit,
    }),
  );

const normalizeVariants = (proposal: Proposal): ProductVariant[] => {
  if (proposal.pricingMode === 'variants' && Array.isArray(proposal.productVariants) && proposal.productVariants.length > 0) {
    return proposal.productVariants;
  }

  const legacyItems = Array.isArray(proposal.items) ? proposal.items : [];
  return [{ ...createVariant('Вариант 1', true), rows: toVariantRowsFromItems(legacyItems) }];
};

const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(price);

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const getCurrencySymbol = (currency: string) => {
  const symbols: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
  };
  return symbols[currency] ?? currency;
};

interface SortableTableRowRenderProps {
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
  setActivatorNodeRef: ReturnType<typeof useSortable>['setActivatorNodeRef'];
}

interface SortableTableRowProps {
  id: string;
  className?: string;
  style?: CSSProperties;
  children: (props: SortableTableRowRenderProps) => ReactNode;
}

function SortableTableRow({ id, className, style, children }: SortableTableRowProps) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const rowStyle: CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 2 : 1,
    position: 'relative',
  };

  return (
    <tr ref={setNodeRef} className={className} style={rowStyle}>
      {children({ attributes, listeners, setActivatorNodeRef })}
    </tr>
  );
}

export default function ProductsSection({
  proposal,
  onUpdate,
}: ProductsSectionProps) {
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<CatalogProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const variants = useMemo(() => normalizeVariants(proposal), [proposal]);
  const productsView = useMemo(
    () => ({
      showDiscountColumn: proposal.productsView?.showDiscountColumn ?? true,
      showUnitColumn: proposal.productsView?.showUnitColumn ?? true,
    }),
    [proposal.productsView],
  );

  const resolvedActiveVariantId =
    variants.some((variant) => variant.id === proposal.activeVariantId)
      ? proposal.activeVariantId
      : variants[0]?.id;

  const activeVariant = useMemo(
    () => variants.find((variant) => variant.id === resolvedActiveVariantId) ?? variants[0] ?? null,
    [variants, resolvedActiveVariantId],
  );

  const syncProposalProducts = useCallback(
    (nextVariants: ProductVariant[], nextActiveVariantId?: string) => {
      const activeVariantId =
        nextVariants.some((variant) => variant.id === nextActiveVariantId)
          ? nextActiveVariantId
          : nextVariants[0]?.id;

      const active = nextVariants.find((variant) => variant.id === activeVariantId) ?? nextVariants[0];
      const legacyItems = (active?.rows ?? []).filter(isItemRow).map(toLegacyItem);

      onUpdate('pricingMode', 'variants');
      onUpdate('productVariants', nextVariants);
      onUpdate('activeVariantId', activeVariantId);
      onUpdate('productsView', productsView);
      onUpdate('items', legacyItems);
    },
    [onUpdate, productsView],
  );

  useEffect(() => {
    const needsInit =
      proposal.pricingMode !== 'variants' ||
      !Array.isArray(proposal.productVariants) ||
      proposal.productVariants.length === 0 ||
      !proposal.activeVariantId ||
      !proposal.productsView;

    if (!needsInit) return;
    syncProposalProducts(variants, resolvedActiveVariantId);
  }, [proposal.pricingMode, proposal.productVariants, proposal.activeVariantId, proposal.productsView, resolvedActiveVariantId, syncProposalProducts, variants]);

  const updateActiveVariantRows = useCallback(
    (updater: (rows: ProductVariantRow[]) => ProductVariantRow[]) => {
      if (!activeVariant || !resolvedActiveVariantId) return;
      const nextVariants = variants.map((variant) =>
        variant.id === resolvedActiveVariantId
          ? { ...variant, rows: updater(variant.rows) }
          : variant,
      );
      syncProposalProducts(nextVariants, resolvedActiveVariantId);
    },
    [activeVariant, resolvedActiveVariantId, syncProposalProducts, variants],
  );

  const fetchCatalogProducts = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        const products = Array.isArray(data.products) ? data.products : [];
        setCatalogProducts(products);
        setFilteredProducts(products);
      }
    } catch (error) {
      console.error('Failed to fetch catalog products:', error);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    if (showCatalogPicker && catalogProducts.length === 0) {
      fetchCatalogProducts();
    }
  }, [catalogProducts.length, fetchCatalogProducts, showCatalogPicker]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(catalogProducts);
      return;
    }

    const query = searchQuery.toLowerCase();
    setFilteredProducts(
      catalogProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query),
      ),
    );
  }, [catalogProducts, searchQuery]);

  const itemRows = useMemo(() => {
    if (!activeVariant) return [];
    return activeVariant.rows.filter(isItemRow);
  }, [activeVariant]);

  const subtotal = calculateProposalSubtotal(itemRows);
  const vatAmount = calculateVatAmount({ ...proposal, items: itemRows });
  const total = calculateProposalTotal({ ...proposal, items: itemRows });
  const currencySymbol = getCurrencySymbol(proposal.currency);
  const groupTrailingCols = 3 + (productsView.showUnitColumn ? 1 : 0) + (productsView.showDiscountColumn ? 1 : 0);

  const setActiveVariant = (variantId: string) => {
    syncProposalProducts(variants, variantId);
  };

  const addVariant = () => {
    if (variants.length >= 3) return;
    const nextVariant = createVariant(`Вариант ${variants.length + 1}`);
    const nextVariants = variants.map((variant) => ({ ...variant, isRecommended: !!variant.isRecommended }));
    if (!nextVariants.some((variant) => variant.isRecommended)) {
      nextVariants[0] = { ...nextVariants[0], isRecommended: true };
    }
    syncProposalProducts([...nextVariants, nextVariant], nextVariant.id);
  };

  const removeActiveVariant = () => {
    if (!activeVariant || variants.length <= 1) return;
    const remaining = variants.filter((variant) => variant.id !== activeVariant.id);
    if (!remaining.some((variant) => variant.isRecommended)) {
      remaining[0] = { ...remaining[0], isRecommended: true };
    }
    syncProposalProducts(remaining, remaining[0]?.id);
  };

  const updateActiveVariant = (patch: Partial<ProductVariant>) => {
    if (!activeVariant || !resolvedActiveVariantId) return;
    const nextVariants = variants.map((variant) =>
      variant.id === resolvedActiveVariantId ? { ...variant, ...patch } : variant,
    );
    syncProposalProducts(nextVariants, resolvedActiveVariantId);
  };

  const setRecommendedVariant = (variantId: string) => {
    const nextVariants = variants.map((variant) => ({
      ...variant,
      isRecommended: variant.id === variantId,
    }));
    syncProposalProducts(nextVariants, resolvedActiveVariantId);
  };

  const updateProductsView = (patch: Partial<NonNullable<Proposal['productsView']>>) => {
    onUpdate('productsView', { ...productsView, ...patch });
  };

  const addGroupRow = () => {
    updateActiveVariantRows((rows) => [
      ...rows,
      {
        id: createId('group'),
        type: 'group',
        title: `Группа ${rows.filter((row) => row.type === 'group').length + 1}`,
      },
    ]);
  };

  const addItemRow = () => {
    updateActiveVariantRows((rows) => {
      const lastGroup = [...rows].reverse().find((row) => row.type === 'group');
      return [...rows, createItemRow({ groupId: lastGroup?.id })];
    });
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleAddSelectedProducts = () => {
    if (!activeVariant) return;

    updateActiveVariantRows((rows) => {
      const lastGroup = [...rows].reverse().find((row) => row.type === 'group');
      const additions: ProductVariantItemRow[] = [];

      selectedProducts.forEach((productId) => {
        const product = catalogProducts.find((entry) => entry.id === productId);
        if (!product) return;
        additions.push(
          createItemRow({
            productId: product.id,
            name: product.name,
            description: product.description ?? '',
            qty: 1,
            price: Number(product.basePrice) || 0,
            unit: 'шт',
            discount: 0,
            groupId: lastGroup?.id,
          }),
        );
      });

      return [...rows, ...additions];
    });

    setSelectedProducts(new Set());
    setShowCatalogPicker(false);
    setSearchQuery('');
  };

  const updateGroupRowTitle = (rowId: string, title: string) => {
    updateActiveVariantRows((rows) =>
      rows.map((row) => (row.id === rowId && row.type === 'group' ? { ...row, title } : row)),
    );
  };

  const updateItemRow = (rowId: string, patch: Partial<ProductVariantItemRow>) => {
    updateActiveVariantRows((rows) =>
      rows.map((row) =>
        row.id === rowId && row.type === 'item'
          ? { ...row, ...patch }
          : row,
      ),
    );
  };

  const removeRow = (rowId: string) => {
    updateActiveVariantRows((rows) => rows.filter((row) => row.id !== rowId));
  };

  const rowIds = useMemo(() => (activeVariant ? activeVariant.rows.map((row) => row.id) : []), [activeVariant]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    updateActiveVariantRows((rows) => {
      const oldIndex = rows.findIndex((row) => row.id === String(active.id));
      const newIndex = rows.findIndex((row) => row.id === String(over.id));
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return rows;
      return arrayMove(rows, oldIndex, newIndex);
    });
  }, [updateActiveVariantRows]);

  const isProductAlreadyAdded = (productId: string) =>
    itemRows.some((row) => row.productId === productId);

  const variantSubtotal = (variant: ProductVariant) =>
    calculateProposalSubtotal(variant.rows.filter(isItemRow));

  const productsActionButtonClass =
    'inline-flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-[#fafaf7] focus:outline-none focus:ring-2 focus:ring-[var(--field-ring)]';

  return (
    <div className="space-y-6">
      <div className="space-y-0">
        <div className="relative z-[1] -mb-px flex flex-wrap items-end gap-2">
          {variants.map((variant) => {
            const isActive = variant.id === resolvedActiveVariantId;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => setActiveVariant(variant.id)}
                className="rounded-t-xl border px-4 py-2 text-left transition-colors"
                style={{
                  borderColor: FIELD_BORDER_COLOR,
                  borderBottomColor: isActive ? '#ffffff' : FIELD_BORDER_COLOR,
                  backgroundColor: isActive ? '#ffffff' : 'rgb(243, 242, 240)',
                  color: TEXT_PRIMARY,
                  minWidth: 180,
                  zIndex: isActive ? 2 : 1,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{variant.name}</span>
                  {variant.isRecommended ? (
                    <span className="rounded-full bg-[#3CB371] px-2 py-0.5 text-[10px] font-semibold text-white">
                      Рекомендуем
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs" style={{ color: TEXT_MUTED }}>
                  {formatPrice(variantSubtotal(variant), proposal.currency)}
                </p>
              </button>
            );
          })}

          {variants.length < 3 ? (
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex min-w-[180px] items-center rounded-t-xl border px-4 py-2 text-left transition-colors hover:bg-[#eceae3] focus:outline-none focus:ring-2 focus:ring-[var(--field-ring)]"
              style={{
                color: TEXT_PRIMARY,
                borderColor: FIELD_BORDER_COLOR,
                backgroundColor: 'rgb(243, 242, 240)',
              }}
            >
              <span className="text-sm font-semibold">+ Вариант</span>
            </button>
          ) : null}
        </div>

        {activeVariant ? (
          <div className="rounded-b-xl rounded-tr-xl border bg-white p-4" style={{ borderColor: FIELD_BORDER_COLOR }}>
            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <div>
                <div className="mb-2 flex h-7 items-center gap-2">
                  <label className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
                    Название варианта
                  </label>
                  <button
                    type="button"
                    onClick={() => setRecommendedVariant(activeVariant.id)}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-colors hover:bg-[#f4f2ec] focus:outline-none focus:ring-2 focus:ring-[var(--field-ring)]"
                    style={{ color: TEXT_PRIMARY }}
                    aria-label="Отметить вариант как рекомендуемый"
                    title="Отметить вариант как рекомендуемый"
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${activeVariant.isRecommended ? 'fill-current' : ''}`}
                      style={{ color: activeVariant.isRecommended ? '#3CB371' : TEXT_MUTED }}
                    />
                    Рекомендуем
                  </button>
                </div>
                <input
                  type="text"
                  value={activeVariant.name}
                  onChange={(event) => updateActiveVariant({ name: event.target.value })}
                  className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
                  placeholder="Вариант Стандартный"
                />
              </div>
              <div>
                <div className="mb-2 flex h-7 items-center">
                  <label className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
                    Описание варианта
                  </label>
                </div>
                <input
                  type="text"
                  value={activeVariant.description ?? ''}
                  onChange={(event) => updateActiveVariant({ description: event.target.value })}
                  className="w-full rounded-lg border border-[var(--field-border)] bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
                  placeholder="Краткое описание"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addItemRow}
                  className={productsActionButtonClass}
                  style={{ color: TEXT_PRIMARY, borderColor: FIELD_BORDER_COLOR }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Товар
                </button>
                <button
                  type="button"
                  onClick={addGroupRow}
                  className={productsActionButtonClass}
                  style={{ color: TEXT_PRIMARY, borderColor: FIELD_BORDER_COLOR }}
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  Группа
                </button>
                <button
                  type="button"
                  onClick={() => setShowCatalogPicker(true)}
                  className={productsActionButtonClass}
                  style={{ color: TEXT_PRIMARY, borderColor: FIELD_BORDER_COLOR }}
                >
                  <Package className="h-3.5 w-3.5" />
                  Из каталога
                </button>
                <button
                  type="button"
                  onClick={() => updateProductsView({ showDiscountColumn: !productsView.showDiscountColumn })}
                  className={productsActionButtonClass}
                  style={{ color: TEXT_PRIMARY, borderColor: FIELD_BORDER_COLOR }}
                >
                  <Percent className="h-3.5 w-3.5" />
                  {productsView.showDiscountColumn ? 'Скрыть скидку' : 'Показать скидку'}
                </button>
              </div>

              {variants.length > 1 ? (
                <button
                  type="button"
                  onClick={removeActiveVariant}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white transition-colors hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-[var(--field-ring)]"
                  style={{ color: '#b91c1c', borderColor: FIELD_BORDER_COLOR }}
                  aria-label="Удалить вариант"
                  title="Удалить вариант"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <Sheet open={showCatalogPicker} onOpenChange={setShowCatalogPicker}>
        <SheetContent
          side="right"
          className="w-full gap-0 border-l bg-[#F3F2F0] p-0 sm:max-w-xl"
          style={{ borderColor: FIELD_BORDER_COLOR }}
        >
          <SheetHeader className="border-b px-5 py-4" style={{ borderColor: FIELD_BORDER_COLOR }}>
            <SheetTitle className="text-[15px] font-semibold tracking-[-0.2px]" style={{ color: TEXT_PRIMARY }}>
              Добавить из каталога
            </SheetTitle>
            <SheetDescription className="text-[13px] leading-5" style={{ color: TEXT_MUTED }}>
              Выберите товары для добавления в активный вариант
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Поиск по названию или артикулу..."
                className="w-full rounded-lg border border-[var(--field-border)] bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-white p-2" style={{ borderColor: FIELD_BORDER_COLOR }}>
              {isLoadingCatalog ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--field-focus)]" />
                  <span className="ml-2 text-sm" style={{ color: TEXT_MUTED }}>Загрузка каталога...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <Package className="mx-auto h-10 w-10" style={{ color: '#c8c6be' }} />
                  <p className="mt-2 text-sm" style={{ color: TEXT_MUTED }}>
                    {searchQuery ? 'Товары не найдены' : 'Каталог пуст'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedProducts.has(product.id);
                    const isAdded = isProductAlreadyAdded(product.id);

                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleToggleProduct(product.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          isAdded
                            ? 'cursor-not-allowed opacity-70'
                            : 'hover:bg-[#fafaf7]'
                        }`}
                        style={{
                          borderColor: isSelected ? '#C6613F' : FIELD_BORDER_COLOR,
                          backgroundColor: isAdded ? '#f5f4ef' : isSelected ? '#FAEFEB' : '#ffffff',
                          ...(isSelected ? { boxShadow: '0 0 0 1px rgba(198, 97, 63, 0.18)' } : {}),
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border"
                            style={{
                              borderColor: isSelected ? '#C6613F' : FIELD_BORDER_COLOR,
                              backgroundColor: isAdded ? '#d9d7cc' : isSelected ? '#C6613F' : '#ffffff',
                            }}
                          >
                            {(isSelected || isAdded) && (
                              <Check className="h-3.5 w-3.5" style={{ color: isAdded ? '#73726c' : '#ffffff' }} />
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <span className="truncate text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
                              {product.name}
                            </span>
                            {product.sku ? (
                              <span className="shrink-0 whitespace-nowrap text-xs" style={{ color: TEXT_MUTED }}>
                                {product.sku}
                              </span>
                            ) : null}
                            <span className="ml-auto shrink-0 whitespace-nowrap text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
                              {formatPrice(product.basePrice, proposal.currency)}
                            </span>
                            {isAdded ? (
                              <span className="shrink-0 whitespace-nowrap text-xs" style={{ color: TEXT_MUTED }}>
                                Уже добавлен
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedProducts.size > 0 ? (
              <div className="rounded-lg border bg-white p-3" style={{ borderColor: FIELD_BORDER_COLOR }}>
                <p className="mb-2 text-xs" style={{ color: TEXT_MUTED }}>
                  Выбрано товаров: {selectedProducts.size}
                </p>
                <button
                  type="button"
                  onClick={handleAddSelectedProducts}
                  className="w-full rounded-lg bg-[#C6613F] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#b95738] focus:outline-none focus:ring-2 focus:ring-[var(--field-ring)]"
                >
                  Добавить выбранные ({selectedProducts.size})
                </button>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      {!activeVariant || activeVariant.rows.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-[#FAFAFA] px-6 py-12 text-center" style={{ borderColor: FIELD_BORDER_COLOR }}>
          <Package className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-3 text-sm font-medium" style={{ color: TEXT_PRIMARY }}>
            Нет товаров или услуг
          </p>
          <p className="mt-1 text-xs" style={{ color: TEXT_MUTED }}>
            Добавьте позиции вручную, группами или из каталога
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border text-[12px]" style={{ borderColor: FIELD_BORDER_COLOR }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] table-fixed border-collapse">
                  <thead style={{ backgroundColor: '#FAFAFA' }}>
                    <tr>
                      <th className="w-[44px] border-b border-r border-[var(--field-border)] px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white text-[#3d3d3a] hover:bg-[#f4f2ec] focus:outline-none focus:ring-1 focus:ring-[var(--field-ring)]"
                              style={{ borderColor: FIELD_BORDER_COLOR }}
                              aria-label="Добавить строку"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" sideOffset={6} className="w-56 border-[var(--field-border)]">
                            <DropdownMenuItem onSelect={() => addItemRow()}>
                              <Plus className="h-4 w-4" />
                              Добавить товар
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => addGroupRow()}>
                              <FolderPlus className="h-4 w-4" />
                              Добавить группу товаров
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </th>
                      <th className="border-b border-r border-[var(--field-border)] px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Наименование</th>
                      <th className="w-[90px] border-b border-r border-[var(--field-border)] px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Кол-во</th>
                      {productsView.showUnitColumn ? (
                        <th className="w-[72px] border-b border-r border-[var(--field-border)] px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Ед.</th>
                      ) : null}
                      <th className="w-[120px] border-b border-r border-[var(--field-border)] px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
                        Цена, {currencySymbol}
                      </th>
                      {productsView.showDiscountColumn ? (
                        <th className="w-[76px] border-b border-r border-[var(--field-border)] px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>Скидка</th>
                      ) : null}
                      <th className="w-[140px] border-b border-r border-[var(--field-border)] px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
                        Сумма, {currencySymbol}
                      </th>
                      <th className="w-[44px] border-b border-[var(--field-border)] px-1 py-2 text-right text-[11px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }} />
                    </tr>
                  </thead>
                  <tbody className="bg-white" style={{ borderTop: `1px solid ${FIELD_BORDER_COLOR}` }}>
                    {activeVariant.rows.map((row) => {
                  if (row.type === 'group') {
                    return (
                      <SortableTableRow
                        key={row.id}
                        id={row.id}
                        style={{ borderTop: `1px solid ${FIELD_BORDER_COLOR}`, backgroundColor: 'rgb(243, 242, 240)' }}
                      >
                        {({ attributes, listeners, setActivatorNodeRef }) => (
                          <>
                            <td className="border-r border-[var(--field-border)] px-1 py-1.5 text-center">
                              <button
                                type="button"
                                ref={setActivatorNodeRef}
                                {...attributes}
                                {...listeners}
                                className="inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-md text-[#73726c] hover:bg-[#e8e6de] active:cursor-grabbing"
                                aria-label="Перетащить строку группы"
                              >
                                <GripVertical className="h-4 w-4" />
                              </button>
                            </td>
                            <td className="border-r border-[var(--field-border)] px-2 py-1.5">
                              <input
                                type="text"
                                value={row.title}
                                onChange={(event) => updateGroupRowTitle(row.id, event.target.value)}
                                className="h-8 w-full rounded-md border border-[var(--field-border)] bg-white px-2 text-[12px] font-semibold text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
                                placeholder="Название группы"
                              />
                            </td>
                            <td colSpan={groupTrailingCols} className="border-r border-[var(--field-border)] px-2 py-1.5" />
                            <td className="px-1 py-1.5 text-center">
                              <button type="button" onClick={() => removeRow(row.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-rose-50" style={{ color: '#b91c1c' }}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </>
                        )}
                      </SortableTableRow>
                    );
                  }

                  const rowTotal = calculateItemTotal(row);
                  return (
                    <SortableTableRow key={row.id} id={row.id} style={{ borderTop: `1px solid ${FIELD_BORDER_COLOR}` }} className="hover:bg-[#fafaf7]">
                      {({ attributes, listeners, setActivatorNodeRef }) => (
                        <>
                          <td className="border-r border-[var(--field-border)] px-1 py-1.5 text-center">
                            <button
                              type="button"
                              ref={setActivatorNodeRef}
                              {...attributes}
                              {...listeners}
                              className="inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-md text-[#73726c] hover:bg-[#f1f0eb] active:cursor-grabbing"
                              aria-label="Перетащить строку товара"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                          </td>
                          <td className="border-r border-[var(--field-border)] px-2 py-1.5">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(event) => updateItemRow(row.id, { name: event.target.value })}
                              className="h-8 w-full rounded-md border border-[var(--field-border)] bg-white px-2 text-[12px] text-slate-900 placeholder:text-[var(--field-placeholder)] transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
                              placeholder="Название товара"
                            />
                          </td>
                          <td className="border-r border-[var(--field-border)] px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.qty}
                              onChange={(event) => updateItemRow(row.id, { qty: Number(event.target.value) || 0 })}
                              className="h-8 w-full rounded-md border border-[var(--field-border)] bg-white px-2 text-right text-[12px] text-slate-900 transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
                            />
                          </td>
                          {productsView.showUnitColumn ? (
                            <td className="border-r border-[var(--field-border)] px-2 py-1.5">
                              <input
                                type="text"
                                value={row.unit ?? 'шт'}
                                onChange={(event) => updateItemRow(row.id, { unit: event.target.value })}
                                className="h-8 w-full rounded-md border border-[var(--field-border)] bg-white px-2 text-[12px] text-slate-900 transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
                              />
                            </td>
                          ) : null}
                          <td className="border-r border-[var(--field-border)] px-2 py-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.price}
                              onChange={(event) => updateItemRow(row.id, { price: Number(event.target.value) || 0 })}
                              className="h-8 w-full rounded-md border border-[var(--field-border)] bg-white px-2 text-right text-[12px] text-slate-900 transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
                            />
                          </td>
                          {productsView.showDiscountColumn ? (
                            <td className="border-r border-[var(--field-border)] px-2 py-1.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={row.discount ?? 0}
                                onChange={(event) => updateItemRow(row.id, { discount: Number(event.target.value) || 0 })}
                                className="h-8 w-full rounded-md border border-[var(--field-border)] bg-white px-1.5 text-right text-[12px] text-slate-900 transition-[color,box-shadow,border-color] focus:border-[var(--field-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--field-ring)]"
                              />
                            </td>
                          ) : null}
                          <td className="border-r border-[var(--field-border)] px-2 py-1.5 text-right text-[12px] font-semibold tabular-nums" style={{ color: TEXT_PRIMARY }}>
                            {formatAmount(rowTotal)}
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            <button type="button" onClick={() => removeRow(row.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-rose-50" style={{ color: '#b91c1c' }}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </SortableTableRow>
                  );
                })}
                  </tbody>
                </table>
              </div>
            </SortableContext>
          </DndContext>

          <div className="border-t px-2 py-2" style={{ borderColor: FIELD_BORDER_COLOR, backgroundColor: '#FAFAFA' }}>
            <div className="ml-auto w-full max-w-[320px] space-y-1 text-[12px]" style={{ color: TEXT_PRIMARY }}>
              <div className="flex items-center justify-between">
                <span>Сумма без НДС</span>
                <span className="font-medium">{formatPrice(subtotal, proposal.currency)}</span>
              </div>
              {proposal.includeVat ? (
                <div className="flex items-center justify-between">
                  <span>НДС ({proposal.vatRate}%)</span>
                  <span className="font-medium">{formatPrice(vatAmount, proposal.currency)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t pt-2 text-[12px] font-semibold" style={{ borderColor: FIELD_BORDER_COLOR }}>
                <span>Итого</span>
                <span>{formatPrice(total, proposal.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
