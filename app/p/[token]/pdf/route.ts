import { NextRequest } from 'next/server';
import { renderProposalToHtml } from '@/lib/pdf/renderProposal';
import { launchPdfBrowser } from '@/lib/pdf/launchBrowser';
import { generateCacheKey, getCachedPdf, setCachedPdf } from '@/lib/pdf/cache';
import { prisma } from '@/lib/db/prisma';
import type { AdvantageItem, ProductVariant, Proposal, ProposalItem } from '@/lib/types/proposal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
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
    return new Response('Not found', { status: 404 });
  }

  if (!share.allowPdf) {
    return new Response('PDF disabled', { status: 403 });
  }
  if (!share.Proposal) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const cacheKey = generateCacheKey(share.proposalId!, share.Proposal.updatedAt.toISOString());
    const cachedPdf = await getCachedPdf(cacheKey);
    const pdfFilename = `${share.Proposal.title || 'proposal'}.pdf`;

    if (cachedPdf) {
      const encodedFilename = encodeURIComponent(pdfFilename);
      const asciiFilename = pdfFilename.replace(/[^\x00-\x7F]/g, '_');
      
      return new Response(new Uint8Array(cachedPdf), { 
        headers: { 
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
          'x-cache': 'HIT',
        } 
      });
    }

    const normalizedStatus: NonNullable<Proposal['status']> =
      share.Proposal.status === 'draft' ||
      share.Proposal.status === 'sent' ||
      share.Proposal.status === 'accepted' ||
      share.Proposal.status === 'rejected'
        ? share.Proposal.status
        : 'draft';
    const normalizedPricingMode: Proposal['pricingMode'] =
      share.Proposal.pricingMode === 'variants' ? 'variants' : 'single';

    const proposalPayload: Proposal = {
      ...share.Proposal,
      items: Array.isArray(share.Proposal.items)
        ? (share.Proposal.items as unknown as ProposalItem[])
        : [],
      pricingMode: normalizedPricingMode,
      productVariants: Array.isArray(share.Proposal.productVariants)
        ? (share.Proposal.productVariants as unknown as ProductVariant[])
        : [],
      activeVariantId: share.Proposal.activeVariantId ?? undefined,
      productsView:
        share.Proposal.productsView && typeof share.Proposal.productsView === 'object'
          ? (share.Proposal.productsView as Proposal['productsView'])
          : undefined,
      galleryImages: Array.isArray(share.Proposal.galleryImages)
        ? (share.Proposal.galleryImages as unknown as string[])
        : [],
      advantages: Array.isArray(share.Proposal.advantages)
        ? (share.Proposal.advantages as unknown as AdvantageItem[])
        : [],
      advantagesColumns:
        typeof share.Proposal.advantagesColumns === 'number'
          ? (Math.min(3, Math.max(1, share.Proposal.advantagesColumns)) as 1 | 2 | 3)
          : 3,
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
      visibleSections: Array.isArray(share.Proposal.visibleSections)
        ? (share.Proposal.visibleSections as unknown as string[])
        : undefined,
      ctaText: share.Proposal.ctaText ?? undefined,
      ctaPhone: share.Proposal.ctaPhone ?? undefined,
      ctaEmail: share.Proposal.ctaEmail ?? undefined,
      notes: share.Proposal.notes ?? undefined,
    };

    const html = renderProposalToHtml({
      proposal: proposalPayload,
      workspace: share.Proposal.Workspace || undefined,
      client: share.Proposal.Client || undefined,
    });

    let browser: Awaited<ReturnType<typeof launchPdfBrowser>> | null = null;
    try {
      browser = await launchPdfBrowser();
      const page = await browser.newPage();

      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await page.evaluate(async () => {
        const pending = Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }),
          );

        await Promise.race([
          Promise.all(pending),
          new Promise<void>((resolve) => setTimeout(resolve, 10000)),
        ]);
      });

      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true,
        preferCSSPageSize: true,
      });

      const body = new Uint8Array(pdf);
      const pdfBuffer = Buffer.from(pdf);

      // Сохраняем в кеш асинхронно
      setCachedPdf(cacheKey, pdfBuffer).catch((err) => console.error('[PDF] Failed to cache:', err));

      // Кодируем имя файла
      const encodedFilename = encodeURIComponent(pdfFilename);
      const asciiFilename = pdfFilename.replace(/[^\x00-\x7F]/g, '_');

      return new Response(body, {
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
          'x-cache': 'MISS',
        },
      });
    } finally {
      if (browser) {
        await browser.close().catch((closeError) => {
          console.error('[PDF] Failed to close browser:', closeError);
        });
      }
    }
  } catch (error) {
    console.error('Public PDF generation failed', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
}
