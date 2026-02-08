import { NextRequest } from 'next/server';
import { renderProposalToHtml } from '@/lib/pdf/renderProposal';
import { launchPdfBrowser } from '@/lib/pdf/launchBrowser';
import { generateCacheKey, getCachedPdf, setCachedPdf } from '@/lib/pdf/cache';
import { getServerAuthSession } from '@/lib/auth';
import { getActiveWorkspaceId } from '@/lib/workspace';
import { WORKSPACE_COOKIE, WORKSPACE_HEADER } from '@/lib/workspace-constants';
import { prisma } from '@/lib/db/prisma';
import type { AdvantageItem, ProductVariant, Proposal, ProposalItem } from '@/lib/types/proposal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const rawContentLength = req.headers.get('content-length');
  if (rawContentLength) {
    const contentLength = Number(rawContentLength);
    if (Number.isFinite(contentLength) && contentLength > 100 * 1024) {
      return new Response('Payload too large', { status: 413 });
    }
  }

  // Принимаем proposalId
  const { filename, proposalId } = await req.json();
  if (!proposalId) return new Response('proposalId required', { status: 400 });

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
      return new Response('Proposal not found', { status: 404 });
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

    const items = Array.isArray(proposal.items)
      ? (proposal.items as unknown as ProposalItem[])
      : [];
    const galleryImages = Array.isArray(proposal.galleryImages)
      ? (proposal.galleryImages as unknown as string[])
      : [];
    const advantages = Array.isArray(proposal.advantages)
      ? (proposal.advantages as unknown as AdvantageItem[])
      : [];
    const productVariants = Array.isArray(proposal.productVariants)
      ? (proposal.productVariants as unknown as ProductVariant[])
      : [];
    const normalizedPricingMode: Proposal['pricingMode'] =
      proposal.pricingMode === 'variants' ? 'variants' : 'single';
    const advantagesColumns =
      typeof proposal.advantagesColumns === 'number'
        ? Math.min(3, Math.max(1, proposal.advantagesColumns))
        : 3;

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
      productsView:
        proposal.productsView && typeof proposal.productsView === 'object'
          ? (proposal.productsView as Proposal['productsView'])
          : undefined,
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
      visibleSections: Array.isArray(proposal.visibleSections)
        ? (proposal.visibleSections as unknown as string[])
        : undefined,
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
    
    const browser = await launchPdfBrowser();
    const page = await browser.newPage();
    
    // Устанавливаем content с оптимизированными настройками
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Ждем загрузки изображений
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.onload = img.onerror = resolve;
          }))
      );
    });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
      preferCSSPageSize: true,
    });
    
    await browser.close();

    const body = new Uint8Array(pdf);
    const pdfBuffer = Buffer.from(pdf);
    
    // Сохраняем в кеш асинхронно
    setCachedPdf(cacheKey, pdfBuffer).catch(err => 
      console.error('[PDF] Failed to cache:', err)
    );
    
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
      }
    });
  } catch (error) {
    console.error('PDF generation failed', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
}
