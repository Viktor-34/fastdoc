import { NextRequest } from 'next/server';
import { htmlShell } from '@/lib/pdf/htmlShell';
import { launchPdfBrowser } from '@/lib/pdf/launchBrowser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { html } = await req.json();
  if (!html) return new Response('No HTML', { status: 400 });

  try {
    const browser = await launchPdfBrowser();
    const page = await browser.newPage();
    await page.setContent(htmlShell(html), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top:'20mm', right:'15mm', bottom:'20mm', left:'15mm' },
      printBackground: true,
    });
    await browser.close();

    const body = new Uint8Array(pdf);
    return new Response(body, {
      headers: { 'content-type':'application/pdf', 'content-disposition':'attachment; filename="proposal.pdf"' }
    });
  } catch (error) {
    console.error('Web API PDF generation failed', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
}
