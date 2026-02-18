import { NextRequest } from 'next/server';
import { renderProposalToHtml } from '@/lib/pdf/renderProposal';
import { launchPdfBrowser } from '@/lib/pdf/launchBrowser';
import { generateCacheKey, getCachedPdf, setCachedPdf } from '@/lib/pdf/cache';
import { getServerAuthSession } from '@/lib/auth';
import { getActiveWorkspaceId } from '@/lib/workspace';
import { WORKSPACE_COOKIE, WORKSPACE_HEADER } from '@/lib/workspace-constants';
import { prisma } from '@/lib/db/prisma';
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
import type { Proposal } from '@/lib/types/proposal';
import { apiError } from '@/lib/api/response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return apiError('Unauthorized', 401);
  }

  const rawContentLength = req.headers.get('content-length');
  if (rawContentLength) {
    const contentLength = Number(rawContentLength);
    if (Number.isFinite(contentLength) && contentLength > 100 * 1024) {
      return apiError('Payload too large', 413);
    }
  }

  // Принимаем proposalId
  const { filename, proposalId } = await req.json();
  if (!proposalId) return apiError('proposalId required', 400);

  const headerWorkspace = req.headers.get(WORKSPACE_HEADER)?.trim();
  const cookieWorkspace = req.cookies.get(WORKSPACE_COOKIE)?.value?.trim();
  const workspaceId = await getActiveWorkspaceId(
    headerWorkspace ?? cookieWorkspace ?? session.user.workspaceId ?? null,
  );

  try {
    const proposal = await prisma.proposal.findFirst({
      where: { id: proposalId, workspaceId },
    });

    if (!proposal) {
      return apiError('Proposal not found', 404);
    }

    const pdfFilename = filename || `${proposal.title || 'proposal'}.pdf`;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    let client = null;
    if (proposal.clientId) {
      client = await prisma.client.findUnique({
        where: { id: proposal.clientId },
      });
    }

    // Проверяем кеш для proposal
    const cacheKey = generateCacheKey(proposalId, proposal.updatedAt.toISOString());
    const cachedPdf = await getCachedPdf(cacheKey);

    if (cachedPdf) {
      const encodedFilename = encodeURIComponent(pdfFilename);
      const asciiFilename = pdfFilename.replace(/[^\x00-\x7F]/g, '_');
      
      return new Response(new Uint8Array(cachedPdf), {
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
          [WORKSPACE_HEADER]: workspaceId,
          'x-cache': 'HIT',
        }
      });
    }

    const items = parseProposalItems(proposal.items);
    const galleryImages = safeParseStringArray(proposal.galleryImages);
    const advantages = parseAdvantages(proposal.advantages);
    const productVariants = parseProductVariants(proposal.productVariants);
    const visibleSections = parseOptionalStringArray(proposal.visibleSections);
    const parsedPricingMode = pricingModeSchema.safeParse(proposal.pricingMode);
    const normalizedPricingMode: Proposal['pricingMode'] = parsedPricingMode.success
      ? parsedPricingMode.data
      : 'single';
    const advantagesColumns = parseAdvantagesColumns(proposal.advantagesColumns);

    const normalizedStatus: NonNullable<Proposal['status']> =
      proposal.status === 'draft' ||
      proposal.status === 'sent' ||
      proposal.status === 'accepted' ||
      proposal.status === 'rejected'
        ? proposal.status
        : 'draft';

    const proposalPayload: Proposal = {
      ...proposal,
      items,
      galleryImages,
      pricingMode: normalizedPricingMode,
      productVariants,
      activeVariantId: proposal.activeVariantId ?? undefined,
      productsView: parseProductsView(proposal.productsView),
      advantages,
      advantagesColumns: advantagesColumns as 1 | 2 | 3,
      status: normalizedStatus,
      clientId: proposal.clientId ?? undefined,
      recipientName: proposal.recipientName ?? undefined,
      problemDesc: proposal.problemDesc ?? undefined,
      solutionDesc: proposal.solutionDesc ?? undefined,
      additionalDesc: proposal.additionalDesc ?? undefined,
      deadline: proposal.deadline ?? undefined,
      paymentTerms: proposal.paymentTerms ?? undefined,
      paymentCustom: proposal.paymentCustom ?? undefined,
      validUntil: proposal.validUntil ?? undefined,
      visibleSections,
      ctaText: proposal.ctaText ?? undefined,
      ctaPhone: proposal.ctaPhone ?? undefined,
      ctaEmail: proposal.ctaEmail ?? undefined,
      notes: proposal.notes ?? undefined,
    };

    const html = renderProposalToHtml({
      proposal: proposalPayload,
      workspace: workspace || undefined,
      client: client || undefined,
    });

    let browser: Awaited<ReturnType<typeof launchPdfBrowser>> | null = null;
    try {
      browser = await launchPdfBrowser();
      const page = await browser.newPage();

      // Быстрый рендер без ожидания вечного network idle.
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Ждём изображения, но не дольше 10 секунд.
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

      // Кодируем имя файла для поддержки кириллицы в заголовке
      const encodedFilename = encodeURIComponent(pdfFilename);
      const asciiFilename = pdfFilename.replace(/[^\x00-\x7F]/g, '_'); // Fallback для старых браузеров

      return new Response(body, {
        headers: {
          'content-type': 'application/pdf',
          // RFC 5987 формат для поддержки UTF-8 имён файлов
          'content-disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
          // Возвращаем workspaceId в заголовке, чтобы клиент мог синхронизироваться.
          [WORKSPACE_HEADER]: workspaceId,
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
    console.error('PDF generation failed', error);
    return apiError('Failed to generate PDF', 500);
  }
}
