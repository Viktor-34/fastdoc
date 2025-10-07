import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { htmlShell } from '@/lib/pdf/htmlShell';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const share = await prisma.shareLink.findUnique({ where: { token }, include: { document: true } });
  if (!share || (share.expiresAt && share.expiresAt < new Date()) || !share.allowPdf) {
    return new Response('Not found', { status: 404 });
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(htmlShell(share.document.html, ''), { waitUntil: 'networkidle' });
  const pdf = await page.pdf({ format: 'A4', margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }, printBackground: true });
  await browser.close();
  const body = new Uint8Array(pdf);
  return new Response(body, { headers: { 'content-type': 'application/pdf' } });
}


