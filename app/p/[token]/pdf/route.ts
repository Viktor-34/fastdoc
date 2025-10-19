import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { htmlShell } from '@/lib/pdf/htmlShell';
import { launchPdfBrowser } from '@/lib/pdf/launchBrowser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const share = await prisma.shareLink.findUnique({ where: { token }, include: { document: true } });
  if (!share || (share.expiresAt && share.expiresAt < new Date())) {
    return new Response('Not found', { status: 404 });
  }
  if (!share.allowPdf) {
    return new Response('PDF disabled', { status: 403 });
  }

  try {
    const browser = await launchPdfBrowser();
    const page = await browser.newPage();
    await page.setContent(htmlShell(share.document.html, ''), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }, printBackground: true });
    await browser.close();
    const body = new Uint8Array(pdf);
    return new Response(body, { headers: { 'content-type': 'application/pdf' } });
  } catch (error) {
    console.error('Public PDF generation failed', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
}
