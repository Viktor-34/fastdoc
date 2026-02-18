import type { Proposal } from './proposal';

export const PROPOSAL_SECTION_IDS = [
  'basic',
  'context',
  'advantages',
  'products',
  'terms',
  'gallery',
  'contacts',
] as const;

export type ProposalSectionId = (typeof PROPOSAL_SECTION_IDS)[number];

export interface ProposalTemplate {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  defaults: Partial<Proposal>;
  sections: ProposalSectionId[];
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const TEMPLATE_DEFAULT_ALLOWED_KEYS = [
  'problemDesc',
  'solutionDesc',
  'additionalDesc',
  'items',
  'currency',
  'pricingMode',
  'productVariants',
  'activeVariantId',
  'productsView',
  'deadline',
  'paymentTerms',
  'paymentCustom',
  'includeVat',
  'vatRate',
  'galleryImages',
  'advantages',
  'advantagesColumns',
  'ctaText',
  'notes',
] as const satisfies ReadonlyArray<keyof Proposal>;
