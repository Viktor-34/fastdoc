// Типы для работы с коммерческими предложениями (Proposals)

export type PricingMode = "single" | "variants";

export interface ProposalItem {
  id: string;
  productId?: string; // Если товар из каталога
  name: string;
  description?: string;
  qty: number;
  price: number;
  discount?: number; // В процентах
  unit?: string; // "шт", "час", "месяц" и т.д.
}

export interface ProductVariantGroupRow {
  id: string;
  type: "group";
  title: string;
}

export interface ProductVariantItemRow extends ProposalItem {
  type: "item";
  groupId?: string;
}

export type ProductVariantRow = ProductVariantGroupRow | ProductVariantItemRow;

export interface ProductVariant {
  id: string;
  name: string;
  description?: string;
  isRecommended?: boolean;
  currency?: string;
  rows: ProductVariantRow[];
}

export interface ProductsViewSettings {
  showDiscountColumn?: boolean;
  showUnitColumn?: boolean;
}

export interface AdvantageItem {
  id?: string;
  iconUrl?: string;
  title: string;
  description: string;
}

export interface Proposal {
  id?: string;
  workspaceId: string;
  clientId?: string;

  // Основная информация
  title: string;
  recipientName?: string; // "Уважаемый Иван Петрович!"

  // Контекст и решение
  problemDesc?: string; // Описание ситуации клиента (Point A)
  solutionDesc?: string; // Предлагаемое решение (Point B)
  additionalDesc?: string; // Дополнительное описание

  // Товары/услуги
  items: ProposalItem[]; // legacy/single mode
  currency: string; // "RUB", "USD", "EUR"
  pricingMode?: PricingMode;
  productVariants?: ProductVariant[];
  activeVariantId?: string;
  productsView?: ProductsViewSettings;

  // Условия
  deadline?: string; // Текстовое поле: "2 недели", "до 31.12.2024"
  paymentTerms?: string; // "prepaid" | "50-50" | "postpaid" | "custom"
  paymentCustom?: string; // Если paymentTerms = "custom"
  validUntil?: Date | string; // Срок действия КП

  // НДС
  includeVat: boolean;
  vatRate: number; // В процентах

  // Галерея
  galleryImages?: string[]; // Массив URL изображений

  // Преимущества
  advantages?: AdvantageItem[];
  advantagesColumns?: 1 | 2 | 3;

  // Настройки видимости разделов
  visibleSections?: string[];

  // CTA (призыв к действию)
  ctaText?: string;
  ctaPhone?: string;
  ctaEmail?: string;

  // Дополнительно
  notes?: string;

  // Метаданные
  version?: number;
  status?: "draft" | "sent" | "accepted" | "rejected";
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Опции оплаты (пресеты)
export const PAYMENT_TERMS_OPTIONS = [
  { value: "prepaid", label: "100% предоплата" },
  { value: "50-50", label: "50% предоплата / 50% по завершении" },
  { value: "postpaid", label: "Постоплата" },
  { value: "custom", label: "Свои условия" },
] as const;

export type PaymentTermsValue = typeof PAYMENT_TERMS_OPTIONS[number]["value"];

// Валюты
export const CURRENCY_OPTIONS = [
  { value: "RUB", label: "₽ Рубль", symbol: "₽" },
  { value: "USD", label: "$ Доллар", symbol: "$" },
  { value: "EUR", label: "€ Евро", symbol: "€" },
] as const;

export type CurrencyValue = typeof CURRENCY_OPTIONS[number]["value"];

export function isProductVariantItemRow(row: ProductVariantRow): row is ProductVariantItemRow {
  return row.type === "item";
}

export function getVariantItems(variant: ProductVariant | null | undefined): ProposalItem[] {
  if (!variant) return [];
  return variant.rows.filter(isProductVariantItemRow).map((row) => ({
    id: row.id,
    productId: row.productId,
    name: row.name,
    description: row.description,
    qty: row.qty,
    price: row.price,
    discount: row.discount,
    unit: row.unit,
  }));
}

export function getActiveVariant(proposal: Proposal): ProductVariant | null {
  if (proposal.pricingMode !== "variants" || !Array.isArray(proposal.productVariants) || proposal.productVariants.length === 0) {
    return null;
  }
  if (proposal.activeVariantId) {
    const byActiveId = proposal.productVariants.find((variant) => variant.id === proposal.activeVariantId);
    if (byActiveId) return byActiveId;
  }
  const recommended = proposal.productVariants.find((variant) => variant.isRecommended);
  return recommended ?? proposal.productVariants[0];
}

export function getProposalItems(proposal: Proposal): ProposalItem[] {
  const activeVariant = getActiveVariant(proposal);
  if (activeVariant) {
    return getVariantItems(activeVariant);
  }
  return Array.isArray(proposal.items) ? proposal.items : [];
}

// Утилиты для расчётов
export function calculateItemTotal(item: ProposalItem): number {
  const subtotal = item.qty * item.price;
  if (item.discount && item.discount > 0) {
    return subtotal * (1 - item.discount / 100);
  }
  return subtotal;
}

export function calculateProposalSubtotal(items: ProposalItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

export function calculateProposalTotal(proposal: Proposal): number {
  const subtotal = calculateProposalSubtotal(getProposalItems(proposal));
  if (proposal.includeVat && proposal.vatRate > 0) {
    return subtotal * (1 + proposal.vatRate / 100);
  }
  return subtotal;
}

export function calculateVatAmount(proposal: Proposal): number {
  if (!proposal.includeVat || proposal.vatRate === 0) return 0;
  const subtotal = calculateProposalSubtotal(getProposalItems(proposal));
  return subtotal * (proposal.vatRate / 100);
}
