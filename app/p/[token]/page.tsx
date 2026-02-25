import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { renderProposalToHtml } from '@/lib/pdf/renderProposal';
import { isProductVariantItemRow, type Proposal } from '@/lib/types/proposal';
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
import '@/styles/preview.css';
import PublicPreviewClient from './PublicPreviewClient';

interface PublicPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { token } = await params;
  const share = await prisma.shareLink.findUnique({
    where: { token },
    include: { 
      Proposal: {
        include: {
          Client: {
            select: {
              name: true,
              email: true,
              company: true,
            },
          },
          Workspace: {
            select: {
              name: true,
              logoUrl: true,
              companyName: true,
            },
          },
        },
      },
    }
  });

  if (!share || (share.expiresAt && share.expiresAt < new Date())) {
    return {
      title: 'Предложение не найдено',
      description: 'Запрошенное предложение не существует или срок его действия истек.',
    };
  }

  if (!share.Proposal) {
    return {
      title: 'Предложение не найдено',
      description: 'Запрошенное предложение не существует.',
    };
  }

  return {
    title: share.Proposal.title,
    description: share.Proposal.problemDesc || share.Proposal.solutionDesc || 'Коммерческое предложение',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { token } = await params;
  const share = await prisma.shareLink.findUnique({ 
    where: { token }, 
    include: { 
      Proposal: {
        include: {
          Client: {
            select: {
              name: true,
              email: true,
              company: true,
              middleName: true,
              position: true,
            },
          },
          Workspace: {
            select: {
              name: true,
              logoUrl: true,
              signatureUrl: true,
              stampUrl: true,
              companyName: true,
              inn: true,
              ogrn: true,
              legalAddress: true,
              bankName: true,
              bik: true,
              accountNumber: true,
            },
          },
        },
      },
    }
  });

  if (!share || (share.expiresAt && share.expiresAt < new Date())) {
    return notFound();
  }
  if (!share.Proposal) {
    return notFound();
  }

  // Обновляем счётчик просмотров
  prisma.shareLink.update({
    where: { token },
    data: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  }).catch((err) =>
    console.error("[public-page:view-count-update-failed]", {
      token,
      error:
        err instanceof Error
          ? { name: err.name, message: err.message }
          : String(err),
    }),
  );

  // Рендерим Proposal через тот же рендерер, что и PDF - для идентичного вида
  let proposalHtml = '';
  let variantPreviewTabs:
    | Array<{ id: string; name: string; isRecommended?: boolean; html: string }>
    | undefined;
  if (share.Proposal) {
    const items = parseProposalItems(share.Proposal.items);
    const galleryImages = safeParseStringArray(share.Proposal.galleryImages);
    const productVariants = parseProductVariants(share.Proposal.productVariants);
    const advantages = parseAdvantages(share.Proposal.advantages);
    const visibleSections = parseOptionalStringArray(share.Proposal.visibleSections);

    const normalizedStatus: NonNullable<Proposal['status']> =
      share.Proposal.status === 'draft' ||
      share.Proposal.status === 'sent' ||
      share.Proposal.status === 'accepted' ||
      share.Proposal.status === 'rejected'
        ? share.Proposal.status
        : 'draft';
    const parsedPricingMode = pricingModeSchema.safeParse(share.Proposal.pricingMode);
    const normalizedPricingMode: Proposal['pricingMode'] = parsedPricingMode.success
      ? parsedPricingMode.data
      : 'single';

    const proposalPayload: Proposal = {
      ...share.Proposal,
      items,
      pricingMode: normalizedPricingMode,
      productVariants,
      // В публичном предпросмотре всегда открываем первый вариант по умолчанию,
      // независимо от того, какой вариант был активен в редакторе.
      activeVariantId: productVariants[0]?.id ?? share.Proposal.activeVariantId ?? undefined,
      productsView: parseProductsView(share.Proposal.productsView),
      galleryImages,
      advantages,
      advantagesTitle: share.Proposal.advantagesTitle ?? undefined,
      advantagesColumns: parseAdvantagesColumns(share.Proposal.advantagesColumns),
      status: normalizedStatus,
      clientId: share.Proposal.clientId ?? undefined,
      recipientName: share.Proposal.recipientName ?? undefined,
      problemDesc: share.Proposal.problemDesc ?? undefined,
      solutionDesc: share.Proposal.solutionDesc ?? undefined,
      additionalDesc: share.Proposal.additionalDesc ?? undefined,
      deadline: share.Proposal.deadline ?? undefined,
      paymentTerms: share.Proposal.paymentTerms ?? undefined,
      paymentCustom: share.Proposal.paymentCustom ?? undefined,
      validUntil: share.Proposal.validUntil ?? undefined,
      visibleSections,
      ctaText: share.Proposal.ctaText ?? undefined,
      ctaPhone: share.Proposal.ctaPhone ?? undefined,
      ctaEmail: share.Proposal.ctaEmail ?? undefined,
      notes: share.Proposal.notes ?? undefined,
    };

    const renderContext = {
      workspace: share.Proposal.Workspace || undefined,
      client: share.Proposal.Client || undefined,
    };

    const nonEmptyVariants = productVariants.filter(
      (variant) => Array.isArray(variant.rows) && variant.rows.some(isProductVariantItemRow),
    );

    if (nonEmptyVariants.length > 1) {
      variantPreviewTabs = nonEmptyVariants.map((variant) => {
        const variantProposal: Proposal = {
          ...proposalPayload,
          productVariants: [variant],
          activeVariantId: variant.id,
        };

        return {
          id: variant.id,
          name: variant.name,
          isRecommended: variant.isRecommended,
          html: renderProposalToHtml({
            proposal: variantProposal,
            publicPreviewVariantTabsSpacerPx: 72,
            ...renderContext,
          }),
        };
      });

      proposalHtml = variantPreviewTabs[0]?.html ?? '';
    } else {
      proposalHtml = renderProposalToHtml({
        proposal: proposalPayload,
        ...renderContext,
      });
    }
  }

  return (
    <PublicPreviewClient
      token={token}
      proposalHtml={proposalHtml}
      variantPreviewTabs={variantPreviewTabs}
    />
  );
}
