import { z } from "zod";
import type {
  AdvantageItem,
  ProductVariant,
  ProductVariantRow,
  ProposalItem,
  ProductsViewSettings,
} from "@/lib/types/proposal";

export const numberOrZero = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number" && Number.isNaN(value)) return 0;
    return value;
  },
  z.number(),
);

export const nullableString = z.string().nullable().optional();

export const proposalItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().nullable().optional(),
  name: z.string(),
  description: nullableString,
  qty: numberOrZero,
  price: numberOrZero,
  discount: numberOrZero.optional(),
  unit: z.string().nullable().optional(),
});

export const productVariantGroupRowSchema = z.object({
  id: z.string(),
  type: z.literal("group"),
  title: z.string(),
});

export const productVariantItemRowSchema = z.object({
  id: z.string(),
  type: z.literal("item"),
  groupId: z.string().nullable().optional(),
  productId: z.string().nullable().optional(),
  name: z.string(),
  description: nullableString,
  qty: numberOrZero,
  price: numberOrZero,
  discount: numberOrZero.optional(),
  unit: z.string().nullable().optional(),
});

export const productVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: nullableString,
  isRecommended: z.boolean().optional(),
  currency: z.string().nullable().optional(),
  rows: z.array(z.union([productVariantGroupRowSchema, productVariantItemRowSchema])),
});

export const productsViewSchema = z.object({
  showDiscountColumn: z.boolean().optional(),
  showUnitColumn: z.boolean().optional(),
});

export const advantageSchema = z.object({
  id: z.string().optional(),
  iconUrl: z.string().nullable().optional(),
  title: z.string(),
  description: z.string(),
});

export const advantagesColumnsSchema = z.number().int().min(1).max(3);
export const pricingModeSchema = z.enum(["single", "variants"]);

export const proposalSchema = z.object({
  title: z.string().default(""),
  clientId: z.string().nullable().optional(),
  recipientName: nullableString,
  problemDesc: nullableString,
  solutionDesc: nullableString,
  additionalDesc: nullableString,
  items: z.array(proposalItemSchema),
  currency: z.string().default("RUB"),
  pricingMode: pricingModeSchema.default("single"),
  productVariants: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.array(productVariantSchema).optional(),
  ),
  activeVariantId: z.string().nullable().optional(),
  productsView: z.preprocess(
    (value) => (value === null ? undefined : value),
    productsViewSchema.optional(),
  ),
  deadline: nullableString,
  paymentTerms: nullableString,
  paymentCustom: nullableString,
  validUntil: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      return value;
    },
    z.union([z.string(), z.date()]).optional(),
  ),
  includeVat: z.boolean().default(true),
  vatRate: numberOrZero.default(20),
  galleryImages: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.array(z.string()).optional(),
  ),
  advantages: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.array(advantageSchema).optional(),
  ),
  advantagesColumns: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return 3;
      return value;
    },
    advantagesColumnsSchema,
  ).default(3),
  visibleSections: z.preprocess(
    (value) => (value === null ? undefined : value),
    z.array(z.string()).optional(),
  ),
  ctaText: nullableString,
  ctaPhone: nullableString,
  ctaEmail: nullableString,
  notes: nullableString,
});

export const proposalPatchSchema = proposalSchema.partial().extend({
  id: z.string().min(1, "Proposal ID is required"),
  clientId: z.string().nullable().optional(),
});

export function safeParseArray<T>(value: unknown, itemSchema: z.ZodType<T>): T[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => itemSchema.safeParse(item))
    .flatMap((result) => (result.success ? [result.data] : []));
}

export function safeParseStringArray(value: unknown): string[] {
  return safeParseArray(value, z.string());
}

export function safeParseObject<T>(
  value: unknown,
  schema: z.ZodType<T>,
): T | undefined {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export function parseAdvantagesColumns(
  value: unknown,
  fallback: 1 | 2 | 3 = 3,
): 1 | 2 | 3 {
  const parsed = advantagesColumnsSchema.safeParse(Number(value));
  return parsed.success ? (parsed.data as 1 | 2 | 3) : fallback;
}

export function parseProposalItems(value: unknown): ProposalItem[] {
  const parsed = safeParseArray(value, proposalItemSchema);

  return parsed.map((item, index) => ({
    id: item.id ?? `item-${index}`,
    productId: item.productId ?? undefined,
    name: item.name,
    description: item.description ?? undefined,
    qty: item.qty,
    price: item.price,
    discount: item.discount,
    unit: item.unit ?? undefined,
  }));
}

function normalizeVariantRow(row: z.infer<typeof productVariantGroupRowSchema> | z.infer<typeof productVariantItemRowSchema>): ProductVariantRow {
  if (row.type === "group") {
    return row;
  }

  return {
    ...row,
    groupId: row.groupId ?? undefined,
    productId: row.productId ?? undefined,
    description: row.description ?? undefined,
    unit: row.unit ?? undefined,
  };
}

export function parseProductVariants(value: unknown): ProductVariant[] {
  const parsed = safeParseArray(value, productVariantSchema);

  return parsed.map((variant) => ({
    ...variant,
    description: variant.description ?? undefined,
    currency: variant.currency ?? undefined,
    rows: variant.rows.map(normalizeVariantRow),
  }));
}

export function parseAdvantages(value: unknown): AdvantageItem[] {
  const parsed = safeParseArray(value, advantageSchema);

  return parsed.map((item) => ({
    ...item,
    iconUrl: item.iconUrl ?? undefined,
  }));
}

export function parseProductsView(value: unknown): ProductsViewSettings | undefined {
  return safeParseObject(value, productsViewSchema);
}

export function parseOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return safeParseStringArray(value);
}
