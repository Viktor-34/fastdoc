import type { Proposal, ProposalItem, ProductVariant } from '../types/proposal';
import {
  PROPOSAL_SECTION_IDS,
  TEMPLATE_DEFAULT_ALLOWED_KEYS,
  type ProposalSectionId,
} from '../types/proposal-template';

const PROPOSAL_SECTIONS_SET = new Set<string>(PROPOSAL_SECTION_IDS);

const createId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const clone = <T>(value: T): T => {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
};

export const sanitizeTemplateSections = (value: unknown): ProposalSectionId[] => {
  if (!Array.isArray(value)) return [...PROPOSAL_SECTION_IDS];
  const deduped = Array.from(
    new Set(value.filter((section): section is ProposalSectionId => typeof section === 'string' && PROPOSAL_SECTIONS_SET.has(section))),
  );
  return deduped.length > 0 ? deduped : [...PROPOSAL_SECTION_IDS];
};

export const sanitizeTemplateDefaults = (value: unknown): Partial<Proposal> => {
  if (!isObject(value)) return {};
  const sanitized: Record<string, unknown> = {};

  for (const key of TEMPLATE_DEFAULT_ALLOWED_KEYS) {
    if (!(key in value)) continue;
    const candidate = value[key];
    if (candidate !== undefined) {
      sanitized[key] = clone(candidate);
    }
  }

  return sanitized as Partial<Proposal>;
};

export const buildTemplateFromProposal = (
  proposal: Proposal,
  sections: string[] | undefined,
): { defaults: Partial<Proposal>; sections: ProposalSectionId[] } => ({
  defaults: sanitizeTemplateDefaults(proposal),
  sections: sanitizeTemplateSections(sections ?? proposal.visibleSections),
});

export const rebaseTemplateIds = (defaults: Partial<Proposal>): Partial<Proposal> => {
  const next = clone(defaults);
  if (!next) return {};

  if (Array.isArray(next.items)) {
    next.items = next.items.map((item) => ({
      ...item,
      id: createId('item'),
    })) as ProposalItem[];
  }

  if (Array.isArray(next.advantages)) {
    next.advantages = next.advantages.map((advantage) => ({
      ...advantage,
      id: createId('adv'),
    }));
  }

  if (Array.isArray(next.productVariants)) {
    const variantIdMap = new Map<string, string>();

    const rebasedVariants = next.productVariants.map((variant) => {
      const oldVariantId = variant.id;
      const newVariantId = createId('variant');
      variantIdMap.set(oldVariantId, newVariantId);

      const groupIdMap = new Map<string, string>();
      const rows = Array.isArray(variant.rows) ? variant.rows : [];
      for (const row of rows) {
        if (row.type === 'group') {
          groupIdMap.set(row.id, createId('group'));
        }
      }

      const rebasedRows = rows.map((row) => {
        if (row.type === 'group') {
          const newGroupId = groupIdMap.get(row.id) ?? createId('group');
          return {
            ...row,
            id: newGroupId,
          };
        }

        return {
          ...row,
          id: createId('item'),
          groupId: row.groupId ? groupIdMap.get(row.groupId) ?? undefined : undefined,
        };
      });

      return {
        ...variant,
        id: newVariantId,
        rows: rebasedRows,
      };
    });

    const mappedActiveVariantId = next.activeVariantId
      ? variantIdMap.get(next.activeVariantId) ?? rebasedVariants[0]?.id
      : rebasedVariants[0]?.id;

    next.productVariants = rebasedVariants as ProductVariant[];
    next.activeVariantId = mappedActiveVariantId;
  }

  return next;
};
