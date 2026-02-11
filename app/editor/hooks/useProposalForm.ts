import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  ProductVariant,
  ProductVariantItemRow,
  Proposal,
  ProposalItem,
} from '@/lib/types/proposal';
import {
  parseAdvantages,
  parseAdvantagesColumns,
  parseOptionalStringArray,
  parseProductsView,
  parseProductVariants,
  parseProposalItems,
  pricingModeSchema,
  safeParseStringArray,
} from '@/lib/types/proposal-schema';
import { useRouter } from 'next/navigation';

const AUTOSAVE_DELAY = 3000; // 3 секунды после последнего изменения

export interface UseProposalFormOptions {
  proposalId?: string;
  workspaceId: string;
  userId: string;
}

export interface UseProposalFormReturn {
  proposal: Proposal;
  updateField: <K extends keyof Proposal>(field: K, value: Proposal[K]) => void;
  addItem: (item: Omit<ProposalItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<ProposalItem>) => void;
  save: () => Promise<void>;
  exportPdf: () => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
}

const DEFAULT_VISIBLE_SECTIONS = [
  'basic',
  'context',
  'advantages',
  'products',
  'terms',
  'gallery',
  'contacts',
] as const;

const normalizeVisibleSections = (value?: string[] | null): string[] => {
  if (!Array.isArray(value) || value.length === 0) return [...DEFAULT_VISIBLE_SECTIONS];
  return Array.from(new Set(value));
};

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createVariantItemRow = (item: ProposalItem): ProductVariantItemRow => ({
  type: 'item',
  id: item.id,
  productId: item.productId,
  name: item.name,
  description: item.description ?? '',
  qty: Number.isFinite(item.qty) ? item.qty : 1,
  price: Number.isFinite(item.price) ? item.price : 0,
  discount: Number.isFinite(item.discount) ? item.discount : 0,
  unit: item.unit ?? 'шт',
});

const createEmptyVariant = (name = 'Вариант 1'): ProductVariant => ({
  id: createId('variant'),
  name,
  description: '',
  isRecommended: true,
  rows: [],
});

const normalizeProposalProducts = (incoming: Proposal): Proposal => {
  const fromIncoming = Array.isArray(incoming.productVariants) ? incoming.productVariants : [];
  const variants =
    fromIncoming.length > 0
      ? fromIncoming
      : [
          {
            ...createEmptyVariant('Вариант 1'),
            rows: Array.isArray(incoming.items)
              ? incoming.items.map((item) =>
                  createVariantItemRow({
                    ...item,
                    id: item.id || createId('item'),
                  }),
                )
              : [],
          },
        ];

  const activeVariantId =
    variants.some((variant) => variant.id === incoming.activeVariantId)
      ? incoming.activeVariantId
      : variants[0]?.id;

  return {
    ...incoming,
    pricingMode: 'variants',
    productVariants: variants,
    activeVariantId,
    productsView: {
      showDiscountColumn: incoming.productsView?.showDiscountColumn ?? true,
      showUnitColumn: incoming.productsView?.showUnitColumn ?? true,
    },
  };
};

const toOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const normalizeValidUntil = (value: unknown): string | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value as string | number | Date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const normalizeStatus = (value: unknown): NonNullable<Proposal['status']> =>
  value === 'draft' || value === 'sent' || value === 'accepted' || value === 'rejected'
    ? value
    : 'draft';

const normalizeIncomingProposal = (
  incoming: Proposal,
  fallbackWorkspaceId: string,
  fallbackUserId: string,
): Proposal => {
  const parsedPricingMode = pricingModeSchema.safeParse(incoming.pricingMode);

  const normalized: Proposal = {
    ...incoming,
    workspaceId: toOptionalString(incoming.workspaceId) ?? fallbackWorkspaceId,
    clientId: toOptionalString(incoming.clientId),
    title: toOptionalString(incoming.title) ?? 'Новое коммерческое предложение',
    recipientName: toOptionalString(incoming.recipientName),
    problemDesc: toOptionalString(incoming.problemDesc),
    solutionDesc: toOptionalString(incoming.solutionDesc),
    additionalDesc: toOptionalString(incoming.additionalDesc),
    items: parseProposalItems(incoming.items),
    currency: toOptionalString(incoming.currency) ?? 'RUB',
    pricingMode: parsedPricingMode.success ? parsedPricingMode.data : 'single',
    productVariants: parseProductVariants(incoming.productVariants),
    activeVariantId: toOptionalString(incoming.activeVariantId),
    productsView: parseProductsView(incoming.productsView),
    deadline: toOptionalString(incoming.deadline),
    paymentTerms: toOptionalString(incoming.paymentTerms),
    paymentCustom: toOptionalString(incoming.paymentCustom),
    validUntil: normalizeValidUntil(incoming.validUntil),
    includeVat: typeof incoming.includeVat === 'boolean' ? incoming.includeVat : true,
    vatRate: Number.isFinite(Number(incoming.vatRate)) ? Number(incoming.vatRate) : 20,
    galleryImages: safeParseStringArray(incoming.galleryImages),
    advantages: parseAdvantages(incoming.advantages),
    advantagesColumns: parseAdvantagesColumns(incoming.advantagesColumns),
    visibleSections: normalizeVisibleSections(parseOptionalStringArray(incoming.visibleSections)),
    ctaText: toOptionalString(incoming.ctaText),
    ctaPhone: toOptionalString(incoming.ctaPhone),
    ctaEmail: toOptionalString(incoming.ctaEmail),
    notes: toOptionalString(incoming.notes),
    version: Number.isFinite(Number(incoming.version)) ? Number(incoming.version) : 1,
    status: normalizeStatus(incoming.status),
    createdBy: toOptionalString(incoming.createdBy) ?? fallbackUserId,
    updatedBy: toOptionalString(incoming.updatedBy) ?? fallbackUserId,
  };

  return normalizeProposalProducts(normalized);
};

const createEmptyProposal = (workspaceId: string, userId: string): Proposal => {
  const firstVariant = createEmptyVariant('Вариант 1');
  return {
    workspaceId,
    title: 'Новое коммерческое предложение',
    items: [],
    currency: 'RUB',
    pricingMode: 'variants',
    productVariants: [firstVariant],
    activeVariantId: firstVariant.id,
    productsView: {
      showDiscountColumn: true,
      showUnitColumn: true,
    },
    includeVat: true,
    vatRate: 20,
    advantages: [],
    advantagesColumns: 3,
    visibleSections: [...DEFAULT_VISIBLE_SECTIONS],
    status: 'draft',
    createdBy: userId,
    updatedBy: userId,
    version: 1,
  };
};

const getValidationMessage = (rawErrorText: string): string => {
  if (!rawErrorText) return 'Ошибка сервера';

  try {
    const parsed = JSON.parse(rawErrorText) as {
      error?: string;
      message?: string;
      details?: Array<{ message?: string }>;
    };

    if (parsed.error === 'Validation error' && Array.isArray(parsed.details) && parsed.details.length > 0) {
      return parsed.details[0]?.message || 'Ошибка валидации';
    }

    if (typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
      return parsed.message;
    }

    if (typeof parsed.error === 'string' && parsed.error.trim().length > 0) {
      return parsed.error;
    }
  } catch {
    // no-op
  }

  return rawErrorText;
};

export function useProposalForm({
  proposalId,
  workspaceId,
  userId,
}: UseProposalFormOptions): UseProposalFormReturn {
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal>(() => createEmptyProposal(workspaceId, userId));
  const proposalRef = useRef(proposal);
  proposalRef.current = proposal;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка существующего предложения
  useEffect(() => {
    if (!proposalId) return;

    setIsLoading(true);
    fetch(`/api/proposals/${proposalId}`)
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Не удалось загрузить КП (${res.status})`);
        return res.json();
      })
      .then((data: Proposal | null) => {
        if (!data) {
          console.warn(`Proposal not found: ${proposalId}`);
          setProposal(createEmptyProposal(workspaceId, userId));
          setIsDirty(false);
          setLastSaved(null);
          const params = new URLSearchParams(window.location.search);
          params.delete('proposalId');
          const next = params.toString();
          router.replace(next ? `${window.location.pathname}?${next}` : window.location.pathname, {
            scroll: false,
          });
          return;
        }
        const normalized = normalizeIncomingProposal(data, workspaceId, userId);
        setProposal(normalized);
        setIsDirty(false);
        setLastSaved(new Date(normalized.updatedAt || Date.now()));
      })
      .catch((error) => {
        console.error('Failed to load proposal:', error);
        alert('Не удалось загрузить коммерческое предложение');
      })
      .finally(() => setIsLoading(false));
  }, [proposalId, router, userId, workspaceId]);

  // Обновление поля
  const updateField = useCallback(<K extends keyof Proposal>(
    field: K,
    value: Proposal[K]
  ) => {
    setProposal((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Добавление товара
  const addItem = useCallback((item: Omit<ProposalItem, 'id'>) => {
    const newItem: ProposalItem = {
      ...item,
      id: createId('item'),
    };
    setProposal((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
      ...(prev.pricingMode === 'variants' && Array.isArray(prev.productVariants) && prev.productVariants.length > 0
        ? {
            productVariants: prev.productVariants.map((variant) =>
              variant.id === prev.activeVariantId
                ? {
                    ...variant,
                    rows: [...variant.rows, createVariantItemRow(newItem)],
                  }
                : variant,
            ),
          }
        : {}),
    }));
    setIsDirty(true);
  }, []);

  // Удаление товара
  const removeItem = useCallback((itemId: string) => {
    setProposal((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
      ...(prev.pricingMode === 'variants' && Array.isArray(prev.productVariants)
        ? {
            productVariants: prev.productVariants.map((variant) => ({
              ...variant,
              rows: variant.rows.filter((row) => row.id !== itemId),
            })),
          }
        : {}),
    }));
    setIsDirty(true);
  }, []);

  // Обновление товара
  const updateItem = useCallback((itemId: string, updates: Partial<ProposalItem>) => {
    setProposal((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
      ...(prev.pricingMode === 'variants' && Array.isArray(prev.productVariants)
        ? {
            productVariants: prev.productVariants.map((variant) => ({
              ...variant,
              rows: variant.rows.map((row) =>
                row.type === 'item' && row.id === itemId ? { ...row, ...updates } : row
              ),
            })),
          }
        : {}),
    }));
    setIsDirty(true);
  }, []);

  // Внутренняя функция сохранения (без алертов для автосохранения).
  // Читаем proposal из ref, чтобы функция не пересоздавалась при каждом изменении state
  // и не провоцировала бесконечный цикл автосохранения.
  const performSave = useCallback(async (showAlert: boolean = true): Promise<boolean> => {
    // Защита от параллельных вызовов
    if (isSavingRef.current) {
      console.log('[Save] Already saving, skipping');
      return false;
    }

    const current = proposalRef.current;

    if (!workspaceId || !userId) {
      if (showAlert) {
        alert('Ошибка: не удалось определить пользователя. Обновите страницу.');
      }
      return false;
    }

    const normalizedTitle = (current.title ?? '').trim();

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/proposals', {
        method: current.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...current,
          title: normalizedTitle,
          updatedBy: userId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        const message = getValidationMessage(errorText);
        if (response.status >= 500) {
          console.error('Server error response:', errorText);
        }
        throw new Error(message || 'Ошибка сервера');
      }

      const data = await response.json();
      const normalized = normalizeIncomingProposal(data, workspaceId, userId);
      setProposal(normalized);
      setIsDirty(false);
      setLastSaved(new Date());

      // Обновляем URL, если это новое КП
      if (!current.id && data.id) {
        const params = new URLSearchParams(window.location.search);
        params.set('proposalId', data.id);
        router.replace(`${window.location.pathname}?${params.toString()}`, {
          scroll: false,
        });
      }

      if (showAlert) {
        alert('Коммерческое предложение сохранено');
      }
      return true;
    } catch (error) {
      console.error('Failed to save proposal:', error);
      if (showAlert) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        alert(`Не удалось сохранить коммерческое предложение: ${errorMessage}`);
      }
      return false;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [userId, workspaceId, router]);

  // Публичная функция сохранения (с алертами)
  const save = useCallback(async () => {
    await performSave(true);
  }, [performSave]);

  // Автосохранение.
  // Зависимости: isDirty и isSaving — единственные триггеры.
  // proposal.id читаем из ref, performSave стабилен (не зависит от proposal).
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    if (isDirty && proposalRef.current.id && !isSaving) {
      autosaveTimerRef.current = setTimeout(() => {
        console.log('[Autosave] Saving...');
        performSave(false);
      }, AUTOSAVE_DELAY);
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [isDirty, isSaving, performSave]);

  // Экспорт в PDF
  const exportPdf = useCallback(async () => {
    if (!proposal.id) {
      alert('Сохраните коммерческое предложение перед экспортом в PDF');
      return;
    }

    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: proposal.id }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${proposal.title || 'proposal'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Не удалось экспортировать PDF');
    }
  }, [proposal]);

  return {
    proposal,
    updateField,
    addItem,
    removeItem,
    updateItem,
    save,
    exportPdf,
    isLoading,
    isSaving,
    isDirty,
    lastSaved,
  };
}
